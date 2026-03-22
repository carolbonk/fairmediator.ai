# Oracle Cloud CI/CD Deployment - Quick Start Guide

**Automated deployment to Oracle Cloud Always Free tier using GitHub Actions**

---

## 🎯 What's Been Set Up

Your repository now has **fully automated CI/CD** for Oracle Cloud deployment:

### ✅ Components Ready

1. **GitHub Actions Workflows**
   - `.github/workflows/docker-ci.yml` - Builds and pushes Docker images to GHCR
   - `.github/workflows/deploy-oracle.yml` - Deploys to Oracle Cloud instance
   - `.github/workflows/security-scan.yml` - Security scanning

2. **Docker Configuration**
   - `docker-compose.yml` - Base configuration (development)
   - `docker-compose.prod.yml` - Production override (uses GHCR images)

3. **Deployment Scripts**
   - `scripts/deploy-oracle.sh` - Manual deployment helper script

4. **Documentation**
   - `GITHUB_SECRETS_SETUP.md` - How to configure GitHub secrets
   - `ORACLE_CLOUD_DEPLOYMENT.md` - Full Oracle Cloud setup guide
   - `ORACLE_CLOUD_LIMITS.md` - Resource limits and monitoring

### 🚀 Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Developer pushes to main branch                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ 2. GitHub Actions: Build & Push (docker-ci.yml)            │
│    ✓ Build backend & frontend Docker images                │
│    ✓ Run Trivy security scans                              │
│    ✓ Push images to GitHub Container Registry (GHCR)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ 3. GitHub Actions: Deploy (deploy-oracle.yml)              │
│    ✓ Check Oracle Cloud resource limits                    │
│    ✓ SSH into Oracle instance                              │
│    ✓ Pull latest code and images                           │
│    ✓ Restart containers with new version                   │
│    ✓ Run health checks                                     │
│    ✓ Clean up old resources                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ 4. Application running on Oracle Cloud                     │
│    ✓ Backend: http://YOUR_IP:5001                          │
│    ✓ Frontend: http://YOUR_IP:4010                         │
│    ✓ Monitoring: http://YOUR_IP:5001/api/monitoring/*      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before deployment works, you need:

### 1. Oracle Cloud Instance Running
- [ ] Oracle Cloud account created
- [ ] ARM Ampere A1 instance provisioned (4 cores, 24GB RAM)
- [ ] Docker and Docker Compose installed on instance
- [ ] Firewall configured (ports 22, 80, 443, 4010, 5001)

**Follow:** `ORACLE_CLOUD_DEPLOYMENT.md` for full setup instructions

### 2. GitHub Secrets Configured
- [ ] `ORACLE_SSH_KEY` - Private SSH key for instance access
- [ ] `ORACLE_HOST` - Public IP or domain of instance
- [ ] `ORACLE_USER` - SSH username (usually `ubuntu`)
- [ ] `ORACLE_INSTANCE_URL` - Full URL (e.g., `http://123.45.67.89`)

**Follow:** `GITHUB_SECRETS_SETUP.md` for detailed instructions

### 3. Oracle Instance Prepared
- [ ] Repository cloned to `~/fairmediator.ai` or `~/FairMediator`
- [ ] `.env` file configured with production secrets
- [ ] GitHub Container Registry login configured
- [ ] Deployment script executable: `chmod +x scripts/deploy-oracle.sh`

---

## 🚀 Deployment Options

### Option 1: Automatic Deployment (Recommended)

**Push to main branch → automatic deployment**

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# GitHub Actions automatically:
# 1. Builds Docker images
# 2. Pushes to GHCR
# 3. Deploys to Oracle Cloud
# 4. Runs health checks
```

Watch progress: **GitHub → Actions → Deploy to Oracle Cloud**

---

### Option 2: Manual Trigger from GitHub

**Deploy without pushing code**

1. Go to GitHub repository → **Actions** tab
2. Click **Deploy to Oracle Cloud**
3. Click **Run workflow** → Select branch → **Run workflow**

---

### Option 3: Manual SSH Deployment

**Direct deployment from Oracle instance**

```bash
# SSH into Oracle Cloud instance
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_ORACLE_IP

