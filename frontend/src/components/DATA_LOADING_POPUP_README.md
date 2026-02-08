# DataLoadingPopup Component

Real-time popup notification that shows data population progress to users.

## Features

- 🔄 Real-time progress tracking (automatically polls every 30 seconds)
- ⏱️ Estimated completion time
- 📊 Statistics (FEC donations, lobbying filings found)
- ✅ Auto-dismisses when complete
- ⚠️ Shows rate limit status with countdown
- ♿ WCAG 2.1 Level AA compliant

## Usage

### Basic Usage

```jsx
import DataLoadingPopup from './components/DataLoadingPopup';

function App() {
  return (
    <div>
      {/* Your app content */}

      {/* Add popup - it will auto-show/hide based on status */}
      <DataLoadingPopup />
    </div>
  );
}
```

### With Custom API URL

```jsx
<DataLoadingPopup
  apiBaseUrl="https://yourdomain.com/api"
  checkInterval={60000} // Check every 60 seconds
/>
```

### With Dismiss Callback

```jsx
<DataLoadingPopup
  onDismiss={() => {
    console.log('User dismissed the popup');
  }}
/>
```

### Disable Auto-Checking (Manual Mode)

```jsx
<DataLoadingPopup
  autoCheck={false}
/>
```

## Status States

The popup shows different UI based on the current status:

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| `loading` | Blue | Pulsing database | Data population in progress |
| `rate_limited` | Yellow | Warning | API rate limit hit, shows retry countdown |
| `complete` | Green | Check circle | Population complete, auto-dismisses after 5s |
| `error` | Red | Exclamation | Error occurred during population |

## Backend API

The component fetches status from:

```
GET /api/data-population/status
```

### Response Format

```json
{
  "status": "loading",
  "message": "Processing mediator 15/25...",
  "progress": {
    "mediators": 15,
    "total": 25
  },
  "stats": {
    "fec": {
      "found": 6,
      "donations": 150
    },
    "lda": {
      "found": 4,
      "filings": 50
    }
  },
  "eta": "2026-02-08T20:00:00.000Z",
  "retryAt": "2026-02-08T20:00:00.000Z",
  "lastUpdated": "2026-02-08T00:00:00.000Z"
}
```

## Running the Population Script

The popup automatically displays when the population script is running:

```bash
# Start data population
cd backend
node src/scripts/populateMediatorData.js

# The script will write status updates to data/population_status.json
# The popup will automatically detect and display progress
```

## Positioning

The popup appears in the bottom-right corner of the screen:

```css
position: fixed;
bottom: 1rem;
right: 1rem;
z-index: 50;
```

## Accessibility

- ✅ ARIA live region for screen readers (`role="alert" aria-live="polite"`)
- ✅ Keyboard accessible dismiss button
- ✅ Semantic HTML with proper labels
- ✅ High contrast colors for all states
- ✅ Min 44px touch targets for mobile

## Integration Checklist

1. **Backend Setup:**
   - [x] Add `/api/data-population` route to server.js
   - [x] Update `populateMediatorData.js` to write status updates

2. **Frontend Setup:**
   - [ ] Import `DataLoadingPopup` component
   - [ ] Add `<DataLoadingPopup />` to your root App component
   - [ ] (Optional) Customize `checkInterval` and `apiBaseUrl`

3. **Testing:**
   - [ ] Run population script: `node src/scripts/populateMediatorData.js --limit=5`
   - [ ] Verify popup appears and shows progress
   - [ ] Verify popup auto-dismisses when complete

## Example: App.jsx Integration

```jsx
import React from 'react';
import DataLoadingPopup from './components/DataLoadingPopup';
import YourAppContent from './components/YourAppContent';

function App() {
  return (
    <div className="App">
      <YourAppContent />

      {/* Data loading popup - shows automatically when population is running */}
      <DataLoadingPopup />
    </div>
  );
}

export default App;
```

## Notes

- The popup only renders when there's an active population status
- Status file is automatically created by the population script
- No database queries needed - reads from JSON file for performance
- Frontend polling is lightweight (30-second intervals)
- Auto-cleanup after completion (status file remains for 5 seconds, then popup dismisses)
