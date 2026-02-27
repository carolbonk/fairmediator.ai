# Axiom Integration Guide for FairMediator

## Overview

Integrate Axiom for centralized logging with your existing Winston setup.

**Allocation:** 166MB/month
**Cost:** $0

---

## Step 1: Get Axiom Credentials

1. **Log in to Axiom:** https://app.axiom.co
2. **Create Dataset:**
   - Click "Datasets" → "New Dataset"
   - Name: `fairmediator-logs`
   - Description: "FairMediator backend logs"
   - Click "Create"

3. **Create API Token:**
   - Click "Settings" → "API Tokens" → "New Token"
   - Name: `fairmediator-backend`
   - Permissions: **Ingest** (write-only, more secure)
   - Click "Create"
   - **Copy token immediately** (shown only once)

4. **Note your credentials:**
   ```
   AXIOM_DATASET=fairmediator-logs
   AXIOM_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   AXIOM_ORG_ID=your-org-id  # Found in Settings → Organization
   ```

---

## Step 2: Install Axiom Winston Transport

```bash
cd backend
npm install @axiomhq/winston
```

---

## Step 3: Update Backend Environment Variables

Add to `backend/.env`:

```bash
# Axiom Logging (FREE - 166MB/month allocation)
AXIOM_DATASET=fairmediator-logs
AXIOM_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AXIOM_ORG_ID=your-org-id
AXIOM_ENABLED=true  # Set to false to disable Axiom (use local logs only)
```

Add to root `.env` (for Docker):

```bash
# Axiom Logging
AXIOM_DATASET=fairmediator-logs
AXIOM_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AXIOM_ORG_ID=your-org-id
AXIOM_ENABLED=true
```

---

## Step 4: Update Winston Logger Configuration

**File:** `backend/src/config/logger.js`

Replace the entire file with this:

```javascript
const winston = require('winston');
const AxiomTransport = require('@axiomhq/winston').default;

const isDevelopment = process.env.NODE_ENV !== 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create transports array
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : logFormat,
    level: isDevelopment ? 'debug' : 'info'
  }),

  // File transport (local backup)
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  }),
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  })
];

// Add Axiom transport if enabled
if (process.env.AXIOM_ENABLED === 'true' && process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
  transports.push(
    new AxiomTransport({
      dataset: process.env.AXIOM_DATASET,
      token: process.env.AXIOM_TOKEN,
      orgId: process.env.AXIOM_ORG_ID,

      // Add metadata to all logs
      metadata: {
        service: 'fairmediator-backend',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      },

      // Batch logs for efficiency (sends every 1 second or 1000 logs)
      batching: {
        interval: 1000,
        maxItems: 1000
      }
    })
  );

  console.log('✅ Axiom logging enabled - Dataset:', process.env.AXIOM_DATASET);
} else {
  console.log('⚠️  Axiom logging disabled - Logs will only be stored locally');
}

// Create logger
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Add helper methods for structured logging
logger.logRequest = (req, metadata = {}) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id,
    ...metadata
  });
};

logger.logScraping = (scraper, action, metadata = {}) => {
  logger.info('Scraping Event', {
    scraper,
    action,
    ...metadata
  });
};

logger.logQuota = (service, usage, metadata = {}) => {
  logger.info('Quota Usage', {
    service,
    usage,
    ...metadata
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

module.exports = logger;
```

---

## Step 5: Update Docker Compose

Add Axiom env vars to `docker-compose.yml`:

```yaml
backend:
  environment:
    # ... existing vars ...
    AXIOM_DATASET: ${AXIOM_DATASET}
    AXIOM_TOKEN: ${AXIOM_TOKEN}
    AXIOM_ORG_ID: ${AXIOM_ORG_ID}
    AXIOM_ENABLED: ${AXIOM_ENABLED:-true}
```

---

## Step 6: Test Axiom Integration

### Test locally:

```bash
cd backend
npm install
node -e "const logger = require('./src/config/logger'); logger.info('Test log from local'); logger.error('Test error'); logger.logScraping('test-scraper', 'test-action', { count: 5 }); setTimeout(() => process.exit(0), 2000);"
```

