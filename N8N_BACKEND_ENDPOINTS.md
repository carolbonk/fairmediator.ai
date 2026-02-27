# Backend Endpoints for N8N Automation

Add these endpoints to your backend for N8N orchestration.

## 1. Scraping Orchestration

### `GET /api/scraping/trigger-batch`
Trigger batch scraping with quota checks.

```javascript
// backend/src/routes/scraping.js
const { monitor } = require('../utils/freeTierMonitor');

router.get('/trigger-batch', async (req, res) => {
  const { scraper, count = 10 } = req.query;

  // Check quota
  if (!monitor.isAllowed('scraping')) {
    return res.status(429).json({
      error: 'Scraping quota exhausted',
      nextReset: monitor.getNextReset('scraping'),
      usage: monitor.getUsage('scraping')
    });
  }

  // Trigger scraper
  let results = [];
  try {
    switch(scraper) {
      case 'fec':
        results = await fecScraper.scrapeBatch(parseInt(count));
        break;
      case 'senate_lda':
        results = await senateLdaScraper.scrapeBatch(parseInt(count));
        break;
      case 'linkedin':
        results = await linkedinScraper.scrapeBatch(parseInt(count));
        break;
      default:
        return res.status(400).json({ error: 'Invalid scraper type' });
    }

    // Track usage
    monitor.track('scraping', results.length);

    return res.json({
      success: true,
      scraped: results.length,
      quotaRemaining: monitor.getRemaining('scraping'),
      data: results
    });
  } catch (error) {
    logger.error(`Batch scraping failed: ${error.message}`);
    return res.status(500).json({
      error: error.message,
      retryAfter: '24h'
    });
  }
});
```

---

## 2. Quota Monitoring

### `GET /api/monitoring/quota-status`
Get current quota usage for all services.

```javascript
// backend/src/routes/monitoring.js
router.get('/quota-status', (req, res) => {
  const status = {};

  for (const [service, limits] of Object.entries(monitor.FREE_TIER_LIMITS)) {
    const usage = monitor.getUsage(service);
    const remaining = monitor.getRemaining(service);
    const percent = (usage.daily / limits.daily) * 100;

    status[service] = {
      name: limits.name,
      used: usage.daily,
      limit: limits.daily,
      remaining: remaining.daily,
      percent: Math.round(percent),
      status: percent > 95 ? 'critical' : percent > 85 ? 'warning' : 'ok',
      nextReset: monitor.getNextReset(service)
    };
  }

  return res.json(status);
});
```

---

## 3. Log Aggregation

### `GET /api/logs/recent`
Get recent logs (errors, warnings, scraping stats).

```javascript
// backend/src/routes/logs.js
const fs = require('fs').promises;
const path = require('path');

router.get('/recent', async (req, res) => {
  const { level = 'all', hours = 24, type } = req.query;

  try {
    // Get today's log file
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(__dirname, `../../logs/combined-${today}.log`);

    const logContent = await fs.readFile(logFile, 'utf-8');
    const logs = logContent.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter(log => {
        // Filter by time
        const logTime = new Date(log.timestamp);
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        if (logTime < cutoff) return false;

        // Filter by level
        if (level !== 'all' && log.level !== level) return false;

        // Filter by type (scraping, quota, error, etc)
        if (type && !log.message.toLowerCase().includes(type)) return false;

        return true;
      });

    // Extract scraping stats
    const scrapingLogs = logs.filter(l => l.message.includes('scraping'));
    const errorLogs = logs.filter(l => l.level === 'error');
    const quotaLogs = logs.filter(l => l.message.includes('quota'));

    return res.json({
      total: logs.length,
      stats: {
        scraping: scrapingLogs.length,
        errors: errorLogs.length,
        quotaAlerts: quotaLogs.length
      },
      recentErrors: errorLogs.slice(0, 10),
      recentScraping: scrapingLogs.slice(0, 10),
      recentQuota: quotaLogs.slice(0, 10)
    });
  } catch (error) {
    logger.error(`Failed to fetch logs: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});
