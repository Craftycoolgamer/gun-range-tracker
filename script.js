class LaneTracker {
    constructor() {
        this.lanes = [];
        this.laneCounter = 0;
        this.timers = new Map();
        this.init();
    }

    init() {
        this.loadLanes();
        this.loadHeaderSettings();
        this.renderLanes();
        this.setupEventListeners();
        this.startTimerLoop();
    }

    setupEventListeners() {
        document.getElementById('configureLanesBtn').addEventListener('click', () => this.openLaneConfig());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('cancelSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('logoFileInput').addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('removeLogoBtn').addEventListener('click', () => this.removeLogo());
        
        // Lane configuration modal
        document.getElementById('closeLaneConfigBtn').addEventListener('click', () => this.closeLaneConfig());
        document.getElementById('cancelLaneConfigBtn').addEventListener('click', () => this.closeLaneConfig());
        document.getElementById('saveLaneConfigBtn').addEventListener('click', () => this.saveLaneConfig());
        document.getElementById('laneCountInput').addEventListener('input', (e) => this.updateLaneNameInputs(e.target.value));
        
        // Close modals when clicking outside
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
        document.getElementById('laneConfigModal').addEventListener('click', (e) => {
            if (e.target.id === 'laneConfigModal') {
                this.closeLaneConfig();
            }
        });
    }

    openLaneConfig() {
        const modal = document.getElementById('laneConfigModal');
        const laneCountInput = document.getElementById('laneCountInput');
        const currentLaneCount = this.lanes.length;
        
        laneCountInput.value = currentLaneCount || 1;
        this.updateLaneNameInputs(laneCountInput.value);
        
        modal.classList.add('show');
    }

    closeLaneConfig() {
        const modal = document.getElementById('laneConfigModal');
        modal.classList.remove('show');
    }

    updateLaneNameInputs(count) {
        const container = document.getElementById('laneNamesContainer');
        const laneCount = Math.max(1, Math.min(50, parseInt(count) || 1));
        
        container.innerHTML = '';
        
        for (let i = 1; i <= laneCount; i++) {
            const existingLane = this.lanes[i - 1];
            const defaultName = existingLane ? existingLane.name : `Lane ${i}`;
            
            const card = document.createElement('div');
            card.className = 'lane-config-card';
            card.dataset.laneIndex = i - 1;
            card.innerHTML = `
                <div class="lane-config-card-content" onclick="tracker.startEditingLaneConfigName(${i - 1})">
                    <span class="lane-config-name" data-lane-index="${i - 1}">${defaultName}</span>
                </div>
            `;
            container.appendChild(card);
        }
    }

    startEditingLaneConfigName(laneIndex) {
        const card = document.querySelector(`.lane-config-card[data-lane-index="${laneIndex}"]`);
        if (!card) return;

        // Check if already editing
        const existingInput = card.querySelector('.lane-config-name-input');
        if (existingInput) {
            existingInput.focus();
            return;
        }

        const nameElement = card.querySelector('.lane-config-name');
        if (!nameElement) return;
        
        const currentName = nameElement.textContent;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'lane-config-name-input';
        input.value = currentName;
        input.dataset.laneIndex = laneIndex;
        
        const finishEdit = () => {
            const newName = input.value.trim() || `Lane ${parseInt(laneIndex) + 1}`;
            nameElement.textContent = newName;
            nameElement.style.display = 'block';
            input.remove();
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                nameElement.style.display = 'block';
                input.remove();
            }
        });

        // Prevent card click from firing when clicking input
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        nameElement.style.display = 'none';
        nameElement.parentElement.appendChild(input);
        input.focus();
        input.select();
    }

    saveLaneConfig() {
        const laneCountInput = document.getElementById('laneCountInput');
        const laneNameElements = document.querySelectorAll('.lane-config-name');
        const newLaneCount = Math.max(1, Math.min(50, parseInt(laneCountInput.value) || 1));
        
        // Get all lane names from cards
        const laneNames = Array.from(laneNameElements).map((element, index) => {
            const name = element.textContent.trim();
            return name || `Lane ${index + 1}`;
        });
        
        // Store existing lanes data for preservation
        const existingLanesMap = new Map();
        this.lanes.forEach(lane => {
            existingLanesMap.set(lane.number, lane);
        });
        
        // Clear timers for lanes that will be removed
        const newLaneNumbers = new Set();
        for (let i = 1; i <= newLaneCount; i++) {
            newLaneNumbers.add(i);
        }
        this.lanes.forEach(lane => {
            if (!newLaneNumbers.has(lane.number)) {
                this.timers.delete(lane.id);
            }
        });
        
        // Create/update lanes
        const newLanes = [];
        for (let i = 1; i <= newLaneCount; i++) {
            const existingLane = existingLanesMap.get(i);
            if (existingLane) {
                // Preserve existing lane data, just update the name
                existingLane.name = laneNames[i - 1] || `Lane ${i}`;
                newLanes.push(existingLane);
            } else {
                // Create new lane
                this.laneCounter = Math.max(this.laneCounter, i);
                const lane = {
                    id: Date.now() + i, // Ensure unique IDs
                    number: i,
                    name: laneNames[i - 1] || `Lane ${i}`,
                    timeLimit: 30, // default 30 minutes
                    startTime: null,
                    isActive: false,
                    remainingTime: null // stores remaining time in seconds when stopped
                };
                newLanes.push(lane);
            }
        }
        
        this.lanes = newLanes;
        this.saveLanes();
        this.renderLanes();
        this.closeLaneConfig();
    }

    removeLane(laneId) {
        this.lanes = this.lanes.filter(lane => lane.id !== laneId);
        this.timers.delete(laneId);
        this.saveLanes();
        this.renderLanes();
    }

    startLane(laneId) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (lane) {
            // If there's a preserved remaining time, use it to adjust the start time
            if (lane.remainingTime !== null && lane.remainingTime > 0) {
                // Calculate what the startTime should be to show the remaining time
                const targetRemainingSeconds = lane.remainingTime;
                lane.startTime = Date.now() - ((lane.timeLimit * 60 - targetRemainingSeconds) * 1000);
                lane.remainingTime = null; // Clear preserved time
            } else {
                lane.startTime = Date.now();
            }
            lane.isActive = true;
            this.saveLanes();
            this.renderLanes();
        }
    }

    stopLane(laneId) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (lane) {
            // Calculate and preserve remaining time before stopping
            if (lane.isActive && lane.startTime) {
                const remainingSeconds = this.calculateRemainingTime(lane);
                lane.remainingTime = Math.max(0, remainingSeconds);
            }
            lane.startTime = null;
            lane.isActive = false;
            this.saveLanes();
            this.renderLanes();
        }
    }

    resetLane(laneId) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (lane) {
            lane.startTime = null;
            lane.isActive = false;
            lane.remainingTime = null; // Clear preserved time on reset
            this.saveLanes();
            this.renderLanes();
        }
    }

    updateTimeLimit(laneId, minutes) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (lane) {
            lane.timeLimit = Math.max(1, Math.min(999, parseInt(minutes) || 30));
            this.saveLanes();
            this.renderLanes();
        }
    }

    updateLaneName(laneId, newName) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (lane) {
            lane.name = newName.trim() || `Lane ${lane.number}`;
            this.saveLanes();
            this.renderLanes();
        }
    }

    startEditingLaneName(laneId) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (!lane) return;

        const card = document.querySelector(`[data-lane-id="${lane.id}"]`);
        if (!card) return;

        const laneNumberElement = card.querySelector('.lane-number');
        const currentName = lane.name;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'lane-name-input';
        input.value = currentName;
        input.style.width = '100%';
        input.style.fontSize = '1.5rem';
        input.style.fontWeight = '700';
        input.style.border = '2px solid #667eea';
        input.style.borderRadius = '6px';
        input.style.padding = '4px 8px';
        
        const finishEdit = () => {
            const newName = input.value.trim();
            this.updateLaneName(laneId, newName || `Lane ${lane.number}`);
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.renderLanes();
            }
        });

        laneNumberElement.replaceWith(input);
        input.focus();
        input.select();
    }

    addTimeToLane(laneId, minutes) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (!lane) return;

        const minutesToAdd = Math.max(0, parseInt(minutes) || 0);
        if (minutesToAdd === 0) return;

        if (lane.isActive && lane.startTime) {
            // If timer is active, increase the time limit to add time
            lane.timeLimit = Math.min(999, lane.timeLimit + minutesToAdd);
        } else {
            // If timer is not active, add to preserved remaining time or time limit
            const secondsToAdd = minutesToAdd * 60;
            if (lane.remainingTime !== null) {
                lane.remainingTime = Math.min(999 * 60, lane.remainingTime + secondsToAdd);
            } else {
                lane.timeLimit = Math.min(999, lane.timeLimit + minutesToAdd);
            }
        }

        this.saveLanes();
        this.renderLanes();
    }

    subtractTimeFromLane(laneId, minutes) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (!lane) return;

        const minutesToSubtract = Math.max(0, parseInt(minutes) || 0);
        if (minutesToSubtract === 0) return;

        if (lane.isActive && lane.startTime) {
            // If timer is active, decrease the time limit to subtract time
            lane.timeLimit = Math.max(1, lane.timeLimit - minutesToSubtract);
        } else {
            // If timer is not active, subtract from preserved remaining time or time limit
            const secondsToSubtract = minutesToSubtract * 60;
            if (lane.remainingTime !== null) {
                lane.remainingTime = Math.max(0, lane.remainingTime - secondsToSubtract);
            } else {
                lane.timeLimit = Math.max(1, lane.timeLimit - minutesToSubtract);
            }
        }

        this.saveLanes();
        this.renderLanes();
    }

    clearAll() {
        if (confirm('Are you sure you want to reset all timers?')) {
            this.lanes.forEach(lane => {
                lane.startTime = null;
                lane.isActive = false;
                lane.remainingTime = null; // Clear preserved time
            });
            this.timers.clear();
            this.saveLanes();
            this.renderLanes();
        }
    }

    calculateRemainingTime(lane) {
        if (!lane.isActive || !lane.startTime) {
            // If there's a preserved remaining time, use it; otherwise use timeLimit
            if (lane.remainingTime !== null) {
                return lane.remainingTime;
            }
            return lane.timeLimit * 60; // return in seconds
        }

        const elapsed = (Date.now() - lane.startTime) / 1000; // elapsed in seconds
        const remaining = (lane.timeLimit * 60) - elapsed;
        return Math.max(0, remaining);
    }

    formatTime(seconds) {
        const totalSeconds = Math.floor(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    getTimeStatus(remainingSeconds, timeLimit) {
        if (remainingSeconds === 0) return 'expired';
        if (remainingSeconds <= 300) return 'warning'; // 5 minutes or less
        return 'normal';
    }

    isLaneExpired(lane) {
        if (!lane.isActive || !lane.startTime) {
            return false;
        }
        const remainingSeconds = this.calculateRemainingTime(lane);
        return remainingSeconds === 0;
    }

    isLaneWarning(lane) {
        if (!lane.isActive || !lane.startTime) {
            return false;
        }
        const remainingSeconds = this.calculateRemainingTime(lane);
        return remainingSeconds > 0 && remainingSeconds <= 300; // 5 minutes or less
    }

    isLanePaused(lane) {
        return !lane.isActive && lane.remainingTime !== null && lane.remainingTime > 0;
    }

    scrollToLane(laneId) {
        const laneCard = document.querySelector(`[data-lane-id="${laneId}"]`);
        if (laneCard) {
            laneCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a highlight effect
            laneCard.style.transition = 'box-shadow 0.3s ease';
            laneCard.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.6)';
            setTimeout(() => {
                laneCard.style.boxShadow = '';
            }, 2000);
        }
    }

    renderNavigationBar() {
        const navBar = document.getElementById('laneNavBar');
        const lanesContainer = document.getElementById('laneNavLanes');
        
        if (!lanesContainer || !navBar) return;

        // Hide navigation bar if there are no lanes
        if (this.lanes.length === 0) {
            navBar.style.display = 'none';
            return;
        }

        navBar.style.display = 'flex';

        // Sort lanes: expired first, then warning, then started, then paused, then not-started
        const sortedLanes = [...this.lanes].sort((a, b) => {
            const aExpired = this.isLaneExpired(a);
            const bExpired = this.isLaneExpired(b);
            const aWarning = this.isLaneWarning(a);
            const bWarning = this.isLaneWarning(b);
            const aPaused = this.isLanePaused(a);
            const bPaused = this.isLanePaused(b);
            const aNotStarted = !a.isActive && !aPaused;
            const bNotStarted = !b.isActive && !bPaused;
            
            // Expired lanes first
            if (aExpired && !bExpired) return -1;
            if (!aExpired && bExpired) return 1;
            
            // Warning lanes second (if both not expired)
            if (!aExpired && !bExpired) {
                if (aWarning && !bWarning && !bNotStarted && !bPaused) return -1;
                if (!aWarning && bWarning && !aNotStarted && !aPaused) return 1;
            }
            
            // Paused lanes before not-started
            if (aPaused && !bPaused && bNotStarted) return -1;
            if (!aPaused && bPaused && aNotStarted) return 1;
            
            // Not-started lanes last
            if (aNotStarted && !bNotStarted) return 1;
            if (!aNotStarted && bNotStarted) return -1;
            
            // Maintain original order otherwise
            return 0;
        });

        // Render all lanes in a single list
        if (sortedLanes.length === 0) {
            lanesContainer.innerHTML = '<span style="color: #a0aec0; font-style: italic;">No lanes</span>';
        } else {
            lanesContainer.innerHTML = sortedLanes.map(lane => {
                const isExpired = this.isLaneExpired(lane);
                const isWarning = this.isLaneWarning(lane);
                const isPaused = this.isLanePaused(lane);
                const isNotStarted = !lane.isActive && !isPaused;
                let itemClass = 'nav-lane-item';
                
                if (isExpired) {
                    itemClass += ' nav-lane-item-expired';
                } else if (isWarning) {
                    itemClass += ' nav-lane-item-warning';
                } else if (isPaused) {
                    itemClass += ' nav-lane-item-paused';
                } else if (isNotStarted) {
                    itemClass += ' nav-lane-item-not-started';
                } else {
                    itemClass += ' nav-lane-item-started';
                }
                
                return `
                    <div class="${itemClass}" onclick="tracker.scrollToLane(${lane.id})">
                        ${lane.name || `Lane ${lane.number}`}
                    </div>
                `;
            }).join('');
        }
    }

    updateLaneDisplay(lane) {
        const card = document.querySelector(`[data-lane-id="${lane.id}"]`);
        if (!card) return;

        const remainingSeconds = this.calculateRemainingTime(lane);
        const timeDisplay = card.querySelector('.time-remaining');
        const statusText = card.querySelector('.status-text');
        const startBtn = card.querySelector('.start-btn');
        const stopBtn = card.querySelector('.stop-btn');

        timeDisplay.textContent = this.formatTime(remainingSeconds);
        
        // Update card and time display classes
        card.className = 'lane-card';
        timeDisplay.className = 'time-remaining';
        
        if (lane.isActive) {
            const status = this.getTimeStatus(remainingSeconds, lane.timeLimit);
            card.classList.add('active');
            
            if (status === 'warning') {
                card.classList.add('warning');
                timeDisplay.classList.add('warning');
                statusText.textContent = 'Time Running Low';
            } else if (status === 'expired') {
                card.classList.add('expired');
                timeDisplay.classList.add('expired');
                statusText.textContent = 'Time Expired';
            } else {
                statusText.textContent = 'Active';
            }
            
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
        } else {
            // Check if paused (has remainingTime) or not started
            if (lane.remainingTime !== null && lane.remainingTime > 0) {
                statusText.textContent = 'Paused';
                card.classList.add('paused');
            } else {
                statusText.textContent = 'Not Started';
            }
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
        }
    }

    renderLanes() {
        const container = document.getElementById('lanesContainer');
        
        if (this.lanes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h2>No Lanes Added</h2>
                    <p>Click "Configure Lanes" to set up your lanes</p>
                </div>
            `;
            this.renderNavigationBar();
            return;
        }

        container.innerHTML = this.lanes.map(lane => `
            <div class="lane-card" data-lane-id="${lane.id}" id="lane-${lane.id}">
                <div class="lane-header">
                    <div class="lane-number">${lane.name || `Lane ${lane.number}`}</div>
                </div>
                <div class="timer-display">
                    <div class="time-remaining">${this.formatTime(this.calculateRemainingTime(lane))}</div>
                    <div class="status-text">${lane.isActive ? 'Active' : (lane.remainingTime !== null && lane.remainingTime > 0 ? 'Paused' : 'Not Started')}</div>
                </div>
                <div class="lane-controls">
                    <div class="time-input-group">
                        <label class="time-input-label">Time Limit (minutes):</label>
                        <input 
                            type="number" 
                            class="time-input" 
                            value="${lane.timeLimit}" 
                            min="1" 
                            max="999"
                            onchange="tracker.updateTimeLimit(${lane.id}, this.value)"
                            ${lane.isActive ? 'disabled' : ''}
                        >
                    </div>
                    <div class="add-time-group">
                        <label class="time-input-label">Add Time (minutes):</label>
                        <div class="add-time-controls">
                            <input 
                                type="number" 
                                class="time-input add-time-input" 
                                id="addTimeInput-${lane.id}"
                                value="5" 
                                min="1" 
                                max="999"
                                placeholder="5"
                            >
                            <button 
                                class="btn btn-primary add-time-btn" 
                                onclick="tracker.addTimeToLane(${lane.id}, document.getElementById('addTimeInput-${lane.id}').value)"
                            >
                                Add Time
                            </button>
                        </div>
                        <div class="quick-add-buttons">
                            <button class="btn-small btn-primary" onclick="tracker.addTimeToLane(${lane.id}, 5)">+5</button>
                            <button class="btn-small btn-primary" onclick="tracker.addTimeToLane(${lane.id}, 10)">+10</button>
                            <button class="btn-small btn-primary" onclick="tracker.addTimeToLane(${lane.id}, 15)">+15</button>
                            <button class="btn-small btn-primary" onclick="tracker.addTimeToLane(${lane.id}, 30)">+30</button>
                        </div>
                    </div>
                    <div class="lane-buttons">
                        <button 
                            class="btn btn-success start-btn" 
                            onclick="tracker.startLane(${lane.id})"
                            style="display: ${lane.isActive ? 'none' : 'block'};"
                        >
                            Start
                        </button>
                        <button 
                            class="btn btn-danger stop-btn" 
                            onclick="tracker.stopLane(${lane.id})"
                            style="display: ${lane.isActive ? 'block' : 'none'};"
                        >
                            Stop
                        </button>
                        <button 
                            class="btn btn-secondary" 
                            onclick="tracker.resetLane(${lane.id})"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Update all lane displays
        this.lanes.forEach(lane => this.updateLaneDisplay(lane));
        
        // Update navigation bar
        this.renderNavigationBar();
    }

    startTimerLoop() {
        setInterval(() => {
            let hasActiveLanes = false;
            this.lanes.forEach(lane => {
                if (lane.isActive) {
                    hasActiveLanes = true;
                    this.updateLaneDisplay(lane);
                }
            });
            // Update navigation bar whenever there are active lanes to ensure accurate status
            if (hasActiveLanes || this.lanes.some(lane => this.isLaneExpired(lane))) {
                this.renderNavigationBar();
            }
        }, 1000); // Update every second
    }

    saveLanes() {
        localStorage.setItem('gunRangeLanes', JSON.stringify(this.lanes));
        localStorage.setItem('gunRangeLaneCounter', this.laneCounter.toString());
    }

    loadLanes() {
        const saved = localStorage.getItem('gunRangeLanes');
        const counter = localStorage.getItem('gunRangeLaneCounter');
        
        if (saved) {
            this.lanes = JSON.parse(saved);
            this.lanes.forEach(lane => {
                // Convert startTime back to number if it was saved as string
                if (lane.startTime && typeof lane.startTime === 'string') {
                    lane.startTime = parseInt(lane.startTime);
                }
                // Set default name if it doesn't exist (for backward compatibility)
                if (!lane.name) {
                    lane.name = `Lane ${lane.number}`;
                }
                // Initialize remainingTime if it doesn't exist (for backward compatibility)
                if (lane.remainingTime === undefined) {
                    lane.remainingTime = null;
                }
            });
        }
        
        if (counter) {
            this.laneCounter = parseInt(counter);
        }
    }

    // Header Settings Functions
    loadHeaderSettings() {
        const headerText = localStorage.getItem('gunRangeHeaderText');
        const logoDataUrl = localStorage.getItem('gunRangeLogo');
        
        if (headerText) {
            document.getElementById('headerText').textContent = headerText;
        }
        
        if (logoDataUrl) {
            const logoImg = document.getElementById('logoImage');
            logoImg.src = logoDataUrl;
            document.getElementById('headerLogo').style.display = 'flex';
        }
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        const headerText = document.getElementById('headerText').textContent;
        const logoDataUrl = localStorage.getItem('gunRangeLogo');
        
        document.getElementById('headerTextInput').value = headerText;
        
        const logoPreview = document.getElementById('logoPreview');
        if (logoDataUrl) {
            document.getElementById('logoPreviewImage').src = logoDataUrl;
            logoPreview.style.display = 'flex';
        } else {
            logoPreview.style.display = 'none';
        }
        
        modal.classList.add('show');
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
        // Reset file input
        document.getElementById('logoFileInput').value = '';
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const logoPreview = document.getElementById('logoPreview');
            document.getElementById('logoPreviewImage').src = e.target.result;
            logoPreview.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    removeLogo() {
        document.getElementById('logoPreview').style.display = 'none';
        document.getElementById('logoFileInput').value = '';
        document.getElementById('logoPreviewImage').src = '';
    }

    saveSettings() {
        const headerText = document.getElementById('headerTextInput').value.trim();
        const logoPreview = document.getElementById('logoPreviewImage');
        
        // Save header text
        if (headerText) {
            localStorage.setItem('gunRangeHeaderText', headerText);
            document.getElementById('headerText').textContent = headerText;
        } else {
            localStorage.removeItem('gunRangeHeaderText');
            document.getElementById('headerText').textContent = 'Lane Tracker';
        }
        
        // Save logo
        if (logoPreview.src && logoPreview.src !== window.location.href) {
            localStorage.setItem('gunRangeLogo', logoPreview.src);
            const logoImg = document.getElementById('logoImage');
            logoImg.src = logoPreview.src;
            document.getElementById('headerLogo').style.display = 'flex';
        } else {
            localStorage.removeItem('gunRangeLogo');
            document.getElementById('headerLogo').style.display = 'none';
        }
        
        this.closeSettings();
    }
}

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new LaneTracker();
});

