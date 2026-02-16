#!/bin/bash
# ============================================================================
# ForgeComply 360 - Restore Script
# Restores D1 database from a backup archive
# ============================================================================

set -e

# Configuration
BACKUP_DIR="./backups"
DB_NAME="forge-comply360-db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for backup file argument
if [ -z "$1" ]; then
    echo -e "${RED}Usage: ./scripts/restore.sh <backup_file.tar.gz>${NC}"
    echo ""
    echo "Available backups:"
    ls -la ${BACKUP_DIR}/*.tar.gz 2>/dev/null || echo "  No backups found in ${BACKUP_DIR}"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ForgeComply 360 - Restore${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
echo ""

# Confirm restore
echo -e "${RED}WARNING: This will overwrite existing data in the database!${NC}"
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo ""
echo -e "${YELLOW}Extracting backup to ${TEMP_DIR}...${NC}"
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

# Find the backup directory inside
BACKUP_NAME=$(ls "${TEMP_DIR}")
BACKUP_PATH="${TEMP_DIR}/${BACKUP_NAME}"

# Read manifest
echo ""
echo -e "${YELLOW}Reading backup manifest...${NC}"
cat "${BACKUP_PATH}/manifest.json" | jq .

# Get list of tables from backup
TABLES=$(ls "${BACKUP_PATH}"/db_*.json 2>/dev/null | xargs -I {} basename {} | sed 's/db_//g' | sed 's/.json//g')

# Restore each table
echo ""
echo -e "${YELLOW}Restoring database tables...${NC}"

for table in $TABLES; do
    BACKUP_JSON="${BACKUP_PATH}/db_${table}.json"

    if [ -f "${BACKUP_JSON}" ]; then
        # Check if table has data
        ROW_COUNT=$(cat "${BACKUP_JSON}" | jq '.[0].results | length')

        if [ "$ROW_COUNT" -gt 0 ]; then
            echo "  Restoring table: ${table} (${ROW_COUNT} rows)"

            # Clear existing data (optional - uncomment if you want to clear before restore)
            # npx wrangler d1 execute ${DB_NAME} --remote --command "DELETE FROM ${table};" 2>/dev/null || true

            # Generate INSERT statements from JSON
            # Note: For large datasets, you may need to batch these
            cat "${BACKUP_JSON}" | jq -r ".[0].results[] | \"INSERT OR REPLACE INTO ${table} VALUES ('\" + (to_entries | map(.value | @json) | join(\"', '\")) + \"');\"" > "${TEMP_DIR}/restore_${table}.sql" 2>/dev/null || true

            # Execute restore
            while IFS= read -r line; do
                npx wrangler d1 execute ${DB_NAME} --remote --command "${line}" 2>/dev/null || true
            done < "${TEMP_DIR}/restore_${table}.sql"
        else
            echo "  Skipping empty table: ${table}"
        fi
    fi
done

# Cleanup
echo ""
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -rf "${TEMP_DIR}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Restore Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Note: R2 evidence files are not automatically restored.${NC}"
echo -e "${YELLOW}Use 'wrangler r2 object put' to restore individual files if needed.${NC}"
echo ""
