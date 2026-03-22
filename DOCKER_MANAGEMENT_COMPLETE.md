# Docker Management Complete Guide

Comprehensive reference for managing FairMediator with Portainer, Traefik, Watchtower, and automated backups.

**For monitoring setup (Grafana, Prometheus, Axiom):** See [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md)
**For deployment options:** See [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md)
**For quick start:** See [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)

## Table of Contents

1. [Portainer - Container Management UI](#portainer---container-management-ui)
2. [Traefik - Reverse Proxy](#traefik---reverse-proxy--ssl)
3. [Resource Limits](#resource-limits---prevent-crashes)
4. [Watchtower - Auto-Updates](#watchtower---auto-updates)
5. [Automated Backups](#automated-backups---weekly-exports)
6. [Common Tasks](#common-tasks)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Start Everything (Application + Management)

```bash
# Start the main application
docker-compose up -d

# Start management and monitoring tools
docker-compose -f docker-compose.management.yml up -d

# Verify everything is running
docker ps --filter "name=fairmediator"
```

### Access Your Services

Once started, access these URLs in your browser:

| Service | URL | Purpose |
|---------|-----|---------|
| **FairMediator** | http://localhost:4010 | Your application |
| **Portainer** | https://localhost:9443 | Container management UI |
| **Grafana** | http://localhost:3001 | Beautiful monitoring dashboards |
| **Traefik** | http://localhost:8080 | Reverse proxy dashboard |
| **Prometheus** | http://localhost:9090 | Metrics database |
| **cAdvisor** | http://localhost:8082 | Container resource monitoring |

## What's Included

### 1. Portainer - Container Management UI (5 min setup)

Portainer gives you a beautiful web interface to manage all your containers.

**Features:**
- Visual container management (start/stop/restart)
- Real-time logs and stats
- Terminal access to containers
- Volume and network management
- Stack deployment (docker-compose UI)

**First-time setup:**
```bash
# Start Portainer
docker-compose -f docker-compose.management.yml up -d portainer

# Visit https://localhost:9443
# Create admin user (username: admin, strong password!)
# Select "Docker" environment
```

**Tagging System:**
All containers are tagged with labels:
- `com.fairmediator.service` - Service name
- `com.fairmediator.stack` - Stack grouping (application/management)
- `com.fairmediator.tier` - Layer (web/api/database)
- `com.fairmediator.description` - What it does

Use these in Portainer filters to organize your containers!

### 2. Traefik - Reverse Proxy + SSL (30 min setup)

Traefik provides automatic HTTPS, domain routing, and load balancing.

**Local Development (localhost):**
```bash
# Already configured! Just start it:
docker-compose -f docker-compose.management.yml up -d traefik

# Access services via friendly URLs:
# http://fairmediator.localhost - Frontend
# http://api.fairmediator.localhost - Backend API
# http://portainer.localhost - Portainer
# http://grafana.localhost - Grafana
```

**Production Setup (Real Domains):**

1. Update `docker-compose.management.yml`:
```yaml
# Uncomment Let's Encrypt configuration in traefik service
# Change email in config/traefik/traefik.yml
```

2. Update DNS records:
```
A    fairmediator.com        → Your server IP
A    api.fairmediator.com    → Your server IP
A    portainer.fairmediator.com → Your server IP
```

3. Traefik will automatically obtain SSL certificates!

### 3. Resource Limits - Prevent Crashes (10 min)

Resource limits are already set! They prevent containers from consuming all system resources.

**Current Limits:**
- **MongoDB**: 1GB RAM, 0.25 CPU cores
- **Backend**: 9GB RAM, 1.5 CPU cores
- **Frontend**: 2GB RAM, 0.25 CPU cores
- **Portainer**: 512MB RAM, 0.5 CPU cores
- **Grafana**: 512MB RAM, 0.5 CPU cores

**Adjust if needed:**
Edit `docker-compose.yml` or `docker-compose.management.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 1G
```

**Monitor usage:**
```bash
# Real-time stats
docker stats

# Just FairMediator containers
docker stats $(docker ps --filter "name=fairmediator" --format "{{.Names}}")
```

### 4. Watchtower - Auto-Updates (5 min)

Watchtower automatically updates your containers when new images are available.

**How it works:**
- Checks for updates daily at 4 AM
- Only updates containers with `com.centurylinklabs.watchtower.enable: true`
- Cleans up old images after update
- Maintains same configuration

**Manual update check:**
```bash
# Force immediate update check
docker exec fairmediator-watchtower watchtower --run-once
```

**Disable auto-updates for a service:**
Remove the watchtower labels from docker-compose.yml:
```yaml
labels:
  # Comment these out:
  # com.centurylinklabs.watchtower.enable: "true"
  # com.centurylinklabs.watchtower.scope: "fairmediator"
```

### 5. Monitoring - Grafana + Prometheus

For complete monitoring setup including:
- Grafana dashboards
- Prometheus configuration
- Axiom logging
- Alert rules
- Custom metrics

**See:** [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md)

### 6. Automated Backups - Weekly Exports (5 min)

Backup all Docker volumes automatically.

**Manual backup:**
```bash
# Backup all volumes
./backup-volumes.sh

# Backups saved to: ./backups/YYYYMMDD_HHMMSS/
```

**Automated weekly backups (cron):**
```bash
# Edit crontab
crontab -e

# Add this line (every Sunday at 2 AM):
0 2 * * 0 cd /Users/carolbonk/Desktop/FairMediator && ./backup-volumes.sh
```

**Restore from backup:**
```bash
# List available backups
ls -la backups/

# Restore (STOP CONTAINERS FIRST!)
docker-compose down
docker-compose -f docker-compose.management.yml down

# Restore from specific backup
./restore-volumes.sh backups/20260320_020000

# Restart containers
docker-compose up -d
docker-compose -f docker-compose.management.yml up -d
```

**Backup storage:**
- Old backups auto-deleted after 7 days
- To keep longer: copy to external storage
- Recommended: sync to cloud (Google Drive, Dropbox, S3)

## Common Tasks

### Start/Stop Everything

```bash
# Start application + management
docker-compose up -d
docker-compose -f docker-compose.management.yml up -d

# Stop everything
docker-compose down
docker-compose -f docker-compose.management.yml down

# Stop and remove volumes (⚠️ DELETES DATA!)
docker-compose down -v
docker-compose -f docker-compose.management.yml down -v
```

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Management services
docker-compose -f docker-compose.management.yml logs -f portainer

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Update Containers

```bash
# Pull latest images
docker-compose pull
docker-compose -f docker-compose.management.yml pull

# Rebuild and restart
docker-compose up -d --build
```

### Access Container Shell

```bash
# Backend
docker exec -it fairmediator-backend sh

# MongoDB
docker exec -it fairmediator-mongodb mongosh

# Portainer
docker exec -it fairmediator-portainer sh
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes (⚠️ careful!)
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

## Security Best Practices

✅ **Already Implemented:**
- Localhost-only ports for sensitive services
- Network segmentation (frontend can't access database)
- Read-only filesystems where possible
- No-new-privileges security option
- Capability restrictions (least privilege)
- Resource limits to prevent DoS

🔒 **Additional Recommendations:**

1. **Change default passwords:**
```bash
# Update .env file
GRAFANA_ADMIN_PASSWORD=strong_password_here
GRAFANA_SECRET_KEY=random_secret_key
```

2. **Enable Traefik authentication:**
```bash
# Generate password hash
echo $(htpasswd -nb admin your_password) | sed -e s/\\$/\\$\\$/g

# Add to docker-compose.management.yml traefik labels:
traefik.http.middlewares.auth.basicauth.users: "admin:$$apr1$$..."
traefik.http.routers.portainer.middlewares: "auth"
```

3. **Restrict Portainer access:**
- Only expose on localhost in production
- Use strong admin password
- Enable 2FA in Portainer settings

4. **Regular updates:**
- Let Watchtower handle automatic updates
- Or manually update weekly: `docker-compose pull && docker-compose up -d`

## Monitoring & Alerts

For complete monitoring and alerting setup:
- Grafana alert configuration
- Prometheus queries
- Custom dashboards
- Notification channels

**See:** [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md#alerting-setup)

## Troubleshooting

### Portainer won't start

```bash
# Check logs
docker logs fairmediator-portainer

# Reset Portainer (⚠️ loses settings!)
docker-compose -f docker-compose.management.yml down
docker volume rm fairmediator_portainer_data
docker-compose -f docker-compose.management.yml up -d portainer
```

### Traefik not routing correctly

```bash
# Check Traefik logs
docker logs fairmediator-traefik

# Verify labels on containers
docker inspect fairmediator-backend | grep -A 10 Labels

# Check dashboard: http://localhost:8080
```

### Monitoring issues (Grafana, Prometheus)

For monitoring-specific troubleshooting:
**See:** [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md#troubleshooting)

### Backup failed

```bash
# Check disk space
df -h

# Verify volumes exist
docker volume ls | grep fairmediator

# Test backup manually
docker run --rm -v fairmediator_mongodb_data:/source:ro alpine ls -la /source
```

## Learning Resources

- [Portainer Documentation](https://docs.portainer.io/)
- [Traefik Quick Start](https://doc.traefik.io/traefik/getting-started/quick-start/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Watchtower Documentation](https://containrrr.dev/watchtower/)

**For monitoring resources:**
- [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md)

## Support

Having issues? Check:
1. Container logs: `docker-compose logs -f`
2. Container status: `docker ps -a | grep fairmediator`
3. Resource usage: `docker stats`
4. Network connectivity: `docker network inspect fairmediator_backend_network`

## Next Steps

1. **Explore Portainer** - Get familiar with the container management UI
2. **Set up monitoring** - See [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md)
3. **Schedule weekly backups** - Add backup script to cron
4. **Monitor resource usage** - Use `docker stats` to optimize containers
5. **Set up production domains** - Configure Traefik for HTTPS and SSL

## Related Documentation

- [README_DOCKER.md](./README_DOCKER.md) - Documentation index
- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Basic Docker commands
- [DOCKER_DEPLOYMENT_TIERS.md](./DOCKER_DEPLOYMENT_TIERS.md) - Choose deployment option
- [DOCKER_MONITORING_SETUP.md](./DOCKER_MONITORING_SETUP.md) - Monitoring configuration
