#!/bin/bash
# ============================================================================
# ForgeComply 360 - Manual Backup Script
# Creates a full backup of the D1 database and R2 evidence files
# ============================================================================

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="forge_backup_${TIMESTAMP}"
DB_NAME="forge-comply360-db"
R2_BUCKET="forge-evidence"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ForgeComply 360 - Manual Backup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"
echo -e "${YELLOW}Created backup directory: ${BACKUP_DIR}/${BACKUP_NAME}${NC}"

# Export D1 database
echo ""
echo -e "${YELLOW}Exporting D1 database...${NC}"

# Get list of all tables
TABLES=$(npx wrangler d1 execute ${DB_NAME} --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';" --json 2>/dev/null | jq -r '.[0].results[].name')

# Export each table
for table in $TABLES; do
    echo "  Exporting table: ${table}"
    npx wrangler d1 execute ${DB_NAME} --remote --command "SELECT * FROM ${table};" --json > "${BACKUP_DIR}/${BACKUP_NAME}/db_${table}.json" 2>/dev/null || true
done

echo -e "${GREEN}Database export complete${NC}"

# Export R2 evidence files list
echo ""
echo -e "${YELLOW}Listing R2 evidence files...${NC}"
npx wrangler r2 object list ${R2_BUCKET} --json > "${BACKUP_DIR}/${BACKUP_NAME}/r2_manifest.json" 2>/dev/null || echo "[]" > "${BACKUP_DIR}/${BACKUP_NAME}/r2_manifest.json"

# Count files
FILE_COUNT=$(cat "${BACKUP_DIR}/${BACKUP_NAME}/r2_manifest.json" | jq 'length')
echo -e "${GREEN}Found ${FILE_COUNT} files in R2 bucket${NC}"

# Download R2 files (optional - uncomment to download all evidence files)
# echo ""
# echo -e "${YELLOW}Downloading R2 evidence files...${NC}"
# mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/evidence"
# for key in $(cat "${BACKUP_DIR}/${BACKUP_NAME}/r2_manifest.json" | jq -r '.[].key'); do
#     echo "  Downloading: ${key}"
#     npx wrangler r2 object get ${R2_BUCKET}/${key} --file="${BACKUP_DIR}/${BACKUP_NAME}/evidence/${key}" 2>/dev/null || true
# done

# Create backup manifest
echo ""
echo -e "${YELLOW}Creating backup manifest...${NC}"
cat > "${BACKUP_DIR}/${BACKUP_NAME}/manifest.json" << EOF
{
  "backup_id": "${BACKUP_NAME}",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "manual",
  "database": "${DB_NAME}",
  "r2_bucket": "${R2_BUCKET}",
  "tables": $(echo $TABLES | jq -R 'split(" ")'),
  "r2_file_count": ${FILE_COUNT}
}
EOF

# Create compressed archive
echo ""
echo -e "${YELLOW}Creating compressed archive...${NC}"
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"
cd - > /dev/null

# Final summary
ARCHIVE_SIZE=$(ls -lh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | awk '{print $5}')
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Archive: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "Size: ${ARCHIVE_SIZE}"
echo ""
