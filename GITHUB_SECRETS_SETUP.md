# GitHub Secrets Setup for Oracle Cloud Deployment

This guide explains how to configure GitHub repository secrets for automated deployment to Oracle Cloud.

---

## Required Secrets

Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. Oracle Cloud SSH Access

#### `ORACLE_SSH_KEY`
**Description:** Private SSH key for accessing your Oracle Cloud instance

**How to get it:**
```bash
# If you generated SSH keys during Oracle instance creation:
cat ~/Downloads/ssh-key-*.key

# OR if you're using an existing key:
cat ~/.ssh/id_rsa

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

**GitHub Setup:**
- Name: `ORACLE_SSH_KEY`
- Value: Paste the entire private key (including header/footer)

---

#### `ORACLE_HOST`
**Description:** Public IP address or domain of your Oracle Cloud instance

**How to get it:**
1. Log into Oracle Cloud Console
2. Go to **Compute** → **Instances**
3. Click your instance name
4. Copy the **Public IP Address**

**GitHub Setup:**
- Name: `ORACLE_HOST`
- Value: `123.45.67.89` (your Oracle instance IP) OR `fairmediator.com` (if using domain)

---

#### `ORACLE_USER`
**Description:** SSH username for Oracle instance (usually `ubuntu` or `opc`)

**Default values:**
- Ubuntu images: `ubuntu`
- Oracle Linux images: `opc`

**GitHub Setup:**
- Name: `ORACLE_USER`
- Value: `ubuntu`

---

### 2. Application URLs

#### `ORACLE_INSTANCE_URL`
**Description:** Full URL to your deployed application (for health checks and monitoring)

**Format:**
- Without domain: `http://123.45.67.89` (use your Oracle IP)
- With domain: `https://fairmediator.com`
- With custom port: `http://123.45.67.89:4010`

**GitHub Setup:**
- Name: `ORACLE_INSTANCE_URL`
- Value: `http://YOUR_ORACLE_IP` or `https://yourdomain.com`

---

### 3. Optional: Automation Webhooks

#### `N8N_WEBHOOK_URL` (Optional)
**Description:** Webhook URL for N8N automation notifications

**How to get it:**
1. In N8N, create a Webhook node
2. Copy the Production URL

**GitHub Setup:**
- Name: `N8N_WEBHOOK_URL`
- Value: `https://your-n8n-instance.com/webhook/...`

---

#### `BACKEND_URL` (Optional)
**Description:** Backend API URL for triggering automation endpoints

**GitHub Setup:**
- Name: `BACKEND_URL`
- Value: `https://api.fairmediator.com` (same as ORACLE_INSTANCE_URL usually)

---

#### `API_TOKEN` (Optional)
**Description:** API token for backend automation endpoint authentication

**How to generate:**
```bash
# On your Oracle instance, create an API key via admin panel
# OR generate a JWT token for automation user
```

**GitHub Setup:**
- Name: `API_TOKEN`
- Value: Your API token/JWT

---

## Summary of Required Secrets

| Secret Name | Required | Example Value |
|-------------|----------|---------------|
| `ORACLE_SSH_KEY` | ✅ Yes | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `ORACLE_HOST` | ✅ Yes | `123.45.67.89` or `fairmediator.com` |
| `ORACLE_USER` | ✅ Yes | `ubuntu` |
| `ORACLE_INSTANCE_URL` | ✅ Yes | `http://123.45.67.89` |
| `N8N_WEBHOOK_URL` | ❌ Optional | `https://n8n.example.com/webhook/abc123` |
| `BACKEND_URL` | ❌ Optional | `https://api.fairmediator.com` |
| `API_TOKEN` | ❌ Optional | `eyJhbGciOiJIUzI1NiIs...` |

---

## Step-by-Step Setup Instructions

### Step 1: Get Oracle Cloud SSH Key

**If you saved the key during instance creation:**
```bash
# Find the downloaded key
ls ~/Downloads/ssh-key-*.key

# View the contents
cat ~/Downloads/ssh-key-2024-*.key
```

**If you need to create a new key pair:**
```bash
# Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_fairmediator -C "GitHub Actions Deploy Key"

# View the private key (for GitHub secret)
cat ~/.ssh/oracle_fairmediator

# View the public key (to add to Oracle instance)
cat ~/.ssh/oracle_fairmediator.pub
```

**Add public key to Oracle instance:**
```bash
# SSH into Oracle instance with existing key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_ORACLE_IP

# Add the new public key
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Exit
exit
```

---

### Step 2: Get Oracle Instance IP

**Via Oracle Cloud Console:**
1. Login to https://cloud.oracle.com
2. Click ☰ → **Compute** → **Instances**
3. Click your instance name
4. Copy **Public IP Address** (under "Primary VNIC")

**Via SSH (if already connected):**
```bash
# Get public IP from inside Oracle instance
curl -s ifconfig.me
```

---

### Step 3: Add Secrets to GitHub

1. Go to your repository: https://github.com/YOUR_USERNAME/YOUR_REPO
2. Click **Settings** (top menu)
3. Click **Secrets and variables** (left sidebar) → **Actions**
4. Click **New repository secret**
5. Add each secret:

