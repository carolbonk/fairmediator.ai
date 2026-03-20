# FairMediator Port Allocation Strategy

**Port Range**: `4000-4099` (Reserved exclusively for FairMediator Docker services)

**Last Updated**: March 20, 2026

---

## 📋 Quick Reference

| Port | Service | Environment | Description |
|------|---------|-------------|-------------|
| **4000** | Frontend | Production | React SPA (Nginx) |
| **4001** | Backend API | Production | Node.js/Express REST API |
| **4002** | Backend Metrics | Production | Prometheus metrics endpoint (future) |
| **4010** | Frontend | Development | Vite dev server with HMR |
| **4011** | Backend API | Development | Node.js dev server with hot reload |
| **4012** | Backend Debug | Development | Node.js inspector protocol |
| **4013** | Mailhog UI | Development | Email testing web interface |
| **4014** | Mailhog SMTP | Development | SMTP server for email testing |
| **4020** | Traefik Dashboard | Management | Reverse proxy dashboard |
| **4021** | Prometheus | Management | Metrics collection & time-series DB |
| **4022** | Grafana | Management | Monitoring dashboards |
| **4023** | cAdvisor | Management | Container metrics |
| **4024** | Node Exporter | Management | System-level metrics |
| **4030** | MongoDB | All | NoSQL database |
| **4031** | Mongo Express | Development | MongoDB web admin UI |
| **4040-4059** | Reserved | Future | ML/AI services, microservices |
| **4060-4099** | Reserved | Future | Scaling & expansion |

---

## 🎯 Port Allocation Philosophy

### Range Segmentation

**4000-4009: Core Application Services**
- Production-critical services that must be always available
- Frontend, backend API, health checks, metrics

**4010-4019: Development Tools**
- Dev servers with hot reload, debugging, email testing
- Only active during local development

**4020-4029: Monitoring & Management**
- Infrastructure monitoring, logging, reverse proxy
- Optional services for production observability

**4030-4039: Database Services**
- Primary data stores and admin interfaces
- Isolated for security and easy firewall rules

**4040-4099: Reserved for Future Growth**
- ML model servers, microservices, job queues
- Scaling without port conflicts

---

## 📦 Service Details

### Core Application (4000-4009)

#### **4000 - Frontend (Production)**
```bash
Service: fairmediator-frontend
Container Port: 8080 (nginx)
Host Binding: 127.0.0.1:4000:8080
Access: http://localhost:4000
```
- **Purpose**: Production React SPA served via Nginx
- **Health Check**: `wget http://localhost:8080/`
- **Resource Limits**: 0.25 CPU cores, 2GB RAM

#### **4001 - Backend API (Production)**
```bash
Service: fairmediator-backend
Container Port: 5001
Host Binding: 127.0.0.1:4001:5001
Access: http://localhost:4001/api
```
- **Purpose**: Node.js/Express REST API with rate limiting
- **Health Check**: `GET /health`
- **Resource Limits**: 1.0 CPU cores, 2GB RAM
- **Environment Variable**: `PORT=5001` (internal), exposed as `4001`

#### **4002 - Backend Metrics (Reserved)**
```bash
Status: Planned
Purpose: Prometheus metrics endpoint (/metrics)
Integration: Future Prometheus scraping
```

---

### Development Tools (4010-4019)

#### **4010 - Frontend (Development)**
```bash
Service: fairmediator-dev-frontend
Container Port: 3000 (Vite)
Host Binding: 0.0.0.0:4010:3000
Access: http://localhost:4010
```
- **Purpose**: Vite dev server with hot module replacement (HMR)
- **Features**: Fast refresh, source maps, debugging tools
- **Command**: `npm run dev`

#### **4011 - Backend API (Development)**
```bash
Service: fairmediator-dev-backend
Container Port: 5001
Host Binding: 127.0.0.1:4011:5001
Access: http://localhost:4011/api
```
- **Purpose**: Node.js dev server with nodemon auto-restart
- **Features**: Hot reload, detailed error stacks, API testing
- **Command**: `npm run dev`

