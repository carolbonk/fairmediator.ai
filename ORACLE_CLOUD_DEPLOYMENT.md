# Oracle Cloud Always Free Deployment Guide

## Overview

Deploy FairMediator to **Oracle Cloud Always Free Tier** (ARM Ampere A1: 4 cores, 24GB RAM) - **FREE FOREVER**.

**Total Cost:** $0/month perpetually

---

## Step 1: Create Oracle Cloud Account

1. Go to https://www.oracle.com/cloud/free/
2. Click **Start for free**
3. Fill out registration (email, country, phone verification)
4. Provide payment method (required but **not charged** for Always Free resources)
5. **Wait 24-48 hours** for account activation (Oracle's fraud prevention)

---

## Step 2: Create ARM Ampere A1 Compute Instance

### 2.1 Navigate to Compute Instances

1. Log in to Oracle Cloud Console
2. Click ☰ Menu → **Compute** → **Instances**
3. Click **Create Instance**

### 2.2 Configure Instance

**Name:** `fairmediator-prod`

**Image:**
- Click **Change Image**
- Select **Canonical Ubuntu 22.04 Minimal aarch64** (ARM)
- Click **Select Image**

**Shape:**
- Click **Change Shape**
- Select **Ampere** → **VM.Standard.A1.Flex**
- **OCPU count:** 4
- **Memory (GB):** 24
- Click **Select Shape**

**Networking:**
- **VCN:** Use default (or create new)
- **Subnet:** Public subnet (default)
- **Assign public IPv4 address:** ✅ YES

**SSH Keys:**
- **Generate SSH key pair** → Download private key (`ssh-key-*.key`)
- OR upload your own public key

**Boot Volume:**
- **Size:** 50-100 GB (up to 200GB free)

Click **Create**

**IMPORTANT:** If you get "Out of capacity" error, try different **Availability Domains** (AD-1, AD-2, AD-3) or retry later. ARM instances are in high demand.

---

## Step 3: Configure Firewall Rules (Security Lists)

### 3.1 Open Required Ports

1. Go to **Networking** → **Virtual Cloud Networks**
2. Click your VCN → **Security Lists** → **Default Security List**
3. Click **Add Ingress Rules**
4. Add these rules:

| Source CIDR | Protocol | Destination Port | Description |
|-------------|----------|------------------|-------------|
| 0.0.0.0/0   | TCP      | 80               | HTTP        |
| 0.0.0.0/0   | TCP      | 443              | HTTPS       |
| 0.0.0.0/0   | TCP      | 22               | SSH         |

Click **Add Ingress Rules**

### 3.2 Configure Ubuntu Firewall

SSH into your instance:
```bash
chmod 600 ssh-key-*.key
ssh -i ssh-key-*.key ubuntu@<PUBLIC_IP>
```

Configure firewall:
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Step 4: Install Docker & Docker Compose

### 4.1 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Start Docker on boot
sudo systemctl enable docker
sudo systemctl start docker

# Verify
docker --version
```

**Log out and log back in** for group changes to take effect:
```bash
exit
ssh -i ssh-key-*.key ubuntu@<PUBLIC_IP>
```

### 4.2 Install Docker Compose

```bash
sudo apt install docker-compose-plugin -y
docker compose version
```

---

## Step 5: Deploy FairMediator

### 5.1 Clone Repository

```bash
cd ~
git clone https://github.com/carolbonk/fairmediator.ai.git
cd fairmediator.ai
git checkout main  # or feature/docker-ci
```

### 5.2 Configure Environment Variables

```bash
# Create .env file
cp .env.example .env  # or copy from local
nano .env
```

**Required variables:**
```bash
# MongoDB
MONGODB_USER=admin
MONGODB_PASSWORD=<GENERATE_STRONG_PASSWORD>

# Secrets
JWT_SECRET=<YOUR_JWT_SECRET>
SESSION_SECRET=<YOUR_SESSION_SECRET>
CSRF_SECRET=<YOUR_CSRF_SECRET>

# API Keys
HUGGINGFACE_API_KEY=<YOUR_KEY>
RESEND_API_KEY=<YOUR_KEY>

# Production settings
NODE_ENV=production
CORS_ORIGIN=http://<YOUR_PUBLIC_IP>:4010
VITE_API_URL=http://<YOUR_PUBLIC_IP>:5001
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### 5.3 Start Services

```bash
# Build and start (first time)
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# Check health
curl http://localhost:5001/health
curl http://localhost:4010
```

**Expected output:**
```
NAME                    STATUS   PORTS
fairmediator-backend    Up       0.0.0.0:5001->5001/tcp
fairmediator-frontend   Up       0.0.0.0:4010->8080/tcp
fairmediator-mongodb    Up       27017/tcp
```

---

## Step 6: Set Up Nginx Reverse Proxy (Optional but Recommended)

### 6.1 Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 6.2 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/fairmediator
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name <YOUR_DOMAIN_OR_IP>;

    # Frontend
    location / {
        proxy_pass http://localhost:4010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fairmediator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Update `.env`:
```bash
CORS_ORIGIN=http://<YOUR_DOMAIN_OR_IP>
VITE_API_URL=http://<YOUR_DOMAIN_OR_IP>/api
```

Restart containers:
```bash
docker compose down
docker compose up -d
```

---

## Step 7: Set Up SSL with Let's Encrypt (Optional)

**Requires a domain name pointing to your IP**

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

Update `.env` to use `https://`:
```bash
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

---

## Step 8: Set Up Auto-Start on Boot

```bash
# Enable Docker service
sudo systemctl enable docker

# Docker Compose auto-start (systemd service)
sudo nano /etc/systemd/system/fairmediator.service
```

Paste this:
```ini
[Unit]
Description=FairMediator Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=/home/ubuntu/fairmediator.ai
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable fairmediator.service
sudo systemctl start fairmediator.service
sudo systemctl status fairmediator.service
```

---

## Step 9: Monitoring & Maintenance

### 9.1 View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# Last 100 lines
docker compose logs --tail=100 backend
```

### 9.2 Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### 9.3 Update Application

```bash
cd ~/fairmediator.ai
git pull origin main
docker compose down
docker compose up -d --build
```

### 9.4 Backup MongoDB

```bash
# Create backup
docker compose exec mongodb mongodump --out /data/backup

# Copy to host
docker cp fairmediator-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)

# Restore from backup
docker compose exec -T mongodb mongorestore /data/backup
```

### 9.5 Monitor Resources

```bash
# System resources
htop
df -h
free -h

# Docker stats
docker stats

# Disk usage
docker system df
```

---

## Troubleshooting

### Issue: "Out of capacity" when creating ARM instance

**Solution:** Try different Availability Domains or retry at different times (late night/early morning UTC).

### Issue: Can't connect to public IP

1. Check Security List ingress rules (Step 3.1)
2. Check Ubuntu firewall: `sudo ufw status`
3. Check container status: `docker compose ps`
4. Check logs: `docker compose logs`

### Issue: Backend can't connect to MongoDB

1. Check MongoDB is running: `docker compose ps mongodb`
2. Check MongoDB logs: `docker compose logs mongodb`
3. Verify MONGODB_URI in `.env` matches docker-compose.yml

### Issue: Frontend shows "API Error"

1. Check VITE_API_URL in `.env`
2. Check CORS_ORIGIN in `.env`
3. Check backend logs: `docker compose logs backend`

---

## Cost Breakdown

**Oracle Cloud Always Free:**
- ✅ ARM Ampere A1: 4 OCPUs + 24GB RAM = **$0/month**
- ✅ 200GB Block Storage = **$0/month**
- ✅ 10TB Outbound Transfer = **$0/month**
- ✅ Load Balancer (1 instance, 10 Mbps) = **$0/month**
- ✅ Object Storage (10GB) = **$0/month**

**Total: $0/month FOREVER**

---

## Next Steps

1. Point your domain to the public IP
2. Set up SSL with Let's Encrypt
3. Configure monitoring (Oracle Cloud Monitoring is free)
4. Set up automated backups
5. Configure CI/CD with GitHub Actions to auto-deploy on push

**Your FairMediator instance is now live!** 🚀
