# Docker Quick Start Guide

> **Documentation:** [README_DOCKER.md](./README_DOCKER.md) - Docker documentation index

Quick reference for running FairMediator with proper isolation.

## Starting the Project

### Production
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Development
```bash
# Start all services (with hot reload)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## Verification

```bash
# Run isolation verification script
./verify-docker-isolation.sh

# Check running containers
docker ps --filter "name=fairmediator"

# Check networks
docker network ls --filter "name=fairmediator"

# Check volumes
docker volume ls --filter "name=fairmediator"
```

## Common Operations

### Restart a Service
```bash
# Production
docker-compose restart backend

# Development
docker-compose -f docker-compose.dev.yml restart backend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Execute Commands in Container
```bash
# Backend shell
docker exec -it fairmediator-backend sh

# MongoDB shell
docker exec -it fairmediator-mongodb mongosh

# Run npm command
docker exec fairmediator-backend npm run test
```

### Update Images
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

## Cleanup

### Remove Containers (Keep Data)
```bash
docker-compose down
```

### Remove Everything (Including Data)
```bash
# WARNING: This deletes your database!
docker-compose down -v
```

### Remove Unused Resources
```bash
# Clean up dangling images/containers
docker system prune

# Clean up volumes (careful!)
docker volume prune
```

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :4010

# Change port in docker-compose.yml or use:
FRONTEND_PORT=4011 docker-compose up -d
```

### Container Won't Start
```bash
# Check logs for errors
docker-compose logs backend

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Database Connection Issues
```bash
# Check MongoDB health
docker exec fairmediator-mongodb mongosh --eval "db.adminCommand('ping')"

# Check backend can reach MongoDB
docker exec fairmediator-backend nc -zv mongodb 27017
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Remove images (will redownload)
docker-compose down --rmi all -v

# Start fresh
docker-compose up -d
```

## Running Multiple Projects

If you have other Docker projects:

1. **Use different project names**
   ```bash
   # In docker-compose.yml
   name: fairmediator

   # Other project
   name: myotherapp
   ```

2. **Use different ports**
   ```yaml
   # FairMediator: 3000, 5001, 27017
   # Other project: 3001, 5002, 27018
   ```

3. **Use different subnets**
   ```yaml
   # FairMediator: 172.20.x.x, 172.21.x.x
   # Other project: 172.24.x.x, 172.25.x.x
   ```

## Security Checklist

- [ ] Database bound to localhost only
- [ ] API bound to localhost only
- [ ] Networks segmented (frontend can't reach database)
- [ ] Volumes prefixed with project name
- [ ] Security options enabled (no-new-privileges)
- [ ] Resource limits set
- [ ] Secrets not committed to git

## Performance Monitoring

```bash
# Real-time resource usage
docker stats

# Specific project only
docker stats $(docker ps --filter "name=fairmediator" --format "{{.Names}}")

# Disk usage
docker system df -v | grep fairmediator
```

## Configuration Files

- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration
- `.env` - Environment variables (secrets)
- `.env.docker` - Docker-specific settings
- `DOCKER_ISOLATION.md` - Detailed isolation documentation
- `verify-docker-isolation.sh` - Isolation verification script

## Resources

- [Docker Isolation Documentation](./DOCKER_ISOLATION.md)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

## Support

If you encounter issues:
1. Check logs: `docker-compose logs`
2. Verify isolation: `./verify-docker-isolation.sh`
3. Review configuration: `docker-compose config`
4. Check documentation: `DOCKER_ISOLATION.md`
