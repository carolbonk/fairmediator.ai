# FairMediator Docker Documentation

**Start here to navigate Docker setup, deployment, and management.**

## Quick Navigation

### I want to...

**Get started quickly**
- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Basic Docker commands and first-time setup

**Choose a deployment option**
- [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md) - Compare 3 deployment tiers (lean, lightweight, full monitoring)

**Set up monitoring and dashboards**
- [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md) - Grafana, Prometheus, Axiom logging configuration

**Learn all management tools**
- [DOCKER_MANAGEMENT_COMPLETE.md](./DOCKER_MANAGEMENT_COMPLETE.md) - Comprehensive guide for Portainer, Traefik, backups, security

**Understand isolation and security**
- [DOCKER_ISOLATION.md](./DOCKER_ISOLATION.md) - Network segmentation, resource isolation, security strategy

## Documentation Hierarchy

```
README_DOCKER.md (you are here)
├── DOCKER_QUICKSTART.md
│   └── First-time setup, basic docker-compose commands
├── DOCKER_DEPLOYMENT_TIERS.md
│   └── Choose: Ultra-lean, Lightweight, or Full monitoring
├── DOCKER_MONITORING_SETUP.md
│   └── Grafana dashboards, Prometheus queries, Axiom logging
├── DOCKER_MANAGEMENT_COMPLETE.md
│   └── Reference: All tools, troubleshooting, advanced topics
└── DOCKER_ISOLATION.md
    └── Network segmentation, security strategy, resource isolation
```

## Recommended Path

### For Development (Laptop)
1. Read [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)
2. Choose "Ultra-lean" tier from [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md)
3. Use existing Portainer for basic management
4. Add monitoring later if needed

### For Production (Oracle Cloud)
1. Read [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)
2. Choose "Full monitoring" tier from [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md)
3. Set up monitoring via [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md)
4. Configure production tools via [DOCKER_MANAGEMENT_COMPLETE.md](./DOCKER_MANAGEMENT_COMPLETE.md)

## Quick Reference

### Essential Commands
```bash
# Start application
docker-compose up -d

# Check status
docker ps --filter "name=fairmediator"

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down
```

### Service URLs
| Service | URL | Documentation |
|---------|-----|---------------|
| Frontend | http://localhost:4010 | DOCKER_QUICKSTART.md |
| Backend API | http://localhost:5001 | DOCKER_QUICKSTART.md |
| Portainer | http://localhost:9000 | DOCKER_MANAGEMENT_COMPLETE.md |
| Grafana | http://localhost:3001 | DOCKER_MONITORING_SETUP.md |
| Prometheus | http://localhost:9090 | DOCKER_MONITORING_SETUP.md |

### Files Reference
| File | Purpose | When to Use |
|------|---------|-------------|
| `docker-compose.yml` | Main application stack | Always (required) |
| `docker-compose.management.yml` | Full monitoring suite | Production or when you need Grafana |
| `docker-compose.monitoring-lite.yml` | Lightweight monitoring | Development when you need basic metrics |
| `backup-volumes.sh` | Backup all volumes | Weekly backups, before major changes |
| `restore-volumes.sh` | Restore from backup | Disaster recovery |

## Resource Requirements

### Minimum (Ultra-lean deployment)
- RAM: 1GB (app only)
- CPU: 1 core
- Storage: 10GB

### Recommended (Lightweight monitoring)
- RAM: 1.5GB (app + lite monitoring)
- CPU: 1.5 cores
- Storage: 15GB

### Production (Full monitoring suite)
- RAM: 3GB (app + Grafana + Prometheus)
- CPU: 2 cores
- Storage: 30GB (includes 30 days of metrics)

See [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md) for detailed breakdown.

## Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker-compose logs backend

# Check health status
docker ps -a | grep fairmediator

# See detailed guide
```
Reference: [DOCKER_MANAGEMENT_COMPLETE.md](./DOCKER_MANAGEMENT_COMPLETE.md#troubleshooting)

### Out of memory
```bash
# Check current usage
docker stats --no-stream

# See deployment options
```
Reference: [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md#resource-optimization)

### Monitoring not working
```bash
# Verify Prometheus targets
curl http://localhost:9090/targets

# See monitoring setup
```
Reference: [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md#troubleshooting)

## Next Steps

1. **First time here?** Start with [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)
2. **Ready to deploy?** Choose your tier in [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md)
3. **Need dashboards?** Set up monitoring via [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md)
4. **Going to production?** Review [DOCKER_MANAGEMENT_COMPLETE.md](./DOCKER_MANAGEMENT_COMPLETE.md)
