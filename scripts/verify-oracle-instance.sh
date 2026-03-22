#!/bin/bash

# ==============================================================================
# Oracle Cloud Instance Verification Script
# ==============================================================================
# Checks if your Oracle Cloud instance is properly configured for deployment
#
# Usage:
#   ./scripts/verify-oracle-instance.sh <ORACLE_IP> <SSH_KEY_PATH>
#
# Example:
#   ./scripts/verify-oracle-instance.sh 123.45.67.89 ~/Downloads/ssh-key-*.key
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Oracle Cloud Instance Verification                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check arguments
if [ $# -lt 2 ]; then
  echo -e "${RED}❌ Missing arguments${NC}"
  echo ""
  echo "Usage: $0 <ORACLE_IP> <SSH_KEY_PATH>"
  echo ""
  echo "Example:"
  echo "  $0 123.45.67.89 ~/Downloads/ssh-key-2024-03-20.key"
  echo ""
  exit 1
fi

ORACLE_IP=$1
SSH_KEY=$2
ORACLE_USER=${3:-ubuntu}

# Expand tilde in SSH key path
SSH_KEY="${SSH_KEY/#\~/$HOME}"

echo -e "${BLUE}Configuration:${NC}"
echo "  Oracle IP:   $ORACLE_IP"
echo "  SSH Key:     $SSH_KEY"
echo "  SSH User:    $ORACLE_USER"
echo ""

# Check SSH key exists
echo -e "${BLUE}[1/8] Checking SSH key...${NC}"
if [ ! -f "$SSH_KEY" ]; then
  echo -e "${RED}✗ SSH key not found: $SSH_KEY${NC}"
  echo ""
  echo "Available keys in ~/Downloads:"
  ls -la ~/Downloads/ssh-key-* 2>/dev/null || echo "  No ssh-key-* files found"
  echo ""
  echo "Available keys in ~/.ssh:"
  ls -la ~/.ssh/id_* 2>/dev/null || echo "  No id_* files found"
  exit 1
fi
echo -e "${GREEN}✓${NC} SSH key found"

# Check SSH key permissions
echo -e "${BLUE}[2/8] Checking SSH key permissions...${NC}"
PERMS=$(stat -f "%OLp" "$SSH_KEY" 2>/dev/null || stat -c "%a" "$SSH_KEY" 2>/dev/null)
if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
  echo -e "${YELLOW}⚠${NC} SSH key has permissions $PERMS (should be 600)"
  echo "  Fixing permissions..."
  chmod 600 "$SSH_KEY"
  echo -e "${GREEN}✓${NC} Permissions fixed to 600"
else
  echo -e "${GREEN}✓${NC} SSH key permissions OK ($PERMS)"
fi

# Test SSH connection
echo -e "${BLUE}[3/8] Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${ORACLE_USER}@${ORACLE_IP} "echo 'SSH connection successful'" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} SSH connection successful"
else
  echo -e "${RED}✗ SSH connection failed${NC}"
  echo ""
  echo "Troubleshooting steps:"
  echo "  1. Check Oracle Cloud instance is running (Oracle Console → Compute → Instances)"
  echo "  2. Verify Security List allows SSH port 22 (Oracle Console → Networking → Security Lists)"
  echo "  3. Verify firewall on instance: ssh ... 'sudo ufw status'"
  echo "  4. Check SSH key matches authorized_keys: ssh ... 'cat ~/.ssh/authorized_keys'"
  exit 1
fi

# Check Docker installed
echo -e "${BLUE}[4/8] Checking Docker installation...${NC}"
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${ORACLE_USER}@${ORACLE_IP} "docker --version" &>/dev/null; then
  VERSION=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${ORACLE_USER}@${ORACLE_IP} "docker --version")
  echo -e "${GREEN}✓${NC} Docker installed: $VERSION"
else
  echo -e "${RED}✗ Docker not installed${NC}"
  echo ""
  echo "To install Docker on Oracle instance:"
  echo "  ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP}"
  echo "  curl -fsSL https://get.docker.com | sudo sh"
  echo "  sudo usermod -aG docker ${ORACLE_USER}"
  echo "  exit  # Log out and back in"
  exit 1
fi