#### **4012 - Backend Debug (Development)**
```bash
Service: fairmediator-dev-backend
Container Port: 9229
Host Binding: 127.0.0.1:4012:9229
Access: chrome://inspect
```
- **Purpose**: Node.js Inspector Protocol for Chrome DevTools
- **Usage**: Attach Chrome debugger, set breakpoints, inspect variables
- **Command**: `node --inspect=0.0.0.0:9229`

#### **4013 - Mailhog UI (Development)**
```bash
Service: fairmediator-dev-mailhog
Container Port: 8025
Host Binding: 127.0.0.1:4013:8025
Access: http://localhost:4013
```
- **Purpose**: Web interface for viewing captured emails
- **Features**: Email preview, JSON export, search

#### **4014 - Mailhog SMTP (Development)**
```bash
Service: fairmediator-dev-mailhog
Container Port: 1025
Host Binding: 127.0.0.1:4014:1025
Access: SMTP at localhost:4014
```
- **Purpose**: Fake SMTP server for email testing
- **Configuration**: Set `SMTP_HOST=mailhog` and `SMTP_PORT=1025` in backend

---

### Monitoring & Management (4020-4029)

#### **4020 - Traefik Dashboard**
```bash
Service: fairmediator-traefik
Container Port: 8080
Host Binding: 127.0.0.1:4020:8080
Access: http://localhost:4020/dashboard/
```
- **Purpose**: Reverse proxy configuration & routing dashboard
- **Features**: Real-time traffic, middleware, TLS certificates
- **Security**: Localhost-only binding for production

#### **4021 - Prometheus**
```bash
Service: fairmediator-prometheus
Container Port: 9090
Host Binding: 127.0.0.1:4021:9090
Access: http://localhost:4021
```
- **Purpose**: Metrics collection & time-series database
- **Scrape Targets**: Backend (/metrics), cAdvisor, Node Exporter
- **Retention**: 30 days
- **Resource Limits**: 0.5 CPU cores, 1GB RAM

#### **4022 - Grafana**
```bash
Service: fairmediator-grafana
Container Port: 3000
Host Binding: 127.0.0.1:4022:3000
Access: http://localhost:4022
```
- **Purpose**: Beautiful monitoring dashboards & analytics
- **Datasources**: Prometheus, Loki (if added)
- **Default Credentials**: admin/admin (change in production!)
- **Resource Limits**: 0.5 CPU cores, 512MB RAM

#### **4023 - cAdvisor**
```bash
Service: fairmediator-cadvisor
Container Port: 8080
Host Binding: 127.0.0.1:4023:8080
Access: http://localhost:4023
```
- **Purpose**: Container resource usage & performance metrics
- **Data**: CPU, memory, network, filesystem per container
- **Integration**: Scraped by Prometheus every 15s
- **Resource Limits**: 0.25 CPU cores, 256MB RAM

#### **4024 - Node Exporter**
```bash
Service: fairmediator-node-exporter
Container Port: 9100
Host Binding: 127.0.0.1:4024:9100
Access: http://localhost:4024/metrics
```
- **Purpose**: System-level metrics (CPU, memory, disk, network)
- **Data**: Host machine stats (not container-level)
- **Integration**: Scraped by Prometheus
- **Resource Limits**: 0.25 CPU cores, 128MB RAM

---

### Database Services (4030-4039)

#### **4030 - MongoDB**
```bash
Service: fairmediator-mongodb
Container Port: 27017
Host Binding: 127.0.0.1:4030:27017
Access: mongodb://localhost:4030
```
- **Purpose**: Primary NoSQL database for all application data
- **Features**: Vector search, full-text search, aggregation pipelines
- **Resource Limits**: 0.25 CPU cores, 1GB RAM
- **Connection String**: `mongodb://admin:password@localhost:4030/fairmediator?authSource=admin`

