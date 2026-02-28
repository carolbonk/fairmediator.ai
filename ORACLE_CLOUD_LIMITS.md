# Oracle Cloud Always Free - Resource Limits & Monitoring

**CRITICAL:** Never exceed these limits to stay on the free tier forever.

---

## 🆓 Oracle Cloud Always Free Limits

### Compute Resources
- **CPU:** 4 ARM cores (Ampere A1)
- **RAM:** 24GB total
- **Shape:** VM.Standard.A1.Flex

**Our Allocation:**
- 1 VM instance: 4 cores, 24GB RAM
- Runs: Frontend (Nginx) + Backend (Node.js) + MongoDB (optional)

---

### Storage
- **Block Storage:** 200GB (VM disk)
- **Object Storage:** 20GB (not currently used)

**Our Usage:**
- OS + Docker: ~10GB
- Application code: ~2GB
- Logs: ~5GB
- Docker images: ~3GB
- **Total:** ~20GB (10% of limit)
- **Available:** 180GB

---

### Networking
- **Bandwidth:** 10TB/month outbound
- **Daily Safe Limit:** 340GB/day (10TB ÷ 30)
- **Load Balancer:** Included
- **Public IPs:** Included

**Typical Usage:**
- API requests: ~50GB/month
- Asset delivery: ~100GB/month
- **Total:** ~150GB/month (1.5% of limit)
- **Safe margin:** 9.85TB/month

---

## 🚨 Monitoring & Alerts

### Automatic Protection

**Free Tier Monitor** tracks Oracle Cloud resources in real-time:

```javascript
// backend/src/utils/freeTierMonitor.js
oracle_cpu: { limit: 4 cores }
oracle_ram: { limit: 24GB }
oracle_storage: { limit: 200GB }
oracle_bandwidth: { monthly: 10TB, daily: 340GB }
```

### Alert Thresholds

| Level | Threshold | Action |
|-------|-----------|--------|
| ⚠️ **WARNING** | 70% | Log warning |
| 🟧 **ALERT** | 85% | Email notification |
| 🔴 **CRITICAL** | 95% | Block new deployments |
| ⛔ **EXCEEDED** | 100% | Auto-shutdown non-essential services |

---

## 📊 Monitoring Endpoints

### 1. Real-Time Dashboard
```bash
GET /api/monitoring/oracle-cloud
```

**Response:**
```json
{
  "timestamp": "2026-02-27T19:00:00Z",
  "limits": {
    "CPU_CORES": 4,
    "RAM_GB": 24,
    "STORAGE_GB": 200,
    "BANDWIDTH_GB_MONTHLY": 10240
  },
  "usage": {
    "cpu": {
      "cores": 4,
      "usagePercent": 35,
      "status": "OK"
    },
    "ram": {
      "totalGB": 24,
      "usedGB": 8.5,
      "freeGB": 15.5,
      "usagePercent": 35.4,
      "status": "OK"
    },
    "storage": {
      "totalGB": 200,
      "usedGB": 45,
      "availableGB": 155,
      "usagePercent": 22.5,
      "status": "OK"
    },
    "bandwidth": {
      "dailyGB": 5.2,
      "monthlyGB": 156,
      "monthlyLimit": 10240,
      "usagePercent": 1.5,
      "status": "OK"
    }
  },
  "alerts": {
    "critical": [],
    "hasCritical": false
  },
  "summary": {
    "withinLimits": true,
    "message": "All resources within Oracle Cloud Always Free limits"
  }
}
```

### 2. Safe to Deploy Check
```bash
GET /api/monitoring/oracle-cloud/safe-to-deploy
```

**Response (Safe):**
```json
{
  "safe": true,
  "message": "Safe to deploy - all resources within limits"
}
```

**Response (Blocked):**
```json
{
  "safe": false,
  "error": "Deployment blocked - Oracle Cloud resources at capacity",
  "reason": "⚠️  2 resource(s) at or exceeding limits",
  "alerts": [
    "RAM: 24GB/24GB allocated",
    "Storage: 195GB/200GB used"
  ],
  "recommendation": "Wait for resource usage to decrease or upgrade to paid tier"
}
```

---

## 🛡️ Protection Mechanisms

### 1. Pre-Deployment Check (GitHub Actions)

Add to `.github/workflows/docker-ci.yml`:

```yaml
- name: Check Oracle Cloud Limits
  run: |
    SAFE=$(curl -s https://fairmediator.com/api/monitoring/oracle-cloud/safe-to-deploy | jq -r '.safe')
    if [ "$SAFE" != "true" ]; then
      echo "❌ Deployment blocked - Oracle Cloud limits exceeded"
      exit 1
    fi
    echo "✅ Safe to deploy"
```

### 2. Auto-Scaling Prevention

