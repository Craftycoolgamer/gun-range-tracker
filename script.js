class LaneTracker {
    constructor() {
        this.lanes = [];
        this.laneCounter = 0;
        this.timers = new Map();
        this.init();
    }

    init() {
        this.loadLanes();
        this.setupEventListeners();
        this.startTimerLoop();
    }

    setupEventListeners() {
        document.getElementById('addLaneBtn').addEventListener('click', () => this.addLane());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
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
            
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            statusText.textContent = 'Not Started';
            startBtn.disabled = false;
            stopBtn.disabled = remainingSeconds === 0;
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
            return;
        }

        container.innerHTML = this.lanes.map(lane => `
            <div class="lane-card" data-lane-id="${lane.id}">
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
                            ${lane.isActive ? 'disabled' : ''}
                        >
                            Start
                        </button>
                        <button 
                            class="btn btn-danger stop-btn" 
                            onclick="tracker.stopLane(${lane.id})"
                            ${!lane.isActive ? 'disabled' : ''}
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
    }

    startTimerLoop() {
        setInterval(() => {
            this.lanes.forEach(lane => {
                if (lane.isActive) {
                    this.updateLaneDisplay(lane);
                }
            });
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
}

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new LaneTracker();
});