#### **4031 - Mongo Express (Development)**
```bash
Service: fairmediator-dev-mongo-express
Container Port: 8081
Host Binding: 127.0.0.1:4031:8081
Access: http://localhost:4031
```
- **Purpose**: Web-based MongoDB admin interface
- **Features**: Browse collections, run queries, view indexes
- **Default Credentials**: admin/admin
- **⚠️ Security**: Only for development, never expose in production!

---

### Reserved Ranges (4040-4099)

#### **4040-4049: ML/AI Services**
```bash
Planned Services:
- 4040: Settlement Predictor API (Python/Flask)
- 4041: Ideology Classifier Model Server
- 4042: Conflict Detection ML Endpoint
- 4043: Embedding Service (Sentence Transformers)
```

#### **4050-4059: Microservices Expansion**
```bash
Planned Services:
- 4050: Scraping Job Queue (Bull/Redis)
- 4051: Email Service Worker
- 4052: Notification Service
- 4053: Analytics Pipeline
```

#### **4060-4069: Testing & QA**
```bash
Planned Services:
- 4060: Cypress/Playwright E2E Test Runner
- 4061: Storybook Component Library
- 4062: API Mock Server
```

#### **4070-4099: Future Expansion**
```bash
Reserved for:
- Additional databases (PostgreSQL, Redis, Elasticsearch)
- Caching layers
- Message queues
- Load balancer instances
```

---

## 🔒 Security Best Practices

### Localhost-Only Bindings
All services use `127.0.0.1:PORT` binding by default (not `0.0.0.0:PORT`):
```yaml
ports:
  - "127.0.0.1:4001:5001"  # ✅ Secure (localhost only)
  - "4001:5001"            # ❌ Insecure (exposes to network)
```

**Exception**: Frontend dev server (`4010`) binds to `0.0.0.0` for mobile device testing.

### Firewall Rules
If deploying on Oracle Cloud or other cloud providers:
```bash
# Allow only essential ports through firewall
sudo ufw allow 80/tcp    # HTTP (Traefik)
sudo ufw allow 443/tcp   # HTTPS (Traefik)
sudo ufw deny 4000:4099/tcp  # Block all FairMediator ports from external access
```

All services accessed via Traefik reverse proxy on ports 80/443.

---

## 🚀 Quick Start Commands

### Development Environment
```bash
# Start core dev stack (frontend, backend, MongoDB, Mailhog)
docker-compose -f docker-compose.dev.yml up -d

# Access services
open http://localhost:4010  # Frontend (Vite)
open http://localhost:4011/api/health  # Backend API
open http://localhost:4013  # Mailhog (emails)
open http://localhost:4031  # Mongo Express (database)

# Attach debugger to backend
# 1. Open Chrome: chrome://inspect
# 2. Click "Configure" → Add: localhost:4012
# 3. Click "inspect" on the backend target
```

### Production Environment
```bash
# Start production stack
docker-compose up -d

# Access services (localhost only, use reverse proxy for external access)
curl http://localhost:4001/health  # Backend health check
curl http://localhost:4000  # Frontend (returns HTML)
```

### Monitoring Stack
```bash
# Start full monitoring (Traefik, Prometheus, Grafana, cAdvisor)
docker-compose -f docker-compose.management.yml up -d

# Access dashboards
open http://localhost:4020/dashboard/  # Traefik
open http://localhost:4021  # Prometheus
open http://localhost:4022  # Grafana (admin/admin)
open http://localhost:4023  # cAdvisor
```

### Lightweight Monitoring
```bash
# Start just cAdvisor (minimal resource usage)
docker-compose -f docker-compose.monitoring-lite.yml up -d

# Access metrics
open http://localhost:4023  # cAdvisor UI
```

---

## 🛠️ Environment Variables

