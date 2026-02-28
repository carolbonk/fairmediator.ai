# Quota Monitor Skill

**Purpose:** Verify all free tier quota limits across services every 12 hours

**Monitors:**
- HuggingFace API (333 requests/day, 10k/month)
- Resend Email (50 emails/day, 3k/month)
- Web Scraping (450 pages/day, 15k/month)
- Axiom Logging (5,666 logs/day, 170k/month)
- Oracle Cloud Resources (4 cores, 24GB RAM, 200GB storage, 10TB bandwidth/month)

---

## Instructions

When this skill is invoked, perform the following steps:

### 1. Check API-Based Services

**Read quota status endpoint:**
```bash
curl http://localhost:5001/api/monitoring/quota-status
```

Parse the response and extract:
- Each service name
- Current usage (daily and monthly)
- Percentage used
- Status (ok, warning, critical)
- Next reset time

### 2. Check Oracle Cloud Resources

**Read Oracle Cloud monitoring endpoint:**
```bash
curl http://localhost:5001/api/monitoring/oracle-cloud
```

Parse the response and extract:
- CPU: cores allocated, usage percent, status
- RAM: total GB, used GB, free GB, status
- Storage: total GB, used GB, available GB, status
- Bandwidth: daily GB, monthly GB, status

### 3. Generate Report

Create a markdown report with:

#### Header
```markdown
# Free Tier Quota Report
**Timestamp:** [current timestamp]
**Status:** [HEALTHY | WARNING | CRITICAL]
```

#### API Services Table
```markdown
## API Services

| Service | Daily Usage | Daily Limit | % Used | Status | Next Reset |
|---------|-------------|-------------|--------|--------|------------|
| HuggingFace | X / 333 | 333 | X% | ✅ OK | [time] |
| Resend | X / 50 | 50 | X% | ⚠️ WARNING | [time] |
| Scraping | X / 450 | 450 | X% | ✅ OK | [time] |
| Axiom | X / 5,666 | 5,666 | X% | ✅ OK | [time] |
```

#### Oracle Cloud Resources Table
```markdown
## Oracle Cloud Always Free Resources

| Resource | Allocated | Used | Available | % Used | Status |
|----------|-----------|------|-----------|--------|--------|
| CPU | 4 cores | X% | X cores | X% | ✅ OK |
| RAM | 24GB | X GB | X GB | X% | ✅ OK |
| Storage | 200GB | X GB | X GB | X% | ✅ OK |
| Bandwidth (Month) | 10TB | X GB | X GB | X% | ✅ OK |
```

#### Alerts Section
```markdown
## 🚨 Alerts

[If any service > 70%]
- ⚠️ **[Service Name]** at [X%] of daily limit ([usage]/[limit])

[If any service > 85%]
- 🟧 **[Service Name]** ALERT: [X%] of daily limit ([usage]/[limit])

[If any service > 95%]
- 🔴 **[Service Name]** CRITICAL: [X%] of daily limit ([usage]/[limit])

[If all services OK]
✅ All services within safe limits (< 70%)
```

#### Recommendations Section
```markdown
## 💡 Recommendations

[If HuggingFace > 70%]
- Reduce AI-powered scraping frequency
- Use cached ideology scores where possible

[If Resend > 70%]
- Batch email notifications
- Delay non-critical emails to next day

[If Scraping > 70%]
- Pause automated scraping until tomorrow
- Prioritize high-value mediator profiles only

[If Axiom > 70%]
- Reduce log verbosity (only warn/error/security)
- Clean up redundant log statements

[If Oracle Cloud CPU/RAM > 85%]
- Review Docker resource allocation
- Scale down non-essential services
- Consider MongoDB Atlas instead of local MongoDB

[If Oracle Cloud Storage > 85%]
- Clean old logs: `find /var/log -name "*.log" -mtime +7 -delete`
- Clean Docker: `docker system prune -a --volumes -f`

[If Oracle Cloud Bandwidth > 85%]
- Review traffic patterns for unusual spikes
- Enable gzip compression for API responses
- Optimize image/asset delivery
```

