# Quota Monitoring Setup Guide

**Purpose:** Automatically verify all free tier limits every 12 hours to prevent overages

---

## Quick Start

### Option 1: Run Manually

```bash
# From project root
node backend/src/scripts/monitor-quotas.js

# Or use Claude Code skill
claude-code skill quota-monitor
```

### Option 2: Schedule with Cron (Recommended)

Runs automatically at 6 AM and 6 PM every day.

---

## Automated Setup (Cron)

### macOS / Linux

1. **Open crontab editor:**
```bash
crontab -e
```

2. **Add this line:**
```bash
# FairMediator Quota Monitor - Runs at 6 AM and 6 PM daily
0 6,18 * * * cd /Users/carolbonk/Desktop/FairMediator && node backend/src/scripts/monitor-quotas.js >> logs/quota-monitor.log 2>&1
```

3. **Save and exit** (`:wq` in vim, or Ctrl+X in nano)

4. **Verify it's scheduled:**
```bash
crontab -l
```

### Windows (Task Scheduler)

1. **Open Task Scheduler**

2. **Create New Task:**
   - **Name:** FairMediator Quota Monitor
   - **Trigger:** Daily at 6:00 AM and 6:00 PM
   - **Action:** Start a program
     - **Program:** `node`
     - **Arguments:** `backend/src/scripts/monitor-quotas.js`
     - **Start in:** `C:\Users\YourName\Desktop\FairMediator`

3. **Save task**

---

## What It Monitors

### API Services (Request-Based)
- ✅ **HuggingFace API:** 333 requests/day, 10,000/month
- ✅ **Resend Email:** 50 emails/day, 3,000/month
- ✅ **Web Scraping:** 450 pages/day, 15,000/month
- ✅ **Axiom Logging:** 5,666 logs/day, 170,000/month

### Oracle Cloud (Resource-Based)
- ✅ **CPU:** 4 ARM cores maximum
- ✅ **RAM:** 24GB maximum
- ✅ **Storage:** 200GB maximum
- ✅ **Bandwidth:** 10TB/month (340GB/day average)

---

## Alert Thresholds

| Level | Threshold | Action |
|-------|-----------|--------|
| ⚠️ **WARNING** | 70% | Log warning, continue monitoring |
| 🟧 **ALERT** | 85% | Log alert, send notification |
| 🔴 **CRITICAL** | 95% | Log critical, block deployments |
| ⛔ **EXCEEDED** | 100% | Auto-shutdown non-essential services |

---

## Output Examples

### Healthy Status
```
================================
QUOTA MONITOR - 2026-02-28 06:00
================================

API Services:
  ✅ HuggingFace: 45% (150/333)
  ✅ Resend: 32% (16/50)
  ✅ Scraping: 38% (171/450)
  ✅ Axiom: 12% (680/5,666)

Oracle Cloud:
  ✅ CPU: 100% (4 cores allocated, 35% active)
  ✅ RAM: 92% (22GB / 24GB)
  ✅ Storage: 22% (45GB / 200GB)
  ✅ Bandwidth: 1.5% (156GB / 10TB)

Overall Status: HEALTHY

✅ All systems within safe limits

Full report saved: logs/quota-reports/quota-report-2026-02-28-06-00.md
```

### Warning Status
```
================================
QUOTA MONITOR - 2026-02-28 18:00
================================

API Services:
  ✅ HuggingFace: 65% (217/333)
  ⚠️ Resend: 76% (38/50)  ← WARNING
  ✅ Scraping: 42% (189/450)
  ✅ Axiom: 18% (1,020/5,666)

Oracle Cloud:
  ✅ CPU: 100% (4 cores allocated, 38% active)
  ✅ RAM: 92% (22GB / 24GB)
  ✅ Storage: 23% (47GB / 200GB)
  ✅ Bandwidth: 2.1% (218GB / 10TB)

Overall Status: WARNING

⚠️ 1 service(s) require attention

Full report saved: logs/quota-reports/quota-report-2026-02-28-18-00.md
```

### Critical Status
```
================================
QUOTA MONITOR - 2026-02-28 22:00
================================

API Services:
  🟧 HuggingFace: 89% (296/333)  ← ALERT
  🔴 Resend: 96% (48/50)         ← CRITICAL
  ✅ Scraping: 62% (279/450)
  ✅ Axiom: 24% (1,360/5,666)

Oracle Cloud:
  ✅ CPU: 100% (4 cores allocated, 42% active)
  🔴 RAM: 96% (23GB / 24GB)      ← CRITICAL
  ✅ Storage: 28% (56GB / 200GB)
  ✅ Bandwidth: 3.2% (328GB / 10TB)

Overall Status: CRITICAL

⚠️ 3 service(s) require attention

Full report saved: logs/quota-reports/quota-report-2026-02-28-22-00.md
```

