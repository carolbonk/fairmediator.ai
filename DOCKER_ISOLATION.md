# Docker Isolation & Security Strategy

> **Documentation:** [README_DOCKER.md](./README_DOCKER.md) - Docker documentation index

This document explains how FairMediator uses Docker's isolation features to run securely alongside other Docker projects on the same machine.

## Overview

When running multiple Docker projects on the same machine, proper isolation is critical for:
- **Security**: Preventing cross-project access and attacks
- **Resource Management**: Avoiding conflicts and resource exhaustion
- **Stability**: Ensuring one project doesn't impact others
- **Organization**: Clear separation of concerns

## How FairMediator Achieves Isolation

### 1. Explicit Project Naming

**File**: `docker-compose.yml`, `docker-compose.dev.yml`

```yaml
name: fairmediator  # Production
name: fairmediator-dev  # Development
```

**What it does**:
- Prefixes all resources (containers, networks, volumes) with `fairmediator`
- Prevents naming conflicts with other projects
- Makes resources easily identifiable

**Container names become**:
- `fairmediator-mongodb` (instead of `fairmediator_mongodb_1`)
- `fairmediator-backend`
- `fairmediator-frontend`

### 2. Network Segmentation

**Production networks**:
```yaml
networks:
  db-network:
    subnet: 172.20.0.0/24
  backend-network:
    subnet: 172.21.0.0/24
```

**Development networks**:
```yaml
networks:
  db-network:
    subnet: 172.22.0.0/24
  backend-network:
    subnet: 172.23.0.0/24
```

**What it does**:
- Creates isolated bridge networks for each project
- Prevents containers from different projects communicating
- Uses unique subnet ranges to avoid IP conflicts

**Network architecture**:
```
┌─────────────────────────────────────────────┐
│  db-network (172.20.0.0/24)                 │
│  ┌──────────┐         ┌─────────┐          │
│  │ MongoDB  │◄────────┤ Backend │          │
│  └──────────┘         └─────────┘          │
└──────────────────────────┬──────────────────┘
                           │
┌──────────────────────────▼──────────────────┐
│  backend-network (172.21.0.0/24)            │
│  ┌─────────┐          ┌──────────┐         │
│  │ Backend │◄─────────┤ Frontend │         │
│  └─────────┘          └──────────┘         │
└─────────────────────────────────────────────┘
```

**Benefits**:
- **Database isolation**: MongoDB only accessible by backend
- **Defense in depth**: Compromised frontend can't directly access database
- **Microservice patterns**: Easy to add more services with proper boundaries

### 3. Volume Isolation

**Production volumes**:
```yaml
volumes:
  fairmediator_mongodb_data:
    name: fairmediator_mongodb_data
  fairmediator_backend_node_modules:
    name: fairmediator_backend_node_modules
```

**Development volumes**:
```yaml
volumes:
  fairmediator_dev_mongodb_data:
    name: fairmediator-dev_mongodb_data
  fairmediator_dev_backend_node_modules:
    name: fairmediator-dev_backend_node_modules
```

**What it does**:
- Prefixes volume names with project identifier
- Prevents data mixing between projects
- Ensures clean separation of persistent data

**View your volumes**:
```bash
docker volume ls | grep fairmediator
```

### 4. Port Binding Security

**Production bindings**:
```yaml
ports:
  - "127.0.0.1:27017:27017"  # MongoDB
  - "127.0.0.1:5001:5001"    # Backend
  - "3000:8080"              # Frontend (public)
```

**What it does**:
- Binds sensitive services (DB, API) to `127.0.0.1` (localhost only)
- Prevents external access to internal services
- Only frontend exposed publicly (or use reverse proxy)

**Security implications**:
- External attackers cannot directly access MongoDB
- API only accessible from localhost or via frontend
- Use nginx/traefik as reverse proxy for production

### 5. Security Hardening

#### Read-Only Filesystems

```yaml
# Frontend (static files, no writes needed)
read_only: true
tmpfs:
  - /var/cache/nginx:noexec,nosuid,size=50m
  - /tmp:noexec,nosuid,size=50m
```

**Benefits**:
- Prevents malware from writing to filesystem
- Limits impact of container compromise
- Forces explicit writable mounts

#### Capability Dropping

```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE  # Only what's needed
```

**What it does**:
- Removes all Linux capabilities by default
- Adds back only necessary capabilities
- Prevents privilege escalation attacks

#### Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1.5'
      memory: 9G
```

**Benefits**:
- Prevents resource exhaustion
- Protects other projects on same machine
- Enforces Oracle Cloud Always Free tier limits

## Running Multiple Projects

### Project A (FairMediator)

```bash
# Production
docker-compose --env-file .env.docker up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

