#!/bin/bash
# FairMediator Docker Volume Restore Script
# Restores volumes from backup archives

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  FairMediator Volume Restore Script       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if backup path is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup_directory>${NC}"
    echo ""
    echo "Available backups:"
    ls -d backups/*/ 2>/dev/null | sed 's/^/  - /' || echo "  No backups found"
    exit 1
fi

BACKUP_PATH="$1"

# Verify backup directory exists
if [ ! -d "$BACKUP_PATH" ]; then
    echo -e "${RED}Error: Backup directory not found: $BACKUP_PATH${NC}"
    exit 1
fi

# Show manifest if it exists
if [ -f "$BACKUP_PATH/manifest.txt" ]; then
    echo "📋 Backup Manifest:"
    cat "$BACKUP_PATH/manifest.txt"
    echo ""
fi

# Warning
echo -e "${RED}⚠️  WARNING: This will overwrite existing volume data!${NC}"
echo -e "${YELLOW}Make sure to stop all containers using these volumes first.${NC}"
echo ""
read -p "Continue with restore? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Function to restore a volume
restore_volume() {
    local backup_file=$1
    local volume_name=$(basename "$backup_file" .tar.gz)

    echo -e "${YELLOW}📦 Restoring volume: $volume_name${NC}"

    # Create volume if it doesn't exist
    docker volume create "$volume_name" >/dev/null 2>&1 || true

    # Restore backup
    docker run --rm \
        -v "$volume_name":/target \
        -v "$BACKUP_PATH":/backup \
        alpine \
        sh -c "cd /target && tar xzf /backup/$(basename "$backup_file")"

    echo -e "${GREEN}   ✓ Restored $volume_name${NC}"
}

# Find all backup archives
echo ""
echo "🔍 Finding backup archives..."
BACKUPS=$(find "$BACKUP_PATH" -name "*.tar.gz")

if [ -z "$BACKUPS" ]; then
    echo -e "${RED}No backup archives found in: $BACKUP_PATH${NC}"
    exit 1
fi

echo "Found backups:"
echo "$BACKUPS" | sed 's/^/  - /'
echo ""

# Restore each volume
for backup in $BACKUPS; do
    restore_volume "$backup"
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Restore Complete!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "💡 Remember to start your containers:"
echo "   docker-compose up -d"
echo ""