# Run deployment script
cd ~/fairmediator.ai
./scripts/deploy-oracle.sh pull
```

---

## 🎯 Quick Setup Checklist

### Step 1: Create Oracle Cloud Instance (30 minutes)

```bash
# 1. Sign up for Oracle Cloud (if not done)
https://www.oracle.com/cloud/free/

# 2. Create ARM instance
# Follow: ORACLE_CLOUD_DEPLOYMENT.md (Steps 2-5)

# 3. SSH into instance
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_ORACLE_IP

# 4. Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# Log out and back in

# 5. Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/FairMediator.git fairmediator.ai
cd fairmediator.ai

# 6. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 7. Make deployment script executable
chmod +x scripts/deploy-oracle.sh
```

---

### Step 2: Configure GitHub Secrets (10 minutes)

```bash
# 1. Get SSH private key
cat ~/Downloads/ssh-key-*.key  # Copy this

# 2. Get Oracle instance IP
# Oracle Cloud Console → Compute → Instances → Public IP

# 3. Add secrets to GitHub
# Repository → Settings → Secrets and variables → Actions → New secret
```

**Required secrets:**
- `ORACLE_SSH_KEY` → Your private SSH key (full content)
- `ORACLE_HOST` → `123.45.67.89` (your Oracle IP)
- `ORACLE_USER` → `ubuntu`
- `ORACLE_INSTANCE_URL` → `http://123.45.67.89`

**Follow:** `GITHUB_SECRETS_SETUP.md` for detailed instructions

---

### Step 3: Configure GitHub Container Registry Access (5 minutes)

**On Oracle instance:**

```bash
# SSH into Oracle instance
ssh ubuntu@YOUR_ORACLE_IP

# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify login
docker pull ghcr.io/YOUR_USERNAME/fairmediator/backend:latest
```

**To create a GitHub token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Select `read:packages` scope
3. Copy token and use in `docker login` command above

---

### Step 4: Test Deployment (5 minutes)

**Trigger deployment:**

```bash
# Option A: Push to main branch
git push origin main

# Option B: Manual GitHub Actions trigger
# GitHub → Actions → Deploy to Oracle Cloud → Run workflow

# Option C: SSH and deploy manually
ssh ubuntu@YOUR_ORACLE_IP
cd ~/fairmediator.ai
./scripts/deploy-oracle.sh pull
```

**Verify deployment:**

```bash
# Check container status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check health
curl http://localhost:5001/health  # Backend
curl http://localhost:4010         # Frontend

# Check logs
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 📊 Monitoring & Troubleshooting

### Check Deployment Status

**GitHub Actions:**
- Repository → **Actions** → **Deploy to Oracle Cloud**
- View logs for each step
- Check for errors in red ❌ steps

**Oracle Instance:**
```bash
# SSH into instance
ssh ubuntu@YOUR_ORACLE_IP

# Check deployment script status
cd ~/fairmediator.ai
./scripts/deploy-oracle.sh status

# Expected output:
# ✓ Backend: Healthy (HTTP 200)
# ✓ Frontend: Healthy (HTTP 200)
```

---

### View Logs

```bash
# Real-time logs
./scripts/deploy-oracle.sh logs

# Or manually:
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

---

### Check Resource Usage

```bash
# Via monitoring endpoint
curl http://YOUR_ORACLE_IP:5001/api/monitoring/oracle-cloud | jq

# Via deployment script
./scripts/deploy-oracle.sh status

# Raw Docker stats
docker stats
```

---

## 🐛 Common Issues

### ❌ "Permission denied (publickey)"

**Problem:** GitHub Actions can't SSH into Oracle instance

**Solutions:**
1. Verify `ORACLE_SSH_KEY` secret contains correct private key
2. Check SSH key is added to Oracle instance:
   ```bash
   ssh ubuntu@YOUR_ORACLE_IP
   cat ~/.ssh/authorized_keys  # Should contain your public key
   ```
