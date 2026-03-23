# Quota Guard Skill

## Purpose
Prevent commits and deployments when free tier quotas are at critical levels. Protect against accidental quota exhaustion.

## When to Use
- Before major commits
- Before deployments to production
- When quota warnings appear in Axiom logs
- As part of deployment-checklist skill

## Free Tier Limits (Reference)

| Service | Daily Limit | Monthly Limit | Cost if Exceeded |
|---------|-------------|---------------|------------------|
| Hugging Face API | 333 | 10,000 | Varies by model |
| OpenRouter | 333 | 10,000 | Pay-per-token |
| MongoDB Atlas | - | 512MB storage | $0.08/GB |
| Resend Email | 50 | 1,500 | $0.001/email |
| Web Scraping | 450 | 15,000 | N/A (self-imposed) |
| Axiom Logging | 5,666 | 170,000 logs | $0.25/GB |

## Task

1. **Check Quota Status**
   - Start backend server if not running
   - Call `GET http://localhost:4011/api/monitoring/quota-status` (dev) or `http://localhost:4001/api/monitoring/quota-status` (prod)
   - Parse response JSON

2. **Analyze Results**
   - Check `overall.status`: ok, warning, critical
   - List services with status != 'ok'
   - Calculate days until quota reset

3. **Decision Matrix**
   - **OK (<70%)**: Green light, proceed
   - **WARNING (70-85%)**: Yellow light, warn user but allow
   - **CRITICAL (85-95%)**: Orange light, strong warning, require confirmation
   - **EXHAUSTED (>95%)**: Red light, block action, suggest mitigation

4. **Mitigation Strategies**
   If quota critical/exhausted:
   - Disable non-essential features (set ENABLE_*=false in .env)
   - Reduce log verbosity (change LOG_LEVEL to 'error')
   - Wait for quota reset (show countdown)
   - Consider upgrading service to paid tier
   - Use alternative service (e.g., switch AI model)

## Example Output

```
🛡️  QUOTA GUARD CHECK

✅ Hugging Face: 45% used (150/333 daily) - OK
⚠️  OpenRouter: 78% used (260/333 daily) - WARNING
🔴 Resend Email: 96% used (48/50 daily) - CRITICAL
✅ MongoDB: 112MB/512MB (22%) - OK
✅ Axiom Logging: 1,234/5,666 daily - OK

⚠️  WARNING: 1 service in WARNING state
🔴 CRITICAL: 1 service in CRITICAL state

RECOMMENDATION: Block deployment until Resend quota resets in 4 hours.

Mitigation options:
1. Disable email features temporarily (RESEND_DAILY_LIMIT=0)
2. Wait 4 hours for quota reset
3. Upgrade Resend to paid tier ($20/month for 50k emails)
```

## Exit Codes
- 0: All quotas healthy, proceed
- 1: Warning state, proceed with caution
- 2: Critical state, require user confirmation
- 3: Exhausted state, block action
