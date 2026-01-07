# Gun Range Lane Tracker

A simple web application for tracking time limits on gun range lanes.

## Features

- Add multiple lanes for tracking
- Set custom time limits for each lane (in minutes)
- Start/stop timers for each lane
- Visual indicators for time status:
  - Green border when active
  - Orange border when time is running low (5 minutes or less)
  - Red border and pulsing animation when time has expired
- Reset timers to restart
- Persistent storage - lanes and timers are saved in browser localStorage
- Responsive design that works on desktop and mobile devices

## Usage

1. Open `index.html` in a web browser
2. Click "Add Lane" to create a new lane tracker
3. Set the time limit (in minutes) for each lane
4. Click "Start" to begin the timer
5. Click "Stop" to pause the timer
6. Click "Reset" to reset the timer back to the time limit
7. Click "×" to remove a lane

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `script.js` - Timer logic and lane management
- `README.md` - This file

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- CSS Grid
- localStorage

No external dependencies required - pure HTML, CSS, and JavaScript.