3. Test SSH locally first:
   ```bash
   ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_ORACLE_IP
   ```

---

### ❌ "Could not reach monitoring endpoint"

**Problem:** Oracle instance not reachable or backend not running

**Solutions:**
1. Check Oracle instance is running (Oracle Cloud Console)
2. Check firewall allows port 5001:
   ```bash
   sudo ufw status
   sudo ufw allow 5001/tcp
   ```
3. Check backend container is running:
   ```bash
   docker compose ps backend
   docker compose logs backend
   ```

---

### ❌ "Deployment blocked - resources at capacity"

**Problem:** Oracle Cloud free tier limits exceeded

**Solutions:**
1. Check resource usage:
   ```bash
   curl http://YOUR_ORACLE_IP:5001/api/monitoring/oracle-cloud
   ```
2. Clean up resources:
   ```bash
   ./scripts/deploy-oracle.sh cleanup
   docker system prune -a -f
   ```
3. Check `docker-compose.prod.yml` resource limits are within Oracle Free Tier

---

### ❌ "Error: no configuration file provided"

**Problem:** Docker Compose can't find configuration files

**Solution:**
```bash
# Ensure you're in the app directory
cd ~/fairmediator.ai

# Verify files exist
ls -la docker-compose*.yml

# Use full path if needed
docker compose -f $(pwd)/docker-compose.yml -f $(pwd)/docker-compose.prod.yml up -d
```

---

## 🎓 Learning Resources

### Understanding the CI/CD Pipeline

**Build Phase (docker-ci.yml):**
- Triggered on push to `main` branch
- Builds Docker images for backend and frontend
- Runs security scans with Trivy
- Pushes images to GitHub Container Registry (GHCR)
- Tagged with commit SHA and `latest`

**Deploy Phase (deploy-oracle.yml):**
- Triggered after successful build
- Checks Oracle Cloud resource limits via monitoring API
- SSHs into Oracle instance using secrets
- Pulls latest code from GitHub
- Pulls latest Docker images from GHCR
- Restarts containers with new images
- Runs health checks to verify deployment
- Cleans up old Docker resources

**Production Override (docker-compose.prod.yml):**
- Overrides `build` with pre-built `image` from GHCR
- Exposes ports publicly (not localhost-only)
- Sets `NODE_ENV=production`
- Removes development volume mounts

---

## 📚 Additional Documentation

- **`ORACLE_CLOUD_DEPLOYMENT.md`** - Complete Oracle Cloud setup guide
- **`GITHUB_SECRETS_SETUP.md`** - GitHub secrets configuration
- **`ORACLE_CLOUD_LIMITS.md`** - Resource limits and monitoring
- **`DOCKER_DEPLOYMENT_TIERS.md`** - Docker resource allocation strategy

---

## ✅ Success Indicators

Your deployment is successful when:

- ✅ GitHub Actions workflow completes without errors
- ✅ Backend health check returns HTTP 200: `curl http://YOUR_IP:5001/health`
- ✅ Frontend loads: `curl http://YOUR_IP:4010`
- ✅ Containers are running: `docker compose ps` shows "Up"
- ✅ Resource usage within limits: `curl http://YOUR_IP:5001/api/monitoring/oracle-cloud`

---

## 🚀 Next Steps After First Deployment

1. **Set up domain** (optional)
   - Point DNS A record to Oracle IP
   - Update `ORACLE_INSTANCE_URL` secret
   - Update `.env` on Oracle instance

2. **Enable SSL** (optional)
   - Install Nginx reverse proxy
   - Configure Let's Encrypt SSL
   - Follow `ORACLE_CLOUD_DEPLOYMENT.md` Step 6-7

3. **Monitor production**
   - Set up N8N webhook notifications
   - Configure Axiom logging
   - Review monitoring dashboard regularly

4. **Backup database**
   ```bash
   docker compose exec mongodb mongodump --out /data/backup
   ```

---

**Your FairMediator CI/CD pipeline is ready! 🎉**

Every push to `main` will automatically deploy to Oracle Cloud.
