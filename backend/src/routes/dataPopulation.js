/**
 * Data Population Status API
 * Provides real-time status of mediator data loading
 *
 * @module routes/dataPopulation
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Path to status file (updated by population script)
const STATUS_FILE = path.join(__dirname, '../../data/population_status.json');

/**
 * GET /api/data-population/status
 * Get current data population status
 *
 * Response: {
 *   status: 'idle' | 'loading' | 'rate_limited' | 'complete' | 'error',
 *   message: string,
 *   progress: { mediators: number, total: number },
 *   stats: { fec: {...}, lda: {...} },
 *   eta: ISO timestamp,
 *   retryAt: ISO timestamp (for rate_limited),
 *   lastUpdated: ISO timestamp
 * }
 */
router.get('/status', async (req, res) => {
  try {
    // Check if status file exists
    if (!fs.existsSync(STATUS_FILE)) {
      return res.json({
        status: 'idle',
        message: 'No data population in progress',
        lastUpdated: new Date().toISOString()
      });
    }

    // Read status file
    const statusData = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));

    // Calculate time since last update
    const lastUpdated = new Date(statusData.lastUpdated);
    const now = new Date();
    const minutesSinceUpdate = (now - lastUpdated) / 1000 / 60;

    // If last update was >10 minutes ago and status is 'loading', mark as stale
    if (statusData.status === 'loading' && minutesSinceUpdate > 10) {
      statusData.status = 'error';
      statusData.message = 'Data population appears to have stalled';
    }

    res.json(statusData);

  } catch (error) {
    console.error('Error reading population status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read population status'
    });
  }
});

/**
 * POST /api/data-population/update
 * Update population status (called by population script)
 *
 * Body: {
 *   status: string,
 *   message: string,
 *   progress: { mediators: number, total: number },
 *   stats: object,
 *   eta: ISO timestamp,
 *   retryAt: ISO timestamp
 * }
 */
router.post('/update', async (req, res) => {
  try {
    const statusData = {
      ...req.body,
      lastUpdated: new Date().toISOString()
    };

    // Ensure data directory exists
    const dataDir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write status file
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));

    res.json({
      success: true,
      message: 'Status updated'
    });

  } catch (error) {
    console.error('Error updating population status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

/**
 * DELETE /api/data-population/status
 * Clear population status (when complete)
 */
router.delete('/status', async (req, res) => {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      fs.unlinkSync(STATUS_FILE);
    }

    res.json({
      success: true,
      message: 'Status cleared'
    });

  } catch (error) {
    console.error('Error clearing population status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear status'
    });
  }
});

module.exports = router;