**Docker Compose limits** prevent accidental resource allocation:

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'      # Max 2 cores (50% of 4-core limit)
          memory: 8G     # Max 8GB (33% of 24GB limit)
        reservations:
          cpus: '1'
          memory: 4G

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'      # Max 1 core
          memory: 2G     # Max 2GB
```

### 3. Bandwidth Monitoring (Optional)

Install `vnstat` for automatic bandwidth tracking:

```bash
# On Oracle Cloud instance
sudo apt install vnstat
sudo systemctl enable vnstat
sudo systemctl start vnstat

# Create cron job to export data
cat > /etc/cron.hourly/vnstat-export << 'EOF'
#!/bin/bash
vnstat --json > /var/log/oracle-bandwidth.json
EOF
chmod +x /etc/cron.hourly/vnstat-export
```

---

## ⚙️ Environment Variables

Add to `backend/.env`:

```bash
# Oracle Cloud Always Free Limits
ORACLE_CPU_LIMIT=4                 # 4 ARM cores max
ORACLE_RAM_LIMIT=24576            # 24GB in MB
ORACLE_STORAGE_LIMIT=204800       # 200GB in MB
ORACLE_BANDWIDTH_LIMIT=10240      # 10TB in GB (monthly)
ORACLE_BANDWIDTH_DAILY_LIMIT=340  # ~340GB/day

# Alert thresholds
FREE_TIER_WARNING_THRESHOLD=0.70
FREE_TIER_ALERT_THRESHOLD=0.85
FREE_TIER_CRITICAL_THRESHOLD=0.95
```

---

## 🚀 Deployment Safety Checklist

Before deploying to Oracle Cloud:

- [ ] Check CPU allocation: ≤ 4 cores total
- [ ] Check RAM allocation: ≤ 24GB total
- [ ] Check storage usage: < 180GB (90% limit)
- [ ] Check bandwidth: < 300GB/day
- [ ] Run `GET /api/monitoring/oracle-cloud/safe-to-deploy`
- [ ] Review Docker resource limits in `docker-compose.yml`
- [ ] Verify no auto-scaling enabled
- [ ] Confirm account is in "Always Free" mode (not "Paid")

---

## 🔍 Manual Verification

### Check Current Instance Shape
```bash
# SSH into Oracle Cloud instance
ssh ubuntu@<your-ip>

# Check allocated cores
nproc

# Check total RAM
free -h | grep Mem | awk '{print $2}'

# Check disk usage
df -h /

# Check bandwidth (if vnstat installed)
vnstat -m
```

### Verify Always Free Status

1. Log into Oracle Cloud Console
2. Go to **Governance → Limits, Quotas and Usage**
3. Check "Always Free-eligible resources in use"
4. Verify account status: **Free Tier** (not Paid)

---

## 🆘 What If Limits Are Exceeded?

### CPU/RAM Over Limit
**Cause:** Tried to create instances totaling > 4 cores or > 24GB
**Fix:** Delete or downsize instances to fit within limits
**Prevention:** Use `docker-compose` resource limits

### Storage Over Limit
**Cause:** Logs, Docker images, or data exceeded 200GB
**Fix:**
```bash
# Clean Docker
docker system prune -a --volumes -f

# Clean logs
find /var/log -name "*.log" -mtime +7 -delete

# Clean old backups
rm -rf /backups/old/*
```

### Bandwidth Over Limit
**Cause:** Heavy traffic or large file transfers
**Fix:** Traffic throttling (rare - 10TB is generous)
**Note:** Oracle Cloud rarely enforces bandwidth limits on Always Free

---

## 📈 Recommended Resource Allocation

### Conservative (Recommended)
- **Backend:** 2 cores, 8GB RAM
- **Frontend:** 1 core, 2GB RAM
- **MongoDB:** External (Atlas M0 Free Tier)
- **Headroom:** 1 core, 14GB RAM for spikes

### Aggressive (Max Utilization)
- **Backend:** 3 cores, 16GB RAM
- **Frontend:** 1 core, 4GB RAM
- **MongoDB:** External
- **Headroom:** 0 cores, 4GB RAM

**Use Conservative** to prevent accidental overages.

---

## 🎯 Summary

| Resource | Limit | Recommended | Headroom |
|----------|-------|-------------|----------|
| **CPU** | 4 cores | 3 cores | 25% |
| **RAM** | 24GB | 18GB | 25% |
| **Storage** | 200GB | 150GB | 25% |
| **Bandwidth** | 10TB/mo | 8TB/mo | 20% |

**Key Takeaway:** Always maintain 20-25% headroom to handle traffic spikes and prevent accidental overages.

**Monitoring URL:** `https://fairmediator.com/api/monitoring/oracle-cloud`

**Status:** ✅ Protected - Free tier monitoring active
