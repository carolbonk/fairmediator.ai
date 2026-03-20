# Docker Monitoring Setup

Complete guide for setting up Grafana, Prometheus, and Axiom logging for FairMediator.

## Quick Start

### Option 1: Lightweight Monitoring (cAdvisor only)
```bash
# Start application
docker-compose up -d

# Add lightweight monitoring
docker-compose -f docker-compose.monitoring-lite.yml up -d

# Access metrics
open http://localhost:8082  # cAdvisor
```

### Option 2: Full Monitoring Suite (Grafana + Prometheus)
```bash
# Start application
docker-compose up -d

# Start monitoring stack
docker-compose -f docker-compose.management.yml up -d prometheus grafana cadvisor node-exporter

# Access dashboards
open http://localhost:3001  # Grafana (login: admin/admin)
open http://localhost:9090  # Prometheus
```

## Components Overview

### cAdvisor - Container Metrics Collector
**Purpose:** Real-time container resource monitoring
**RAM:** ~100-150MB
**URL:** http://localhost:8082

**What it provides:**
- CPU usage per container
- Memory usage and limits
- Network I/O statistics
- Filesystem usage
- Container metadata

**Access:** Web UI shows real-time graphs for all running containers

### Prometheus - Metrics Database
**Purpose:** Time-series metrics storage and querying
**RAM:** ~400MB (depends on retention period)
**URL:** http://localhost:9090

**Configuration:**
- Scrape interval: 15 seconds
- Retention: 30 days (configurable in `config/prometheus/prometheus.yml`)
- Storage: Local volume (persistent across restarts)

**What it scrapes:**
- cAdvisor metrics (container stats)
- Node Exporter metrics (system stats)
- Optional: Backend `/metrics` endpoint (application metrics)

### Grafana - Visualization Dashboards
**Purpose:** Beautiful dashboards and alerting
**RAM:** ~200MB
**URL:** http://localhost:3001

**Default credentials:**
- Username: `admin`
- Password: `admin` (change on first login!)

**Pre-configured:**
- Prometheus datasource (automatic)
- FairMediator Overview dashboard (auto-loaded)

### Node Exporter - System Metrics
**Purpose:** Host machine statistics
**RAM:** ~50MB
**URL:** http://localhost:9100/metrics (raw metrics)

**What it provides:**
- CPU usage (system-wide)
- Memory and swap usage
- Disk I/O and space
- Network statistics
- System load averages

## Grafana Setup

### First-Time Configuration

1. **Access Grafana:**
   ```bash
   open http://localhost:3001
   ```

2. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin`
   - You'll be prompted to change password

3. **Verify datasource:**
   - Navigate to: Configuration → Data Sources
   - Should see "Prometheus" already configured
   - Click "Test" to verify connection

4. **View pre-loaded dashboard:**
   - Navigate to: Dashboards → Browse
   - Open "FairMediator Overview"

### Dashboard Panels

The pre-configured "FairMediator Overview" dashboard includes:

1. **Container CPU Usage**
   - Query: `rate(container_cpu_usage_seconds_total{name=~"fairmediator.*"}[5m]) * 100`
   - Shows CPU percentage per container over time

2. **Container Memory Usage**
   - Query: `container_memory_usage_bytes{name=~"fairmediator.*"} / 1024 / 1024`
   - Shows memory in MB per container

3. **Network Traffic**
   - Query: `rate(container_network_transmit_bytes_total{name=~"fairmediator.*"}[5m])`
   - Shows network I/O in bytes/sec

4. **Disk Usage**
   - Query: `(node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100`
   - Shows disk space percentage

### Importing Community Dashboards

Grafana has thousands of pre-built dashboards:

1. **Navigate to:** Dashboards → Import
2. **Enter dashboard ID** from [grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards)
3. **Recommended dashboards:**
   - `11600` - Docker Container & Host Metrics (comprehensive)
   - `893` - Docker & System Monitoring (detailed)
   - `1860` - Node Exporter Full (system metrics)
   - `14282` - Docker Monitoring (modern UI)

4. **Click "Load"** and select Prometheus datasource

### Creating Custom Dashboards

1. **Navigate to:** Dashboards → New Dashboard
2. **Click "Add new panel"**
3. **Enter PromQL query** (examples below)
4. **Configure visualization** (graph, gauge, stat, etc.)
5. **Save dashboard**

Example queries:
```promql
# Backend API response time (if /metrics endpoint added)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# MongoDB connections
mongodb_connections{name="fairmediator-mongodb"}

# Container restart count
changes(container_start_time_seconds{name=~"fairmediator.*"}[1h])

# Memory usage percentage
(container_memory_usage_bytes{name=~"fairmediator.*"} / container_spec_memory_limit_bytes{name=~"fairmediator.*"}) * 100
```

## Prometheus Configuration

### Scrape Configuration

Edit `config/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # cAdvisor - container metrics
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # Node Exporter - system metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Backend API metrics (optional - TODO(human))
  # - job_name: 'backend'
  #   static_configs:
  #     - targets: ['backend:5001']
  #   metrics_path: '/metrics'
```

**TODO(human):** If you add a `/metrics` endpoint to your backend, uncomment the backend scrape config above.

### Retention Period

Adjust data retention in `docker-compose.management.yml`:

```yaml
prometheus:
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.retention.time=30d'  # Change this (e.g., 90d, 180d)
    - '--storage.tsdb.path=/prometheus'
```

Longer retention = more disk usage. Monitor with:
```bash
du -sh $(docker volume inspect fairmediator_prometheus_data | grep Mountpoint | awk '{print $2}')
```

### Querying Prometheus

Access Prometheus UI at http://localhost:9090

**Useful queries:**

```promql
# All available metrics
{__name__=~".+"}

# FairMediator containers only
{name=~"fairmediator.*"}

# CPU usage last 5 minutes
rate(container_cpu_usage_seconds_total{name="fairmediator-backend"}[5m])

# Memory usage current
container_memory_usage_bytes{name="fairmediator-backend"}

# Network received bytes per second
rate(container_network_receive_bytes_total{name="fairmediator-frontend"}[1m])

# Disk writes per second
rate(container_fs_writes_total{name="fairmediator-mongodb"}[1m])
```

## Alerting Setup

### Grafana Alert Rules

1. **Navigate to:** Alerting → Alert rules → New alert rule

2. **Configure alert:**
   ```
   Name: High Backend Memory Usage
   Query: (container_memory_usage_bytes{name="fairmediator-backend"} / container_spec_memory_limit_bytes{name="fairmediator-backend"}) * 100
   Condition: WHEN last() IS ABOVE 90
   For: 5m
   ```

3. **Create notification channel:**
   - Alerting → Contact points → New contact point
   - Choose: Email, Slack, Discord, Webhook, PagerDuty, etc.

4. **Common alert examples:**

   **High CPU Usage:**
   ```
   Query: rate(container_cpu_usage_seconds_total{name=~"fairmediator.*"}[5m]) * 100
   Condition: IS ABOVE 80
   For: 10m
   ```

   **Container Down:**
   ```
   Query: up{job="cadvisor"}
   Condition: IS BELOW 1
   For: 1m
   ```

   **Low Disk Space:**
   ```
   Query: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100
   Condition: IS BELOW 10
   For: 5m
   ```

### Email Notifications

Configure SMTP in `.env`:
```bash
# Grafana email settings
GF_SMTP_ENABLED=true
GF_SMTP_HOST=smtp.gmail.com:587
GF_SMTP_USER=your-email@gmail.com
GF_SMTP_PASSWORD=your-app-password
GF_SMTP_FROM_ADDRESS=your-email@gmail.com
GF_SMTP_FROM_NAME=FairMediator Monitoring
```

Restart Grafana:
```bash
docker-compose -f docker-compose.management.yml restart grafana
```

### Slack Notifications

1. **Create Slack webhook:**
   - Go to https://api.slack.com/apps
   - Create new app → Incoming Webhooks
   - Copy webhook URL

2. **Add to Grafana:**
   - Alerting → Contact points → New contact point
   - Type: Slack
   - URL: Paste webhook URL
   - Test to verify

## Axiom Logging Integration

Axiom provides centralized logging with powerful querying capabilities.

### Setup

1. **Create Axiom account:**
   - Sign up at https://axiom.co
   - Create dataset (e.g., "fairmediator-logs")
   - Generate API token

2. **Add to `.env`:**
   ```bash
   AXIOM_DATASET=fairmediator-logs
   AXIOM_TOKEN=xaat-your-token-here
   AXIOM_ORG_ID=your-org-id
   AXIOM_ENABLED=true
   ```

3. **Restart backend:**
   ```bash
   docker-compose restart backend
   ```

### Backend Integration

Ensure your backend code sends logs to Axiom (already configured in docker-compose.yml environment variables).

Example backend logging:
```javascript
// Backend should use axiom-node client
const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN,
  orgId: process.env.AXIOM_ORG_ID
});