```

---

## 4. Scraping Results Summary

### `GET /api/scraping/summary`
Get summary of recent scraping results.

```javascript
// backend/src/routes/scraping.js
router.get('/summary', async (req, res) => {
  const { days = 7 } = req.query;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Query MongoDB for recent data
  const newMediators = await Mediator.countDocuments({
    createdAt: { $gte: cutoff }
  });

  const newDonations = await Donation.countDocuments({
    createdAt: { $gte: cutoff }
  });

  const newAffiliations = await Affiliation.countDocuments({
    createdAt: { $gte: cutoff }
  });

  // Calculate totals
  const totalDonationAmount = await Donation.aggregate([
    { $match: { createdAt: { $gte: cutoff } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return res.json({
    period: `Last ${days} days`,
    newMediators,
    newDonations,
    newAffiliations,
    totalDonationAmount: totalDonationAmount[0]?.total || 0,
    topDonors: await getTopDonors(cutoff),
    topAffiliations: await getTopAffiliations(cutoff)
  });
});
```

---

## 5. Auto-Trigger Workflows

### `POST /api/automation/trigger`
Trigger specific automation workflows.

```javascript
// backend/src/routes/automation.js
router.post('/trigger', async (req, res) => {
  const { workflow, data } = req.body;

  const workflows = {
    'scrape-and-blog': async (data) => {
      // 1. Scrape FEC for new mediators
      const scraped = await fecScraper.scrapeBatch(10);

      // 2. Analyze donations
      const analysis = await analyzeDonations(scraped);

      // 3. Generate blog post outline
      const blogOutline = {
        title: `What ${scraped.length} Mediator Donations Tell Us About Bias`,
        findings: analysis.topFindings,
        researchNeeded: analysis.researchTopics,
        perplexityQuery: `Legal implications of mediator donations to ${analysis.topDonee}`
      };

      return { scraped: scraped.length, blogOutline };
    },

    'quota-check-alert': async (data) => {
      const status = monitor.getUsage('all');
      const alerts = Object.entries(status)
        .filter(([service, usage]) => usage.percent > 85)
        .map(([service, usage]) => ({
          service,
          ...usage,
          severity: usage.percent > 95 ? 'critical' : 'warning'
        }));

      return { alerts, criticalCount: alerts.filter(a => a.severity === 'critical').length };
    },

    'weekly-report': async (data) => {
      const summary = await getScrapingSummary(7);
      const topFindings = await getTopFindings(7);
      const researchOpportunities = await generateResearchOpportunities(topFindings);

      return { summary, topFindings, researchOpportunities };
    }
  };

  if (!workflows[workflow]) {
    return res.status(400).json({ error: 'Unknown workflow' });
  }

  try {
    const result = await workflows[workflow](data);
    return res.json({ success: true, workflow, result });
  } catch (error) {
    logger.error(`Workflow ${workflow} failed: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});
```

---

## N8N Workflow Examples

### Workflow 1: Deploy → Scrape → Blog

```
1. Webhook Trigger (receives GitHub deploy event)
2. HTTP Request: GET /api/scraping/trigger-batch?scraper=fec&count=10
3. IF node: Check if scraped > 0
4. TRUE branch:
   - HTTP Request: GET /api/scraping/summary?days=1
   - Perplexity AI: Research top findings
   - Code node: Generate blog outline
   - Obsidian: Create draft note
5. FALSE branch:
   - Log: No new data
```

### Workflow 2: Hourly Quota Monitor

```
1. Cron Trigger: Every hour
2. HTTP Request: GET /api/monitoring/quota-status
3. IF node: Check if any service > 85%
4. TRUE branch:
   - Email: Send alert
   - Google Sheets: Log usage
   - IF > 95%:
     - Slack: CRITICAL alert
     - HTTP Request: POST /api/automation/disable-feature
5. FALSE branch:
   - Google Sheets: Log normal usage
```

### Workflow 3: Log Analysis

```
1. Cron Trigger: Every 6 hours
2. HTTP Request: GET /api/logs/recent?level=error&hours=6
3. Code node: Parse errors, group by type
4. IF node: Check if critical errors exist
5. TRUE branch:
   - Obsidian: Create error report
   - Email: Alert with error details
6. FALSE branch:
   - Log: All systems normal
```

---

## Setup Instructions

1. **Add routes to backend:**
   ```bash
   # Create new files
   touch backend/src/routes/automation.js
   touch backend/src/routes/logs.js

   # Register in server.js
   app.use('/api/automation', require('./routes/automation'));
   app.use('/api/logs', require('./routes/logs'));
   ```

2. **Add N8N webhook URL to GitHub Secrets:**
   ```bash
   # In GitHub repo → Settings → Secrets
   N8N_WEBHOOK_URL=https://your-n8n.com/webhook/fairmediator
   BACKEND_URL=https://your-backend.com
   API_TOKEN=your_secure_token
   ```

3. **Update notify job in docker-ci.yml:**
   ```yaml
   # Use the example from WEBHOOK_EXAMPLE.yml
   ```

4. **Install N8N on Oracle Cloud:**
   ```bash
   docker run -d --restart unless-stopped \
     -p 5678:5678 \
     -v n8n_data:/home/node/.n8n \
     --name n8n \
     n8nio/n8n
   ```

---

## Security Notes

- ✅ Add authentication to all automation endpoints
- ✅ Use API tokens (not cookies) for N8N → Backend
- ✅ Rate limit automation endpoints (prevent abuse)
- ✅ Validate webhook signatures from GitHub
- ✅ Store N8N webhook URL in GitHub Secrets (never commit)