---

## Reports

### Location
```
logs/quota-reports/
├── quota-report-2026-02-27-06-00.md
├── quota-report-2026-02-27-18-00.md
├── quota-report-2026-02-28-06-00.md
└── quota-report-2026-02-28-18-00.md
```

### Auto-Cleanup (Optional)

Add to cron to keep only last 30 days:

```bash
# Clean old reports (runs daily at midnight)
0 0 * * * find /Users/carolbonk/Desktop/FairMediator/logs/quota-reports -name "*.md" -mtime +30 -delete
```

---

## Troubleshooting

### "Backend not running" Error

**Problem:**
```
❌ Backend not running at http://localhost:5001
```

**Solution:**
```bash
cd backend
npm start
```

### Cron Job Not Running

**Check cron logs (macOS):**
```bash
log show --predicate 'process == "cron"' --last 1h
```

**Check cron logs (Linux):**
```bash
sudo journalctl -u cron -n 50
```

**Test cron entry manually:**
```bash
cd /Users/carolbonk/Desktop/FairMediator && node backend/src/scripts/monitor-quotas.js
```

### Permissions Issues

**Make script executable:**
```bash
chmod +x backend/src/scripts/monitor-quotas.js
```

**Ensure logs directory exists:**
```bash
mkdir -p logs/quota-reports
```

---

## Exit Codes

The script exits with different codes based on status:

| Exit Code | Status | Meaning |
|-----------|--------|---------|
| `0` | HEALTHY | All services within safe limits |
| `1` | WARNING | One or more services at 70-85% |
| `2` | CRITICAL | One or more services at >95% |
| `3` | ERROR | Script execution failed |

**Use in monitoring systems:**
```bash
node backend/src/scripts/monitor-quotas.js
if [ $? -eq 2 ]; then
  echo "CRITICAL: Immediate action required"
  # Send alert, page on-call, etc.
fi
```

---

## Integration with Monitoring Tools

### Slack Notifications

Add to cron:
```bash
0 6,18 * * * cd /path/to/fairmediator && node backend/src/scripts/monitor-quotas.js && curl -X POST -H 'Content-type: application/json' --data '{"text":"Quota check complete"}' YOUR_SLACK_WEBHOOK_URL
```

### Email Alerts (on Critical)

```bash
#!/bin/bash
cd /path/to/fairmediator
node backend/src/scripts/monitor-quotas.js
STATUS=$?

if [ $STATUS -eq 2 ]; then
  REPORT=$(cat logs/quota-reports/quota-report-*.md | tail -1)
  echo "$REPORT" | mail -s "CRITICAL: FairMediator Quota Alert" you@example.com
fi
```

### Prometheus/Grafana

Export metrics to Prometheus:
```javascript
// Add to backend
app.get('/metrics', async (req, res) => {
  const quotaData = await getQuotaStatus();
  const metrics = [];

  for (const [key, service] of Object.entries(quotaData.services)) {
    metrics.push(`quota_usage{service="${key}"} ${service.percent}`);
  }

  res.set('Content-Type', 'text/plain');
  res.send(metrics.join('\n'));
});
```

---

## Best Practices

### ✅ Do
- Run every 12 hours (6 AM, 6 PM)
- Keep last 30 days of reports
- Review reports weekly
- Act on warnings before they become critical
- Test cron job after setup

### ❌ Don't
- Run more frequently than every 12 hours (unnecessary overhead)
- Ignore WARNING alerts (they escalate quickly)
- Delete reports immediately (useful for trend analysis)
- Skip testing cron setup

---

## Manual Testing

### Test the script
```bash
node backend/src/scripts/monitor-quotas.js
```

### Test Claude Code skill
```bash
claude-code skill quota-monitor
```

### Simulate backend failure
```bash
# Stop backend
# Run script - should show error message
node backend/src/scripts/monitor-quotas.js
```

---

## Summary

**To enable automated monitoring:**

1. ✅ Script created: `backend/src/scripts/monitor-quotas.js`
2. ✅ Skill created: `.claude/skills/quota-monitor.md`
3. ⏳ **Add to cron:** `crontab -e` → Add line from above
4. ⏳ **Test it:** Run manually first
5. ⏳ **Verify logs:** Check `logs/quota-reports/` after 6 AM or 6 PM

**Monitoring active:** Every 12 hours (6 AM, 6 PM)

**Reports saved:** `logs/quota-reports/quota-report-YYYY-MM-DD-HH-mm.md`

**Status codes:** 0 = Healthy, 1 = Warning, 2 = Critical, 3 = Error