### Check Axiom Dashboard:

1. Go to https://app.axiom.co
2. Click "Datasets" → `fairmediator-logs`
3. You should see your test logs appear within 1-2 seconds

### Test queries in Axiom:

```apl
# All logs from last hour
['fairmediator-logs']
| where _time > ago(1h)

# Only errors
['fairmediator-logs']
| where level == "error"

# Scraping events
['fairmediator-logs']
| where message contains "Scraping"

# Quota warnings
['fairmediator-logs']
| where message contains "quota"
| where level in ("warn", "error")

# Requests by path
['fairmediator-logs']
| where message contains "HTTP Request"
| summarize count() by path

# Error rate over time
['fairmediator-logs']
| where level == "error"
| summarize count() by bin(_time, 1h)
```

---

## Step 7: Update Existing Code to Use Structured Logging

### Example: Update scraping logs

**Before:**
```javascript
logger.info(`Scraping FEC data for ${mediator.name}`);
```

**After:**
```javascript
logger.logScraping('fec', 'started', {
  mediatorId: mediator._id,
  mediatorName: mediator.name
});
```

### Example: Update quota logs

**Before:**
```javascript
logger.warn('Hugging Face quota exhausted');
```

**After:**
```javascript
logger.logQuota('huggingface', {
  used: monitor.getUsage('huggingface').daily,
  limit: FREE_TIER_LIMITS.huggingface.daily,
  percent: 100,
  status: 'exhausted'
});
```

### Example: Update error logs

**Before:**
```javascript
logger.error(`Scraping failed: ${error.message}`);
```

**After:**
```javascript
logger.logError(error, {
  scraper: 'fec',
  mediatorId: mediator._id,
  action: 'scrape_donations'
});
```

---

## Step 8: Create Axiom Monitors (Alerts)

### Monitor 1: Critical Errors

1. In Axiom, go to "Monitors" → "New Monitor"
2. **Name:** FairMediator - Critical Errors
3. **Query:**
   ```apl
   ['fairmediator-logs']
   | where level == "error"
   | where service == "fairmediator-backend"
   | summarize count() by bin(_time, 5m)
   ```
4. **Condition:** `count() > 5` (more than 5 errors in 5 minutes)
5. **Notification:** Email/Slack
6. Click "Create Monitor"

### Monitor 2: Quota Warnings

1. **Name:** FairMediator - Quota Warnings
2. **Query:**
   ```apl
   ['fairmediator-logs']
   | where message contains "quota"
   | where level in ("warn", "error")
   ```
3. **Condition:** `count() > 0`
4. **Notification:** Email
5. Click "Create Monitor"

### Monitor 3: Scraping Failures

1. **Name:** FairMediator - Scraping Failures
2. **Query:**
   ```apl
   ['fairmediator-logs']
   | where message contains "Scraping"
   | where level == "error"
   | summarize count() by scraper
   ```
3. **Condition:** `count() > 3` (same scraper fails 3+ times)
4. **Notification:** Slack
5. Click "Create Monitor"

---

## Step 9: Create Axiom Dashboards

### Dashboard 1: System Health

1. Go to "Dashboards" → "New Dashboard"
2. **Name:** FairMediator - System Health
3. Add panels:

**Panel 1: Error Rate**
```apl
['fairmediator-logs']
| where level == "error"
| summarize count() by bin(_time, 1h)
```

**Panel 2: Request Volume**
```apl
['fairmediator-logs']
| where message contains "HTTP Request"
| summarize count() by bin(_time, 1h)
```

**Panel 3: Top Error Messages**
```apl
['fairmediator-logs']
| where level == "error"
| summarize count() by message
| top 10 by count_
```

### Dashboard 2: Scraping Metrics

**Panel 1: Scraping Events**
```apl
['fairmediator-logs']
| where message contains "Scraping"
| summarize count() by scraper, action
```