### 4. Save Report

Save the report to:
```
/Users/carolbonk/Desktop/FairMediator/logs/quota-reports/quota-report-YYYY-MM-DD-HH-mm.md
```

Create the directory if it doesn't exist.

### 5. Check for Critical Issues

If ANY service has status "CRITICAL" (>95%):
1. Log an error-level message
2. Highlight in the report with 🔴
3. Recommend immediate action

If ANY Oracle Cloud resource is EXCEEDED (100%):
1. Log a critical-level message
2. Recommend immediate shutdown of non-essential services
3. Block new deployments

### 6. Output Summary

Print to console:
```
================================
QUOTA MONITOR - [TIMESTAMP]
================================

API Services:
  ✅ HuggingFace: [X%] ([usage]/[limit])
  ⚠️ Resend: [X%] ([usage]/[limit])
  ✅ Scraping: [X%] ([usage]/[limit])
  ✅ Axiom: [X%] ([usage]/[limit])

Oracle Cloud:
  ✅ CPU: [X%] (4 cores allocated)
  ✅ RAM: [X%] ([used]GB / 24GB)
  ✅ Storage: [X%] ([used]GB / 200GB)
  ✅ Bandwidth: [X%] ([used]GB / 10TB)

Overall Status: [HEALTHY | WARNING | CRITICAL]

[If warnings/critical]
⚠️ [N] service(s) require attention
See full report: logs/quota-reports/quota-report-[timestamp].md

[If healthy]
✅ All systems within safe limits
```

---

## Error Handling

If backend is not running:
1. Print: "❌ Backend not running at http://localhost:5001"
2. Provide instructions: "Start backend: cd backend && npm start"
3. Exit gracefully

If endpoints return errors:
1. Print the specific error
2. Suggest checking logs: `tail -f backend/logs/combined-*.log`
3. Continue checking other services

---

## Scheduling (Optional)

To run automatically every 12 hours, add to cron:

```bash
# Run at 6 AM and 6 PM daily
0 6,18 * * * cd /Users/carolbonk/Desktop/FairMediator && claude-code skill quota-monitor
```

Or create a systemd timer (Linux):

```ini
[Unit]
Description=FairMediator Quota Monitor

[Timer]
OnCalendar=*-*-* 06,18:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

---

## Example Usage

```bash
# Run manually
cd /Users/carolbonk/Desktop/FairMediator
claude-code skill quota-monitor

# Expected output:
# ================================
# QUOTA MONITOR - 2026-02-28 18:00
# ================================
#
# API Services:
#   ✅ HuggingFace: 45% (150/333)
#   ⚠️ Resend: 72% (36/50)
#   ✅ Scraping: 38% (171/450)
#   ✅ Axiom: 12% (680/5,666)
#
# Oracle Cloud:
#   ✅ CPU: 100% (4 cores allocated, 35% active usage)
#   ✅ RAM: 92% (22GB / 24GB)
#   ✅ Storage: 22% (45GB / 200GB)
#   ✅ Bandwidth: 1.5% (156GB / 10TB)
#
# Overall Status: WARNING
#
# ⚠️ 1 service(s) require attention
# See full report: logs/quota-reports/quota-report-2026-02-28-18-00.md
```

---

## Notes

- **Run frequency:** Every 12 hours recommended (6 AM, 6 PM)
- **Retention:** Keep last 30 days of reports (auto-cleanup old reports)
- **Alerts:** Only print to console if WARNING or CRITICAL
- **Backend requirement:** Backend must be running on http://localhost:5001

---

## Success Criteria

✅ Successfully fetches quota data from both endpoints
✅ Generates markdown report with all sections
✅ Saves report to logs/quota-reports/
✅ Prints summary to console
✅ Identifies services >70%, >85%, >95% correctly
✅ Provides actionable recommendations
✅ Handles errors gracefully
