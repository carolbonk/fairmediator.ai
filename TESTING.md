# FairMediator Testing Guide

## ✅ Pre-Deployment Testing Checklist

### 1. Configuration Validation

**Docker Compose Syntax:**
```bash
docker compose config
# Should output valid YAML with no errors
# Verify ports: Backend 4001, Frontend 4010, MongoDB 4030
```

**Environment Variables:**
```bash
# Check your local .env files match .env.example
# Backend .env should have:
grep "CORS_ORIGIN" backend/.env
# Expected: CORS_ORIGIN=http://localhost:4010

# Frontend .env should have:
grep "VITE_API_URL" frontend/.env
# Expected: VITE_API_URL=http://localhost:4001
```

---

### 2. Build and Start Services

**Build Docker images:**
```bash
docker compose build
# Builds backend, frontend containers
# Expected: No build errors
```

**Start all services:**
```bash
docker compose up -d
# Starts MongoDB, backend, frontend
# Expected: All containers running
```

**Check container status:**
```bash
docker compose ps
# Expected output:
# fairmediator-mongodb    running   0.0.0.0:4030->27017/tcp
# fairmediator-backend    running   127.0.0.1:4001->4001/tcp
# fairmediator-frontend   running   127.0.0.1:4010->8080/tcp
```

---

### 3. Health Checks

**Backend API Health:**
```bash
curl http://localhost:4001/health
# Expected: {"status":"ok"} or similar success response
```

**Frontend Accessibility:**
```bash
curl -I http://localhost:4010
# Expected: HTTP/1.1 200 OK
```

**MongoDB Connection:**
```bash
docker compose logs mongodb | grep "Waiting for connections"
# Expected: MongoDB listening on port 27017
```

---

### 4. Network Isolation Testing

**Run isolation verification script:**
```bash
./verify-docker-isolation.sh
# Expected: All checks pass
# - MongoDB isolated on db-network
# - Frontend isolated on backend-network
# - Backend bridges both networks
# - Ports bound to localhost only
```

---

### 5. Port Allocation Verification

**Check all ports are in 4000-4499 range:**
```bash
docker compose ps --format "table {{.Name}}\t{{.Ports}}"
# Expected: All ports between 4000-4499 (except internal container ports)
```

**Verify port binding:**
```bash
netstat -an | grep LISTEN | grep -E "4001|4010|4030"
# Expected:
# 127.0.0.1:4001  (backend)
# 127.0.0.1:4010  (frontend)
# 127.0.0.1:4030  (mongodb)
```

---

### 6. API Endpoint Testing

**Test backend API:**
```bash
# Health check
curl http://localhost:4001/health

# CORS headers
curl -I -H "Origin: http://localhost:4010" http://localhost:4001/health
# Expected: Access-Control-Allow-Origin: http://localhost:4010
```

**Test frontend serves assets:**
```bash
curl http://localhost:4010/
# Expected: HTML content with <!DOCTYPE html>
```

---

### 7. Database Connectivity

**Verify backend can connect to MongoDB:**
```bash
docker compose logs backend | grep -i "mongodb\|database\|connected"
# Expected: Connection success logs
```

**Check MongoDB health:**
```bash
docker exec fairmediator-mongodb mongosh \
  --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }
```

---

### 8. Security Validation

**Verify no exposed secrets:**
```bash
git diff --cached | grep -iE "(api[_-]?key|secret|password|token)"
# Expected: No secrets in staged files (only references in docs)
```

**Check container security:**
```bash
docker compose exec backend cat /proc/1/status | grep CapEff
# Expected: Limited capabilities (not 0x3ffffffffff)
```

---

### 9. Resource Limits

**Verify Oracle Free Tier compliance:**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
# Expected:
# MongoDB:  <25% CPU, <1GB RAM
# Backend:  <100% CPU, <2GB RAM
# Frontend: <25% CPU, <2GB RAM
# TOTAL:    <1.5 cores, <5GB RAM
```

---

### 10. Logs and Debugging

**View all logs:**
```bash
docker compose logs -f
```

**View specific service:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

**Check for errors:**
```bash
docker compose logs | grep -i "error\|fail\|exception" | tail -20
```

---

## 🧹 Cleanup

**Stop services:**
```bash
docker compose down
```

**Remove volumes (destructive - deletes data):**
```bash
docker compose down -v
```

**Remove images:**
```bash
docker compose down --rmi all
```

---

## ❌ Common Issues

### Issue: Port already in use
```bash
# Find process using port
lsof -i :4001
lsof -i :4010
lsof -i :4030

# Kill process
kill -9 <PID>
```

### Issue: Build failures
```bash
# Clean build cache
docker compose build --no-cache

# Remove old images
docker image prune -a
```

### Issue: Backend can't connect to MongoDB
```bash
# Check network
docker network inspect fairmediator_db_network

# Verify MongoDB is healthy
docker compose ps mongodb
```

### Issue: CORS errors in frontend
```bash
# Verify backend CORS_ORIGIN in .env
grep CORS_ORIGIN backend/.env
# Should be: http://localhost:4010
```

---

## 🎯 Acceptance Criteria

**All tests must pass before deployment:**

- ✅ Docker Compose config validates without errors
- ✅ All services build successfully
- ✅ All containers start and stay running
- ✅ Backend responds to /health endpoint
- ✅ Frontend serves on port 4010
- ✅ MongoDB accessible on port 4030
- ✅ Network isolation verified
- ✅ Ports within 4000-4499 range
- ✅ Resource limits within Oracle Free Tier
- ✅ No security vulnerabilities (npm audit)
- ✅ No exposed secrets in git
- ✅ CORS configured correctly
- ✅ All health checks pass

---

## 📊 Test Results Template

```markdown
## Test Run: [DATE]

### Environment
- OS: macOS/Linux/Windows
- Docker: [version]
- Node: [version]

### Results
| Test | Status | Notes |
|------|--------|-------|
| Docker config | ✅/❌ | |
| Build | ✅/❌ | |
| Services start | ✅/❌ | |
| Backend health | ✅/❌ | |
| Frontend loads | ✅/❌ | |
| MongoDB connects | ✅/❌ | |
| Network isolation | ✅/❌ | |
| Port allocation | ✅/❌ | |
| Resource limits | ✅/❌ | |
| Security scan | ✅/❌ | |

### Issues Found
- [List any issues]

### Recommendations
- [List recommendations]
```
