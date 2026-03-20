# Docker Deployment Tiers

Choose your monitoring setup based on available resources and requirements.

## Decision Tree

```
Do you need historical performance data or dashboards?
│
├─ NO → Use Ultra-Lean (0MB additional RAM)
│   └─ Need detailed real-time metrics?
│       ├─ YES → Add Lightweight Monitoring (+150MB)
│       └─ NO → Stay with Ultra-Lean
│
└─ YES → Use Full Monitoring Suite (+850MB-2.4GB)
    └─ Need reverse proxy / custom domains?
        ├─ YES → Include Traefik
        └─ NO → Skip Traefik
```

## Resource Analysis

### Current Application Footprint
```
MongoDB:            ~500MB  (limit: 1GB)
Backend API:        ~200MB  (limit: 2GB)
Frontend (Nginx):   ~20MB   (limit: 2GB)
-------------------------
App total:          ~720MB actual usage
```

### Existing Services (if applicable)
```
Portainer:          ~50MB
Watchtower:         ~10MB
N8N instances:      ~300MB+ (multiple)
Embedding services: ~500MB+ (AI models)
PostgreSQL:         ~50MB
-------------------------
Existing baseline:  ~1GB+
```

## Tier 1: Ultra-Lean

**Additional RAM: 0MB** (uses existing tools only)

### Setup
```bash
# Start your application
docker-compose up -d

# Use existing Portainer for management (if installed)
open http://localhost:9000
```

### What You Get
- Container management via Portainer
- Auto-updates via Watchtower (if configured)
- Basic resource stats in Portainer
- Container logs and shell access
- No additional RAM usage

### What You DON'T Get
- No historical performance graphs
- No custom dashboards
- No advanced time-series metrics
- No alerting system

### Best For
- Laptops with limited RAM
- Development environments
- When basic container management is sufficient
- Teams already using Portainer

### Total RAM
- Application: ~720MB
- Additional: 0MB
- **Total: ~720MB**

## Tier 2: Lightweight Monitoring

**Additional RAM: ~150MB**

### Setup
```bash
# Start application
docker-compose up -d

# Add lightweight monitoring
docker-compose -f docker-compose.monitoring-lite.yml up -d

# View detailed metrics
open http://localhost:8082  # cAdvisor
```

### What You Get
- Everything from Tier 1
- Detailed container metrics (CPU, memory, network, disk)
- Real-time resource graphs per container
- Minimal performance overhead
- Web UI for quick performance checks

### What You DON'T Get
- No long-term data storage (metrics reset on restart)
- No Grafana dashboards
- No alerting system
- No Prometheus query language

### Best For
- Most development setups
- When you want detailed metrics without heavy overhead
- Quick performance debugging
- Understanding resource consumption patterns

### Components
```
cAdvisor:       ~150MB  (container metrics collector)
```

### Total RAM
- Application: ~720MB
- Monitoring: ~150MB
- **Total: ~870MB**

## Tier 3: Full Monitoring Suite

**Additional RAM: ~850MB typical, up to 2.4GB maximum**

### Setup
```bash
# Start application
docker-compose up -d

# Start full monitoring stack
docker-compose -f docker-compose.management.yml up -d

# Access dashboards
open http://localhost:3001  # Grafana (login: admin/admin)
open http://localhost:9090  # Prometheus
```

### What You Get
- Everything from Tiers 1 & 2
- Beautiful Grafana dashboards
- 30 days of historical metrics (configurable)
- Prometheus for advanced time-series queries
- Optional Traefik reverse proxy with SSL
- Node Exporter for system-level metrics
- Customizable alerting via Grafana
- Professional monitoring suitable for production

### Component Breakdown
```
Prometheus:     ~400MB  (metrics database)
Grafana:        ~200MB  (visualization dashboards)
cAdvisor:       ~100MB  (container metrics)
Node Exporter:  ~50MB   (system metrics)
Traefik:        ~100MB  (reverse proxy - optional)
-------------------------
Typical usage:  ~850MB
Maximum limit:  ~2.4GB
```

### Best For
- Production deployments
- When you need historical performance data
- Teams requiring professional dashboards
- Setting up alerts and proactive monitoring
- Preparing for stakeholder presentations
- Oracle Cloud or dedicated servers with available RAM

### Total RAM
- Application: ~720MB
- Monitoring: ~850MB (typical) or ~2.4GB (max)
- **Total: ~1.6GB-3GB**

## Resource Optimization Tips

### 1. Reduce Backend Memory Limit

If your backend was initially configured with wasteful limits:

```yaml
# Edit docker-compose.yml - backend section
deploy:
  resources:
    limits:
      cpus: '1.0'      # Reasonable for API server
      memory: 2G       # Down from 9GB if it was set high
    reservations:
      cpus: '0.25'
      memory: 512M     # Minimum guaranteed
```

**Potential savings: Up to 7GB reserved RAM freed**

