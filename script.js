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
        document.getElementById('addLaneBtn').addEventListener('click', () => this.addLane());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('cancelSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('logoFileInput').addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('removeLogoBtn').addEventListener('click', () => this.removeLogo());
        
        // Close modal when clicking outside
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
    }

    addLane() {
        this.laneCounter++;
        const lane = {
            id: Date.now(),
            number: this.laneCounter,
            name: `Lane ${this.laneCounter}`,
            timeLimit: 30, // default 30 minutes
            startTime: null,
            isActive: false
        };
        this.lanes.push(lane);
        this.saveLanes();
        this.renderLanes();
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
            lane.startTime = Date.now();
            lane.isActive = true;
            this.saveLanes();
            this.renderLanes();
        }
    }

    stopLane(laneId) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (lane) {
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
            // If timer is active, adjust startTime backwards to add time
            const secondsToAdd = minutesToAdd * 60;
            lane.startTime = lane.startTime - (secondsToAdd * 1000);
        } else {
            // If timer is not active, add to time limit
            lane.timeLimit = Math.min(999, lane.timeLimit + minutesToAdd);
        }

        this.saveLanes();
        this.renderLanes();
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all lanes?')) {
            this.lanes = [];
            this.timers.clear();
            this.laneCounter = 0;
            this.saveLanes();
            this.renderLanes();
        }
    }

    calculateRemainingTime(lane) {
        if (!lane.isActive || !lane.startTime) {
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

        // Sort lanes: expired first, then warning, then started lanes
        const sortedLanes = [...this.lanes].sort((a, b) => {
            const aExpired = this.isLaneExpired(a);
            const bExpired = this.isLaneExpired(b);
            const aWarning = this.isLaneWarning(a);
            const bWarning = this.isLaneWarning(b);
            
            // Expired lanes first
            if (aExpired && !bExpired) return -1;
            if (!aExpired && bExpired) return 1;
            
            // Warning lanes second (if both not expired)
            if (!aExpired && !bExpired) {
                if (aWarning && !bWarning) return -1;
                if (!aWarning && bWarning) return 1;
            }
            
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
                let itemClass = 'nav-lane-item';
                
                if (isExpired) {
                    itemClass += ' nav-lane-item-expired';
                } else if (isWarning) {
                    itemClass += ' nav-lane-item-warning';
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
            statusText.textContent = 'Not Started';
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
                    <p>Click "Add Lane" to start tracking</p>
                </div>
            `;
            this.renderNavigationBar();
            return;
        }

        container.innerHTML = this.lanes.map(lane => `
            <div class="lane-card" data-lane-id="${lane.id}" id="lane-${lane.id}">
                <div class="lane-header">
                    <div 
                        class="lane-number" 
                        onclick="tracker.startEditingLaneName(${lane.id})"
                        title="Click to rename"
                    >${lane.name || `Lane ${lane.number}`}</div>
                    <div class="lane-actions">
                        <button class="btn-small btn-danger" onclick="tracker.removeLane(${lane.id})">×</button>
                    </div>
                </div>
                <div class="timer-display">
                    <div class="time-remaining">${this.formatTime(this.calculateRemainingTime(lane))}</div>
                    <div class="status-text">${lane.isActive ? 'Active' : 'Not Started'}</div>
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
            let needsNavUpdate = false;
            this.lanes.forEach(lane => {
                if (lane.isActive) {
                    const wasExpired = this.isLaneExpired(lane);
                    const wasWarning = this.isLaneWarning(lane);
                    this.updateLaneDisplay(lane);
                    const isExpired = this.isLaneExpired(lane);
                    const isWarning = this.isLaneWarning(lane);
                    // Update navigation if expiration or warning status changed
                    if (wasExpired !== isExpired || wasWarning !== isWarning) {
                        needsNavUpdate = true;
                    }
                }
            });
            if (needsNavUpdate) {
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
            document.getElementById('headerText').textContent = 'ExpiLane';
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

