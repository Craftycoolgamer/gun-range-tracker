# Gun Range Lane Tracker

A comprehensive web application for tracking time limits on gun range lanes with advanced features for lane management and customization.

## Features

### Lane Management
- **Configure Multiple Lanes**: Set up 1-50 lanes with custom names
- **Custom Lane Names**: Edit lane names directly in the configuration or on the lane card
- **Lane Navigation Bar**: Quick navigation to lanes sorted by status (expired → warning → active → paused → not started)
- **Visual Status Indicators**:
  - 🟢 Green border when active
  - 🟠 Orange border when time is running low (5 minutes or less)
  - 🔴 Red border and pulsing animation when time has expired
  - ⏸️ Paused state with preserved remaining time
  - ⚪ Not started state

### Timer Controls
- **Start/Stop**: Start timers and pause them while preserving remaining time
- **Reset**: Reset timers back to the time limit
- **Time Limit Configuration**: Set custom time limits (1-999 minutes) for each lane
- **Add Time**: Add time to active or paused timers with custom amounts or quick buttons (+5, +10, +15, +30 minutes)
- **Subtract Time**: Remove time from timers when needed

### Customization
- **Header Customization**: 
  - Customize header text (up to 50 characters)
  - Upload and display a custom logo image
- **Persistent Settings**: All settings, lanes, and timer states are saved in browser localStorage

### User Interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Lane Cards**: Each lane displayed in an organized card layout
- **Status Text**: Clear status indicators (Active, Paused, Not Started, Time Running Low, Time Expired)
- **Quick Actions**: Easy access to common time adjustments

## Usage

### Initial Setup
1. Open `index.html` in a web browser
2. Click "Configure Lanes" to set up your lanes
3. Enter the number of lanes (1-50)
4. Customize lane names by clicking on them
5. Click "Save" to create your lanes

### Customizing the Header
1. Click the ⚙️ Settings button
2. Enter custom header text (optional)
3. Upload a logo image (optional)
4. Click "Save" to apply changes

### Managing Lanes
- **Start Timer**: Click "Start" on a lane card to begin the timer
- **Stop Timer**: Click "Stop" to pause the timer (remaining time is preserved)
- **Resume Timer**: Click "Start" again to resume from where it was paused
- **Reset Timer**: Click "Reset" to reset the timer back to the time limit
- **Change Time Limit**: Enter a new value in the "Time Limit" field (only when timer is stopped)
- **Add Time**: 
  - Enter minutes in the "Add Time" field and click "Add Time"
  - Or use quick buttons: +5, +10, +15, or +30 minutes
- **Edit Lane Name**: Click on the lane name in the lane card to edit it
- **Navigate to Lane**: Click on a lane in the navigation bar to scroll to it

### Navigation Bar
The navigation bar at the top shows all lanes sorted by priority:
- Expired lanes appear first (red)
- Warning lanes (≤5 minutes) appear next (orange)
- Active lanes appear next (green)
- Paused lanes appear next
- Not started lanes appear last

Click any lane in the navigation bar to quickly scroll to that lane's card.

### Clearing All Timers
Click "Clear All" to reset all timers at once (requires confirmation).

## Files

- `index.html` - Main HTML structure and UI elements
- `styles.css` - Styling, layout, and animations
- `script.js` - Timer logic, lane management, and data persistence
- `README.md` - This documentation file

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- localStorage API
- FileReader API (for logo uploads)

**No external dependencies required** - pure HTML, CSS, and JavaScript.

## Data Storage

All data is stored locally in your browser using localStorage:
- Lane configurations (names, time limits, states)
- Timer states (active/paused, remaining time)
- Header settings (custom text and logo)

Data persists across browser sessions and page refreshes.

## Technical Details

- **Timer Precision**: Updates every second for accurate time display
- **Time Format**: Displays as MM:SS (minutes:seconds)
- **Maximum Time Limit**: 999 minutes per lane
- **Maximum Lanes**: 50 lanes
- **Logo Format**: Any image format supported by the browser