### 2. Run Monitoring On-Demand

Don't run heavy monitoring 24/7 during development:

```bash
# Development - just the app
docker-compose up -d

# Debugging performance - add monitoring temporarily
docker-compose -f docker-compose.management.yml up -d

# Done debugging - stop monitoring
docker-compose -f docker-compose.management.yml down
```

### 3. Adjust Docker Desktop Memory Limit

Prevent Docker from consuming all available RAM:

```bash
# macOS: Docker → Preferences → Resources → Memory
# Windows: Docker Desktop → Settings → Resources → Memory
# Set to appropriate limit (e.g., 6GB for 16GB system)
```

### 4. Monitor Current Usage

Check what's actually being used:

```bash
# Real-time stats for all containers
docker stats --no-stream

# Show sorted by memory usage
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | sort -k2 -h

# Just FairMediator containers
docker stats --no-stream --filter "name=fairmediator"
```

## Tier Comparison Table

| Feature | Ultra-Lean | Lightweight | Full Suite |
|---------|-----------|-------------|------------|
| **RAM Cost** | 0MB | +150MB | +850MB-2.4GB |
| **Container Management** | Yes (Portainer) | Yes | Yes |
| **Real-time Metrics** | Basic | Detailed | Detailed |
| **Historical Data** | No | No | 30 days |
| **Dashboards** | No | No | Yes (Grafana) |
| **Alerting** | No | No | Yes |
| **Reverse Proxy** | No | No | Optional (Traefik) |
| **System Metrics** | No | No | Yes (Node Exporter) |
| **Query Language** | No | No | Yes (PromQL) |
| **Best For** | Development | Dev + debugging | Production |

## Oracle Cloud Always Free Tier Constraints

If deploying to Oracle Cloud Always Free:

**Available Resources:**
- CPU: 4 cores (OCPU - AMD EPYC 7551)
- RAM: 24GB
- Storage: 200GB
- Bandwidth: 10TB/month

**Recommended Allocation (50% safety margin):**
- Use: 2 cores, 12GB RAM
- Reserve: 2 cores, 12GB RAM (safety buffer)

**Tier Recommendations for Oracle Cloud:**
- **Ultra-Lean**: Uses ~720MB (6% of available RAM)
- **Lightweight**: Uses ~870MB (7% of available RAM)
- **Full Suite**: Uses ~1.6GB (13% of available RAM)

All tiers fit comfortably within Oracle Cloud Always Free limits. Choose based on monitoring needs, not resource constraints.

## Migration Path

### Start Small, Scale Up

**Week 1: Ultra-Lean**
```bash
docker-compose up -d
```
Establish baseline, verify application works.

**Week 2-4: Add Lightweight (if needed)**
```bash
docker-compose -f docker-compose.monitoring-lite.yml up -d
```
Understand resource patterns, identify bottlenecks.

**Production: Upgrade to Full Suite**
```bash
docker-compose -f docker-compose.management.yml up -d
```
Historical data, alerting, professional dashboards.

### Downgrade Anytime

```bash
# Stop full monitoring
docker-compose -f docker-compose.management.yml down

# Or stop lightweight
docker-compose -f docker-compose.monitoring-lite.yml down

# App keeps running
```

## Recommendations by Environment

### Laptop Development (8-16GB RAM)
**Recommended: Ultra-Lean → Lightweight on-demand**
- Start with just the app (0MB overhead)
- Add lightweight monitoring when debugging performance
- Stop monitoring when not needed

### Desktop Development (16GB+ RAM)
**Recommended: Lightweight → Full Suite occasionally**
- Run lightweight monitoring by default (+150MB)
- Add full suite for sprint demos or deep analysis
- Full suite available but not always running

### Production Server
**Recommended: Full Monitoring Suite**
- Always-on monitoring and alerting
- Historical data for trend analysis
- Professional dashboards for stakeholders
- Traefik for SSL and domain routing

### Oracle Cloud Always Free
**Recommended: Full Monitoring Suite**
- Abundant free resources (24GB RAM available)
- Production-grade monitoring at $0 cost
- Set up alerts for proactive issue detection
- Historical data helps optimize performance over time

## Next Steps

1. **Choose your tier** based on environment and requirements above
2. **Follow setup commands** for your chosen tier
3. **Verify deployment** using `docker ps` and `docker stats`
4. **Configure monitoring** (if using Tier 2 or 3) via [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md)
5. **Review management tools** in [DOCKER_MANAGEMENT_COMPLETE.md](./DOCKER_MANAGEMENT_COMPLETE.md)

## Related Documentation

- [README_DOCKER.md](./README_DOCKER.md) - Documentation index
- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Basic Docker commands
- [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md) - Configure Grafana/Prometheus
- [DOCKER_MANAGEMENT_COMPLETE.md](./DOCKER_MANAGEMENT_COMPLETE.md) - Comprehensive management guide