// Log events
axiom.ingest(process.env.AXIOM_DATASET, [
  {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'User logged in',
    userId: user.id,
    ip: req.ip
  }
]);
```

### Querying Logs

Access Axiom dashboard at https://app.axiom.co

**Example queries:**

```sql
-- All errors in last hour
['fairmediator-logs']
| where level == 'error'
| where timestamp > ago(1h)

-- User authentication events
['fairmediator-logs']
| where message contains 'login' or message contains 'logout'
| summarize count() by userId

-- API response times
['fairmediator-logs']
| where responseTime > 1000
| project timestamp, endpoint, responseTime
| order by responseTime desc
```

## Troubleshooting

### Grafana shows no data

**Check Prometheus datasource:**
```bash
# Access Grafana → Configuration → Data Sources → Prometheus → Test
# Should show "Data source is working"
```

**Verify Prometheus is scraping:**
```bash
# Visit http://localhost:9090/targets
# All targets should show "UP" status
```

**Check cAdvisor is running:**
```bash
curl http://localhost:8082/metrics
# Should return metrics in Prometheus format
```

### Prometheus not scraping targets

**Check target configuration:**
```bash
# Verify targets in http://localhost:9090/targets
# Look for error messages
```

**Verify network connectivity:**
```bash
# From Prometheus container, ping cAdvisor
docker exec fairmediator-prometheus wget -qO- http://cadvisor:8080/metrics | head
```

**Check Prometheus logs:**
```bash
docker-compose -f docker-compose.management.yml logs prometheus
```

### High memory usage

**Reduce Prometheus retention:**
Edit `docker-compose.management.yml`:
```yaml
prometheus:
  command:
    - '--storage.tsdb.retention.time=15d'  # Reduce from 30d
```

**Reduce scrape frequency:**
Edit `config/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 30s  # Increase from 15s
```

### cAdvisor not showing all containers

**Verify Docker socket mount:**
```bash
docker inspect fairmediator-cadvisor | grep "/var/run/docker.sock"
# Should show volume mount
```

**Restart cAdvisor:**
```bash
docker-compose -f docker-compose.management.yml restart cadvisor
```

### Axiom not receiving logs

**Verify environment variables:**
```bash
docker exec fairmediator-backend env | grep AXIOM
# Should show all AXIOM_* variables
```

**Check backend logs:**
```bash
docker-compose logs backend | grep -i axiom
```

**Test API token:**
```bash
curl -H "Authorization: Bearer $AXIOM_TOKEN" \
     -H "Content-Type: application/json" \
     https://api.axiom.co/v1/datasets
```

## Performance Optimization

### Reduce Monitoring Overhead

1. **Increase scrape intervals:**
   - 15s → 30s saves ~50% CPU on Prometheus
   - Trade-off: Less granular data

2. **Disable unused exporters:**
   ```bash
   # If you don't need system metrics, stop node-exporter
   docker-compose -f docker-compose.management.yml stop node-exporter
   ```

3. **Use recording rules:**
   Pre-compute expensive queries in `config/prometheus/rules.yml`:
   ```yaml
   groups:
     - name: fairmediator
       interval: 60s
       rules:
         - record: fairmediator:container_memory_usage_percent
           expr: (container_memory_usage_bytes{name=~"fairmediator.*"} / container_spec_memory_limit_bytes{name=~"fairmediator.*"}) * 100
   ```

### Dashboard Performance

1. **Use shorter time ranges** (last 6 hours vs last 30 days)
2. **Increase refresh interval** (1 min vs 5 sec)
3. **Limit number of series** in queries using filters

## Next Steps

1. **Access Grafana** and change default password
2. **Import recommended dashboards** from Grafana.com
3. **Set up at least one alert** (e.g., high memory usage)
4. **Configure Axiom logging** for centralized log analysis
5. **Review metrics daily** to establish baseline performance

## Related Documentation

- [README_DOCKER.md](./README_DOCKER.md) - Documentation index
- [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md) - Choose monitoring tier
- [DOCKER_MANAGEMENT_COMPLETE.md](./DOCKER_MANAGEMENT_COMPLETE.md) - All management tools
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Prometheus Documentation](https://prometheus.io/docs/)
