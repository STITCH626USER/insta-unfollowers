document.addEventListener('DOMContentLoaded', () => {
    const followersZone = document.getElementById('followers-zone');
    const followersInput = document.getElementById('followers-input');
    const followingZone = document.getElementById('following-zone');
    const followingInput = document.getElementById('following-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsDiv = document.getElementById('results');
    const countBadge = document.getElementById('count-badge');
    const unfollowersList = document.getElementById('unfollowers-list');

    let followersData = null;
    let followingData = null;

    // Handle drag and drop visuals
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        followersZone.addEventListener(eventName, preventDefaults, false);
        followingZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        followersZone.addEventListener(eventName, () => followersZone.classList.add('dragover'), false);
        followingZone.addEventListener(eventName, () => followingZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        followersZone.addEventListener(eventName, () => followersZone.classList.remove('dragover'), false);
        followingZone.addEventListener(eventName, () => followingZone.classList.remove('dragover'), false);
    });

    // Handle file drops
    followersZone.addEventListener('drop', (e) => handleDrop(e, 'followers'), false);
    followingZone.addEventListener('drop', (e) => handleDrop(e, 'following'), false);

    // Handle file inputs (click to select)
    followersInput.addEventListener('change', (e) => handleFileSelect(e, 'followers'), false);
    followingInput.addEventListener('change', (e) => handleFileSelect(e, 'following'), false);

    function handleDrop(e, type) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            processFile(files[0], type);
        }
    }

    function handleFileSelect(e, type) {
        if (e.target.files.length) {
            processFile(e.target.files[0], type);
        }
    }

    function processFile(file, type) {
        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            alert("Please drop a valid JSON file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (type === 'followers') {
                    followersData = data;
                    followersZone.classList.add('success');
                    followersZone.querySelector('.text').innerHTML = '✅ <b>followers</b> loaded';
                } else {
                    followingData = data;
                    followingZone.classList.add('success');
                    followingZone.querySelector('.text').innerHTML = '✅ <b>following</b> loaded';
                }
                checkReady();
            } catch (err) {
                alert("Error parsing JSON file. Please ensure it's the correct Instagram export file.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    }

    function checkReady() {
        if (followersData && followingData) {
            analyzeBtn.disabled = false;
        }
    }

    // Extract usernames robustly from Instagram's JSON structures
    function extractUsernames(data) {
        const usernames = new Set();
        
        function search(obj) {
            if (!obj) return;
            
            if (Array.isArray(obj)) {
                obj.forEach(search);
            } else if (typeof obj === 'object') {
                if (obj.string_list_data && Array.isArray(obj.string_list_data)) {
                    obj.string_list_data.forEach(item => {
                        if (item.value) usernames.add(item.value);
                    });
                } else {
                    for (const key in obj) {
                        search(obj[key]);
                    }
                }
            }
        }
        
        search(data);
        return usernames;
    }

    analyzeBtn.addEventListener('click', () => {
        if (!followersData || !followingData) return;

        const followersSet = extractUsernames(followersData);
        const followingSet = extractUsernames(followingData);

        const unfollowers = [];
        
        followingSet.forEach(user => {
            if (!followersSet.has(user)) {
                unfollowers.push(user);
            }
        });

        displayResults(unfollowers);
    });

    function displayResults(unfollowers) {
        resultsDiv.classList.remove('hidden');
        countBadge.textContent = unfollowers.length;
        unfollowersList.innerHTML = '';

        if (unfollowers.length === 0) {
            unfollowersList.innerHTML = '<li class="user-item"><span class="username">Congratulations! Everyone you follow follows you back. 🎉</span></li>';
            return;
        }

        unfollowers.forEach(username => {
            const li = document.createElement('li');
            li.className = 'user-item';
            
            // Generate standard Instagram URL which acts as an App Link on mobile
            const profileUrl = `https://www.instagram.com/${username}/`;
            
            li.innerHTML = `
                <span class="username">@${username}</span>
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="profile-link">View Profile</a>
            `;
            unfollowersList.appendChild(li);
        });
        
        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }
});