# Check Docker Compose installed
echo -e "${BLUE}[5/8] Checking Docker Compose installation...${NC}"
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${ORACLE_USER}@${ORACLE_IP} "docker compose version" &>/dev/null; then
  VERSION=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${ORACLE_USER}@${ORACLE_IP} "docker compose version")
  echo -e "${GREEN}✓${NC} Docker Compose installed: $VERSION"
else
  echo -e "${RED}✗ Docker Compose not installed${NC}"
  echo ""
  echo "To install Docker Compose:"
  echo "  ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP}"
  echo "  sudo apt install docker-compose-plugin -y"
  exit 1
fi

# Check repository cloned
echo -e "${BLUE}[6/8] Checking if repository is cloned...${NC}"
REPO_PATH=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${ORACLE_USER}@${ORACLE_IP} "
  if [ -d ~/fairmediator.ai ]; then
    echo ~/fairmediator.ai
  elif [ -d ~/FairMediator ]; then
    echo ~/FairMediator
  else
    echo ''
  fi
")

if [ -n "$REPO_PATH" ]; then
  echo -e "${GREEN}✓${NC} Repository found at: $REPO_PATH"
else
  echo -e "${YELLOW}⚠${NC} Repository not cloned yet"
  echo ""
  echo "To clone repository:"
  echo "  ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP}"
  echo "  git clone https://github.com/YOUR_USERNAME/FairMediator.git fairmediator.ai"
  echo ""
fi

# Check .env file exists
echo -e "${BLUE}[7/8] Checking .env file...${NC}"
if [ -n "$REPO_PATH" ]; then
  if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${ORACLE_USER}@${ORACLE_IP} "[ -f $REPO_PATH/.env ]"; then
    echo -e "${GREEN}✓${NC} .env file exists"
  else
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo ""
    echo "To create .env file:"
    echo "  ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP}"
    echo "  cd $REPO_PATH"
    echo "  cp .env.example .env"
    echo "  nano .env  # Edit with production values"
  fi
fi

# Check firewall ports
echo -e "${BLUE}[8/8] Checking firewall configuration...${NC}"
UFW_STATUS=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${ORACLE_USER}@${ORACLE_IP} "sudo ufw status" 2>/dev/null || echo "inactive")

if echo "$UFW_STATUS" | grep -q "Status: active"; then
  echo -e "${GREEN}✓${NC} UFW firewall is active"

  # Check required ports
  REQUIRED_PORTS=("22" "80" "443" "4010" "5001")
  for PORT in "${REQUIRED_PORTS[@]}"; do
    if echo "$UFW_STATUS" | grep -q "^$PORT/"; then
      echo -e "${GREEN}  ✓${NC} Port $PORT is open"
    else
      echo -e "${YELLOW}  ⚠${NC} Port $PORT not explicitly allowed"
    fi
  done
else
  echo -e "${YELLOW}⚠${NC} UFW firewall is not active"
  echo ""
  echo "To configure firewall:"
  echo "  ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP}"
  echo "  sudo ufw allow 22/tcp    # SSH"
  echo "  sudo ufw allow 80/tcp    # HTTP"
  echo "  sudo ufw allow 443/tcp   # HTTPS"
  echo "  sudo ufw allow 4010/tcp  # Frontend"
  echo "  sudo ufw allow 5001/tcp  # Backend API"
  echo "  sudo ufw enable"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Verification Complete!                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  Oracle IP:       $ORACLE_IP"
echo "  SSH Access:      ✓ Working"
echo "  Docker:          ✓ Installed"
echo "  Repository:      ${REPO_PATH:-Not cloned yet}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Add GitHub secrets (see GITHUB_SECRETS_SETUP.md):"
echo "     - ORACLE_SSH_KEY"
echo "     - ORACLE_HOST=$ORACLE_IP"
echo "     - ORACLE_USER=$ORACLE_USER"
echo "     - ORACLE_INSTANCE_URL=http://$ORACLE_IP"
echo ""
echo "  2. Test deployment:"
echo "     ssh -i $SSH_KEY ${ORACLE_USER}@${ORACLE_IP}"
echo "     cd $REPO_PATH"
echo "     ./scripts/deploy-oracle.sh pull"
echo ""
echo -e "${GREEN}✓ Your Oracle Cloud instance is ready for deployment!${NC}"