**Panel 2: Quota Usage**
```apl
['fairmediator-logs']
| where message contains "Quota"
| extend used = toint(usage.used), limit = toint(usage.limit)
| project _time, service, used, limit, percent = (used * 100.0 / limit)
| summarize avg(percent) by service
```

---

## Step 10: N8N Integration with Axiom

N8N can query Axiom to power automations:

### Example: Hourly Error Check

```
1. Cron Trigger: Every hour
2. HTTP Request: POST https://api.axiom.co/v1/datasets/fairmediator-logs/query
   Headers:
     Authorization: Bearer ${AXIOM_TOKEN}
     Content-Type: application/json
   Body:
     {
       "apl": "['fairmediator-logs'] | where level == 'error' | where _time > ago(1h) | summarize count()",
       "startTime": "now-1h",
       "endTime": "now"
     }
3. IF node: Check if count > 5
4. TRUE branch: Send alert email
```

---

## Usage Tips

### 1. Query Recent Logs
```apl
['fairmediator-logs']
| where _time > ago(1h)
| order by _time desc
| limit 100
```

### 2. Find Slow Requests (if you log response time)
```apl
['fairmediator-logs']
| where message contains "HTTP Request"
| where responseTime > 1000  # > 1 second
| project _time, path, method, responseTime
| order by responseTime desc
```

### 3. Track Scraping Progress
```apl
['fairmediator-logs']
| where scraper == "fec"
| where action in ("started", "completed", "failed")
| summarize started=countif(action=="started"),
            completed=countif(action=="completed"),
            failed=countif(action=="failed")
  by bin(_time, 1d)
```

### 4. Monitor Quota Usage Over Time
```apl
['fairmediator-logs']
| where message contains "Quota"
| extend percent = todouble(usage.percent)
| summarize avg(percent), max(percent) by service, bin(_time, 1h)
```

---

## Quota Management

**Your Allocation:** 166MB/month (~170,000 logs at 1KB/log average)

**Axiom Strategy (Stay Under Quota):**
- **Axiom receives:** Only `warn`, `error`, `security` levels (~100-500 logs/day in production)
- **Local files receive:** ALL log levels (`debug`, `info`, `http`, `warn`, `error`, `security`)
- **Result:** Well under 5,666 logs/day Axiom limit, critical logs searchable in cloud

**Expected Usage:**
- **Axiom:** ~100-500 critical logs/day (3k-15k/month) - 9-88% of quota
- **Local files:** ~5k-10k logs/day (all levels preserved)

**If approaching limit:**
1. Reduce log verbosity (set level to 'info' instead of 'debug')
2. Sample high-volume logs (log every 10th request instead of all)
3. Use local logs for development, Axiom for production only

---

## Troubleshooting

### Logs not appearing in Axiom

1. **Check token:**
   ```bash
   curl -H "Authorization: Bearer $AXIOM_TOKEN" \
        https://api.axiom.co/v1/datasets
   # Should return list of datasets
   ```

2. **Check environment variables:**
   ```bash
   echo $AXIOM_DATASET
   echo $AXIOM_TOKEN
   echo $AXIOM_ENABLED
   ```

3. **Check Winston transport:**
   - Look for `✅ Axiom logging enabled` in console on startup
   - If not, check AXIOM_ENABLED=true in .env

4. **Check batching:**
   - Logs are batched every 1 second
   - Wait 2-3 seconds after logging before checking Axiom

### Too many logs (approaching quota)

1. **Reduce log level in production:**
   ```javascript
   // logger.js
   level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
   ```

2. **Sample high-volume logs:**
   ```javascript
   // Only log 10% of requests
   if (Math.random() < 0.1) {
     logger.logRequest(req);
   }
   ```

3. **Use local logs for development:**
   ```bash
   # .env.local
   AXIOM_ENABLED=false
   ```

---

## Next Steps

1. ✅ Install @axiomhq/winston
2. ✅ Update logger.js
3. ✅ Add env vars to .env and docker-compose.yml
4. ✅ Test locally
5. ✅ Create Axiom monitors
6. ✅ Create Axiom dashboards
7. ✅ Update code to use structured logging
8. ✅ Connect N8N workflows to Axiom queries