**Example for ORACLE_SSH_KEY:**
```
Name: ORACLE_SSH_KEY
Secret: -----BEGIN OPENSSH PRIVATE KEY-----
        b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
        ... (full private key content)
        -----END OPENSSH PRIVATE KEY-----
```

**Example for ORACLE_HOST:**
```
Name: ORACLE_HOST
Secret: 123.45.67.89
```

**Example for ORACLE_USER:**
```
Name: ORACLE_USER
Secret: ubuntu
```

**Example for ORACLE_INSTANCE_URL:**
```
Name: ORACLE_INSTANCE_URL
Secret: http://123.45.67.89
```

---

### Step 4: Verify Secrets

After adding all secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   - ✅ `ORACLE_SSH_KEY`
   - ✅ `ORACLE_HOST`
   - ✅ `ORACLE_USER`
   - ✅ `ORACLE_INSTANCE_URL`
3. Secrets will show as `***` (hidden for security)

---

## Testing Your Setup

### Test SSH Connection Locally

Before deploying, verify SSH works:

```bash
# Test SSH connection
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_ORACLE_IP

# If successful, you should see:
# Welcome to Ubuntu 22.04 ...
# ubuntu@fairmediator-prod:~$

# Exit
exit
```

### Test Deployment Workflow

**Trigger manual deployment:**

1. Go to **Actions** tab in GitHub
2. Click **Deploy to Oracle Cloud**
3. Click **Run workflow** → **Run workflow**
4. Watch the deployment logs

**Or push to main branch:**
```bash
git add .
git commit -m "Test Oracle Cloud deployment"
git push origin main
```

The deployment will:
1. ✅ Check Oracle Cloud resource limits
2. ✅ Verify Docker images exist
3. ✅ SSH into Oracle instance
4. ✅ Pull latest code from GitHub
5. ✅ Pull latest Docker images
6. ✅ Restart containers with new images
7. ✅ Run health checks
8. ✅ Clean up old resources

---

## Troubleshooting

### Error: "Permission denied (publickey)"

**Problem:** SSH key not accepted by Oracle instance

**Solutions:**
1. Verify the private key in `ORACLE_SSH_KEY` matches public key on Oracle instance
2. Check file permissions:
   ```bash
   ssh ubuntu@YOUR_ORACLE_IP
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```
3. Verify key format (should start with `-----BEGIN OPENSSH PRIVATE KEY-----`)

---

### Error: "Host key verification failed"

**Problem:** GitHub Actions doesn't trust Oracle instance

**Solution:**
The workflow automatically handles this with `ssh-keyscan`, but you can verify manually:
```bash
ssh-keyscan -H YOUR_ORACLE_IP
```

---

### Error: "Could not reach monitoring endpoint"

**Problem:** Oracle instance not reachable or backend not running

**Solutions:**
1. Check Oracle instance is running:
   - Oracle Cloud Console → Compute → Instances → Status should be "Running"
2. Check backend is running:
   ```bash
   ssh ubuntu@YOUR_ORACLE_IP
   docker compose ps
   docker compose logs backend
   ```
3. Check firewall allows port 5001:
   ```bash
   sudo ufw status
   curl http://localhost:5001/health
   ```

---

### Error: "Deployment failed - resources at capacity"

**Problem:** Oracle Cloud free tier limits exceeded

**Solutions:**
1. Check resource usage:
   ```bash
   # SSH into Oracle instance
   ssh ubuntu@YOUR_ORACLE_IP

   # Check CPU/RAM usage
   htop

   # Check disk usage
   df -h
   ```
2. Clean up resources:
   ```bash
   docker system prune -a -f
   docker volume prune -f
   ```
3. View monitoring dashboard:
   - Visit: `http://YOUR_ORACLE_IP:5001/api/monitoring/oracle-cloud`

---

## Security Best Practices

### Rotate SSH Keys Regularly

**Every 90 days:**
1. Generate new SSH key pair
2. Add public key to Oracle instance
3. Update `ORACLE_SSH_KEY` in GitHub secrets
4. Remove old key from Oracle instance

### Use Environment-Specific Keys

For production vs staging:
- Create separate SSH keys
- Use GitHub Environments for different deployments
- Restrict environment access to specific branches

### Audit Secret Access

Regularly review:
- **Settings** → **Secrets and variables** → **Actions**
- Check who has access to repository settings
- Use branch protection rules to prevent unauthorized deployments

---

## Next Steps

After setting up secrets:

1. ✅ **Test deployment:** Push to main or manually trigger workflow
2. ✅ **Monitor logs:** Check Actions tab for deployment progress
3. ✅ **Verify health:** Visit `http://YOUR_ORACLE_IP` to see your app
4. ✅ **Set up domain:** Point DNS to Oracle IP (optional)
5. ✅ **Enable SSL:** Use Let's Encrypt with Nginx (optional)

---

## Quick Reference

```bash
# Get Oracle IP
# Oracle Cloud Console → Compute → Instances → Public IP

# Get SSH key
cat ~/Downloads/ssh-key-*.key

# Test SSH
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_ORACLE_IP

# Test backend health
curl http://YOUR_ORACLE_IP:5001/health

# Test frontend
curl http://YOUR_ORACLE_IP:4010

# Check deployment logs (GitHub)
# Repository → Actions → Deploy to Oracle Cloud
```

**Your Oracle Cloud deployment is ready! 🚀**