### `.env` Configuration
```bash
# Core Application Ports (exposed to host)
FRONTEND_PORT=4000
BACKEND_PORT=4001
MONGODB_PORT=4030

# Development Ports
DEV_FRONTEND_PORT=4010
DEV_BACKEND_PORT=4011
DEV_DEBUG_PORT=4012
DEV_MAILHOG_UI_PORT=4013
DEV_MAILHOG_SMTP_PORT=4014
DEV_MONGO_EXPRESS_PORT=4031

# Management Ports
TRAEFIK_DASHBOARD_PORT=4020
PROMETHEUS_PORT=4021
GRAFANA_PORT=4022
CADVISOR_PORT=4023
NODE_EXPORTER_PORT=4024

# Internal Container Ports (do not change unless modifying Dockerfiles)
BACKEND_INTERNAL_PORT=5001
FRONTEND_INTERNAL_PORT=8080
```

---

## 📊 Port Conflict Resolution

### Check for Conflicts
```bash
# List all ports in use in 4000-4099 range
lsof -i :4000-4099

# Check specific port
lsof -i :4001

# Kill process using port (macOS/Linux)
lsof -ti :4001 | xargs kill -9
```

### Common Conflicts
- **Port 4000**: Often used by Netlify CLI, Webpack dev servers
  - **Solution**: Stop conflicting service or change `FRONTEND_PORT` in `.env`
- **Port 4010**: May conflict with React dev servers
  - **Solution**: Use `DEV_FRONTEND_PORT=4015` in `.env`
- **Port 4030**: MongoDB default is 27017, unlikely conflict
  - **Solution**: Internal container port remains 27017, only host binding changes

---

## 🔄 Migration from Old Ports

### Before (Legacy Ports)
```yaml
Frontend: 3000
Backend: 5001
MongoDB: 27017
Mongo Express: 8081
Mailhog UI: 8025
Mailhog SMTP: 1025
Traefik: 8080
Prometheus: 9090
Grafana: 3001
cAdvisor: 8082
Node Exporter: 9100
Backend Debug: 9229
```

### After (New 4000-4099 Range)
```yaml
Frontend: 4000 (prod), 4010 (dev)
Backend: 4001 (prod), 4011 (dev)
MongoDB: 4030
Mongo Express: 4031
Mailhog UI: 4013
Mailhog SMTP: 4014
Traefik: 4020
Prometheus: 4021
Grafana: 4022
cAdvisor: 4023
Node Exporter: 4024
Backend Debug: 4012
```

### Update Your Bookmarks
```bash
# Old → New
http://localhost:3000 → http://localhost:4010  # Dev frontend
http://localhost:5001 → http://localhost:4011  # Dev backend
http://localhost:8081 → http://localhost:4031  # Mongo Express
http://localhost:8025 → http://localhost:4013  # Mailhog
http://localhost:9090 → http://localhost:4021  # Prometheus
http://localhost:3001 → http://localhost:4022  # Grafana
http://localhost:8080 → http://localhost:4020  # Traefik
```

---

## 📝 Notes

- **Internal vs External Ports**: Container internal ports remain unchanged (e.g., Backend uses `PORT=5001` internally). Only host-to-container mappings changed.
- **Docker Networks**: Services communicate via Docker networks using service names (e.g., `backend:5001`), not via host ports.
- **Production Deployment**: On Oracle Cloud, only Traefik ports 80/443 are exposed publicly. All 4000-4099 ports are localhost-only.
- **Scaling**: When adding microservices, allocate ports from reserved ranges (4040+) to maintain organization.

---

## 🤝 Contributing

When adding new services:
1. Choose port from appropriate range (4040+ for new services)
2. Update this document with service details
3. Add port to `.env.example` with description
4. Document in relevant docker-compose file comments
5. Update firewall rules if needed

---

## 📚 Related Documentation

- [DOCKER_MANAGEMENT_GUIDE.md](./backend/DOCKER_MANAGEMENT_GUIDE.md) - Container orchestration
- [ORACLE_CLOUD_LIMITS.md](./backend/ORACLE_CLOUD_LIMITS.md) - Resource constraints
- [CONTEXT.md](./CONTEXT.md) - Project overview
- [README.md](./README.md) - Getting started

---

**Last Updated**: March 20, 2026
**Maintained By**: FairMediator DevOps Team
**Questions?**: Create an issue in the repo