**Resources created**:
- Containers: `fairmediator-*`
- Networks: `fairmediator_db_network`, `fairmediator_backend_network`
- Volumes: `fairmediator_*`

### Project B (Different App)

Create similar structure:
```yaml
name: myotherapp

networks:
  db-network:
    subnet: 172.24.0.0/24  # Different subnet!
  backend-network:
    subnet: 172.25.0.0/24

ports:
  - "127.0.0.1:27018:27017"  # Different port!
  - "127.0.0.1:5002:5001"
  - "3001:8080"
```

**Resources created**:
- Containers: `myotherapp-*`
- Networks: `myotherapp_db_network`, `myotherapp_backend_network`
- Volumes: `myotherapp_*`

### Both Projects Run Simultaneously

```bash
# Check running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Output:
# fairmediator-frontend    Up  0.0.0.0:3000->8080/tcp
# fairmediator-backend     Up  127.0.0.1:5001->5001/tcp
# fairmediator-mongodb     Up  127.0.0.1:27017->27017/tcp
# myotherapp-frontend      Up  0.0.0.0:3001->8080/tcp
# myotherapp-backend       Up  127.0.0.1:5002->5001/tcp
# myotherapp-mongodb       Up  127.0.0.1:27018->27017/tcp
```

**Complete isolation achieved**:
- No network overlap
- No port conflicts
- No volume mixing
- No namespace collisions

## Verification Commands

### Check Network Isolation

```bash
# List all networks
docker network ls | grep fairmediator

# Inspect network to see connected containers
docker network inspect fairmediator_db_network

# Verify subnets don't overlap
docker network inspect fairmediator_db_network -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

### Check Volume Isolation

```bash
# List all volumes for this project
docker volume ls | grep fairmediator

# Inspect volume location
docker volume inspect fairmediator_mongodb_data

# Check disk usage
docker system df -v | grep fairmediator
```

### Check Container Isolation

```bash
# List containers for this project
docker ps --filter "name=fairmediator"

# Check container's network membership
docker inspect fairmediator-backend -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Verify security options
docker inspect fairmediator-backend -f '{{.HostConfig.SecurityOpt}}'
docker inspect fairmediator-backend -f '{{.HostConfig.CapDrop}}'
```

### Test Network Segmentation

```bash
# Try to reach MongoDB from frontend (should fail)
docker exec fairmediator-frontend nc -zv mongodb 27017
# Expected: Connection refused or timeout

# Try to reach MongoDB from backend (should work)
docker exec fairmediator-backend nc -zv mongodb 27017
# Expected: Connection succeeded
```

## Production Deployment

### With Reverse Proxy (Recommended)

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    networks:
      - backend-network
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

**Benefits**:
- SSL/TLS termination
- Rate limiting
- DDoS protection
- Static file caching

### Environment-Based Configuration

```bash
# Production
docker-compose --env-file .env -f docker-compose.yml up -d

# Staging
COMPOSE_PROJECT_NAME=fairmediator-staging \
docker-compose -f docker-compose.yml up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3000

# Change port in .env.docker
FRONTEND_PORT=3001
```

### Network Subnet Conflict

```bash
# List all networks and subnets
docker network ls -q | xargs docker network inspect -f '{{.Name}}: {{range .IPAM.Config}}{{.Subnet}}{{end}}'

# Change subnet in docker-compose.yml
ipam:
  config:
    - subnet: 172.26.0.0/24  # Use different range
```

### Volume Cleanup

```bash
# Remove all volumes for this project
docker-compose down -v

# Remove specific volume
docker volume rm fairmediator_mongodb_data

# Clean up unused volumes
docker volume prune
```

## Security Best Practices

1. **Never expose databases publicly**
   - Always bind to `127.0.0.1`
   - Use VPN or SSH tunnel for remote access

2. **Use secrets management**
   - Don't commit `.env` files
   - Use Docker secrets or external vaults

3. **Regular updates**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

4. **Monitor resource usage**
   ```bash
   docker stats
   ```

5. **Review logs regularly**
   ```bash
   docker-compose logs -f --tail=100
   ```

## Summary

FairMediator uses Docker's isolation features to run securely:

| Feature | Implementation | Benefit |
|---------|---------------|---------|
| **Namespaces** | Project name: `fairmediator` | Isolated processes, separate from other projects |
| **Networks** | `db-network`, `backend-network` | Segmented communication, defense in depth |
| **Volumes** | Project-prefixed names | Data isolation, no cross-project access |
| **Ports** | Localhost binding | External attack surface minimized |
| **Security** | no-new-privileges, cap_drop | Privilege escalation prevented |
| **Resources** | CPU/memory limits | Fair sharing, no resource exhaustion |

This approach allows you to safely run FairMediator alongside any number of other Docker projects on the same machine without conflicts or security concerns.
