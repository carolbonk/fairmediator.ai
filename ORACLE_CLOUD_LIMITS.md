# Oracle Cloud Always Free - Resource Limits & Monitoring

**CRITICAL:** Never exceed these limits to stay on the free tier forever.

---

## 🆓 Oracle Cloud Always Free Limits

### Actual Oracle Cloud Limits
- **CPU:** 4 ARM cores (Ampere A1)
- **RAM:** 24GB total
- **Storage:** 200GB block storage
- **Bandwidth:** 10TB/month outbound
- **Shape:** VM.Standard.A1.Flex

### Our Safety Limits (50% of Maximum)
**We set limits to 50% to provide maximum safety buffer and prevent accidental overages:**

- **CPU:** 2 cores (50% of 4 cores)
- **RAM:** 12GB (50% of 24GB)
- **Storage:** 100GB (50% of 200GB)
- **Bandwidth:** 5TB/month (50% of 10TB)
- **Daily Bandwidth:** 170GB/day (50% of 340GB)

**Our Allocation:**
- 1 VM instance: 2 cores max, 12GB RAM max
- Runs: Frontend (Nginx) + Backend (Node.js) + MongoDB (optional)
- **Safety margin:** 50% headroom from true limits

---

### Storage
- **Actual Limit:** 200GB (VM disk)
- **Our Safety Limit:** 100GB (50% of 200GB)
- **Object Storage:** 20GB (not currently used)

**Our Usage:**
- OS + Docker: ~10GB
- Application code: ~2GB
- Logs: ~5GB
- Docker images: ~3GB
- **Total:** ~20GB (20% of safety limit)
- **Available:** 80GB (within safety limit)

---

### Networking
- **Actual Limit:** 10TB/month outbound
- **Our Safety Limit:** 5TB/month (50% of 10TB)
- **Daily Safe Limit:** 170GB/day (50% of 340GB)
- **Load Balancer:** Included
- **Public IPs:** Included

**Typical Usage:**
- API requests: ~50GB/month
- Asset delivery: ~100GB/month
- **Total:** ~150GB/month (3% of safety limit)
- **Safe margin:** 4.85TB/month (within safety limit)

---

## 🚨 Monitoring & Alerts

### Automatic Protection

**Free Tier Monitor** tracks Oracle Cloud resources in real-time:

```javascript
// backend/src/utils/freeTierMonitor.js
// Set to 50% for maximum safety margin (50% headroom)
oracle_cpu: { limit: 2 cores }        // 50% of 4 cores
oracle_ram: { limit: 12GB }           // 50% of 24GB
oracle_storage: { limit: 100GB }      // 50% of 200GB
oracle_bandwidth: { monthly: 5TB, daily: 170GB }    // 50% of 10TB/340GB
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
  mongodb:
    deploy:
      resources:
        limits:
          cpus: '0.25'   # Max 0.25 cores (12.5% of 2-core safety limit)
          memory: 1G     # Max 1GB (8.3% of 12GB safety limit)

  backend:
    deploy:
      resources:
        limits:
          cpus: '1.5'    # Max 1.5 cores (75% of 2-core safety limit)
          memory: 9G     # Max 9GB (75% of 12GB safety limit)

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.25'   # Max 0.25 cores (12.5% of 2-core safety limit)
          memory: 2G     # Max 2GB (16.7% of 12GB safety limit)
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

- [ ] Check CPU allocation: ≤ 2 cores total (50% safety limit)
- [ ] Check RAM allocation: ≤ 12GB total (50% safety limit)
- [ ] Check storage usage: < 80GB (80% of safety limit)
- [ ] Check bandwidth: < 140GB/day (80% of safety limit)
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

# Check allocated cores (should be ≤ 2)
nproc

# Check total RAM (should be ≤ 12GB)
free -h | grep Mem | awk '{print $2}'

# Check disk usage (should be < 100GB)
df -h /

# Check bandwidth (if vnstat installed, should be < 170GB/day)
vnstat -d
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

### Current Allocation (50% Safety Limit)
- **MongoDB:** 0.25 cores, 1GB RAM
- **Backend:** 1.5 cores, 9GB RAM
- **Frontend:** 0.25 cores, 2GB RAM
- **Total:** 2 cores, 12GB RAM
- **Headroom from safety limit:** 0 cores, 0GB RAM
- **Headroom from true limit:** 2 cores, 12GB RAM (50% buffer)

### Alternative (External MongoDB)
- **Backend:** 1.5 cores, 10GB RAM
- **Frontend:** 0.5 cores, 2GB RAM
- **MongoDB:** External (Atlas M0 Free Tier)
- **Total:** 2 cores, 12GB RAM
- **Headroom:** Better performance, same safety margin

**Current setup provides 50% safety buffer from Oracle's true limits.**

---

## 🎯 Summary

| Resource | True Limit | Safety Limit (50%) | Allocated | Headroom from True Limit |
|----------|------------|-------------------|-----------|-------------------------|
| **CPU** | 4 cores | 2 cores | 2 cores | 2 cores (50%) |
| **RAM** | 24GB | 12GB | 12GB | 12GB (50%) |
| **Storage** | 200GB | 100GB | ~80GB | 120GB (60%) |
| **Bandwidth** | 10TB/mo | 5TB/mo | ~150GB/mo | 9.85TB (98.5%) |

**Key Takeaway:**
- **Safety limits** set to 50% of true limits (50% buffer)
- **Docker allocation** uses most of safety limit but stays within buffer
- **Total protection:** 50% headroom prevents accidental overages
- **Monitoring** alerts at 70%, 85%, 95% of safety limits

**Monitoring URL:** `https://fairmediator.com/api/monitoring/oracle-cloud`

**Status:** ✅ Protected - Free tier monitoring active
