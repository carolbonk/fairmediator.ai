#!/bin/bash
# FairMediator Docker Volume Backup Script
# Backs up all FairMediator volumes to timestamped archives

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-fairmediator}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  FairMediator Volume Backup Script        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory
mkdir -p "$BACKUP_PATH"
echo -e "${YELLOW}📁 Backup directory: $BACKUP_PATH${NC}"
echo ""

# Function to backup a volume
backup_volume() {
    local volume_name=$1
    local backup_file="$BACKUP_PATH/${volume_name}.tar.gz"

    echo -e "${YELLOW}📦 Backing up volume: $volume_name${NC}"

    # Check if volume exists
    if ! docker volume inspect "$volume_name" >/dev/null 2>&1; then
        echo -e "${RED}   ⚠️  Volume $volume_name does not exist, skipping${NC}"
        return
    fi

    # Create backup using a temporary container
    docker run --rm \
        -v "$volume_name":/source:ro \
        -v "$BACKUP_PATH":/backup \
        alpine \
        tar czf "/backup/${volume_name}.tar.gz" -C /source .

    local size=$(du -h "$backup_file" | cut -f1)
    echo -e "${GREEN}   ✓ Backed up $volume_name ($size)${NC}"
}

# Backup all FairMediator volumes
echo "🔍 Finding FairMediator volumes..."
VOLUMES=$(docker volume ls --filter "name=${PROJECT_NAME}" --format "{{.Name}}")

if [ -z "$VOLUMES" ]; then
    echo -e "${RED}No volumes found for project: $PROJECT_NAME${NC}"
    exit 1
fi

echo "Found volumes:"
echo "$VOLUMES" | sed 's/^/  - /'
echo ""

# Backup each volume
for volume in $VOLUMES; do
    backup_volume "$volume"
done

# Also backup management volumes
echo ""
echo "🔍 Backing up management volumes..."
MGMT_VOLUMES=$(docker volume ls --filter "name=${PROJECT_NAME}_portainer\|${PROJECT_NAME}_prometheus\|${PROJECT_NAME}_grafana" --format "{{.Name}}")

for volume in $MGMT_VOLUMES; do
    backup_volume "$volume"
done

# Create backup manifest
echo ""
echo "📝 Creating backup manifest..."
cat > "$BACKUP_PATH/manifest.txt" <<EOF
FairMediator Volume Backup
Created: $(date)
Project: $PROJECT_NAME
Backup Directory: $BACKUP_PATH

Volumes Backed Up:
EOF

for volume in $VOLUMES $MGMT_VOLUMES; do
    if [ -f "$BACKUP_PATH/${volume}.tar.gz" ]; then
        size=$(du -h "$BACKUP_PATH/${volume}.tar.gz" | cut -f1)
        echo "  - $volume ($size)" >> "$BACKUP_PATH/manifest.txt"
    fi
done

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
echo "" >> "$BACKUP_PATH/manifest.txt"
echo "Total Backup Size: $TOTAL_SIZE" >> "$BACKUP_PATH/manifest.txt"

echo -e "${GREEN}✓ Manifest created${NC}"
echo ""

# Cleanup old backups (keep last 7 days)
echo "🧹 Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" -mtime +7 -exec rm -rf {} \;
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Summary
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Backup Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "📊 Summary:"
echo "  Location: $BACKUP_PATH"
echo "  Total Size: $TOTAL_SIZE"
echo "  Volumes: $(echo "$VOLUMES $MGMT_VOLUMES" | wc -w | xargs)"
echo ""
echo "💡 To restore a volume:"
echo "   docker run --rm -v VOLUME_NAME:/target -v \$(pwd)/$BACKUP_PATH:/backup alpine sh -c \"cd /target && tar xzf /backup/VOLUME_NAME.tar.gz\""
echo ""
