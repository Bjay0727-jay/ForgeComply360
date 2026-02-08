#!/bin/bash
# ============================================================================
# ForgeComply 360 - Automated Database Backup Script
# HIPAA 164.308(a)(7) — Contingency Plan / Data Backup
#
# Usage:
#   ./backup.sh                     # Manual backup
#   crontab: 0 2 * * * /path/to/backup.sh   # Daily at 2 AM
#
# Backs up the SQLite database and verifies integrity.
# Retention is controlled via BACKUP_RETENTION_DAYS (default: 2190 = 6 years).
# ============================================================================

set -euo pipefail

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a; source "$SCRIPT_DIR/.env"; set +a
fi

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
DATA_DIR="${DATA_DIR:-$SCRIPT_DIR/../data}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-2190}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/forgecomply360_${TIMESTAMP}.db"
CHECKSUM_FILE="$BACKUP_DIR/forgecomply360_${TIMESTAMP}.sha256"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[BACKUP] Starting ForgeComply 360 database backup..."
echo "[BACKUP] Timestamp: $TIMESTAMP"
echo "[BACKUP] Source: $DATA_DIR/forgecomply360.db"
echo "[BACKUP] Destination: $BACKUP_FILE"

# Verify source database exists
if [ ! -f "$DATA_DIR/forgecomply360.db" ]; then
  # Try Docker volume path
  DB_PATH=$(docker exec forgecomply-api ls /data/forgecomply360.db 2>/dev/null && echo "/data/forgecomply360.db" || echo "")
  if [ -z "$DB_PATH" ]; then
    echo "[BACKUP] ERROR: Database file not found. Checked: $DATA_DIR/forgecomply360.db"
    exit 1
  fi
  # Copy from Docker container
  echo "[BACKUP] Copying database from Docker container..."
  docker exec forgecomply-api sqlite3 /data/forgecomply360.db ".backup /tmp/backup.db"
  docker cp forgecomply-api:/tmp/backup.db "$BACKUP_FILE"
  docker exec forgecomply-api rm /tmp/backup.db
else
  # Use SQLite online backup (safe for concurrent access)
  sqlite3 "$DATA_DIR/forgecomply360.db" ".backup '$BACKUP_FILE'"
fi

# Verify backup integrity
echo "[BACKUP] Verifying backup integrity..."
INTEGRITY=$(sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" 2>&1)
if [ "$INTEGRITY" != "ok" ]; then
  echo "[BACKUP] ERROR: Backup integrity check FAILED: $INTEGRITY"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Record count verification
RECORD_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM audit_logs;" 2>/dev/null || echo "0")
echo "[BACKUP] Backup contains $RECORD_COUNT audit log records"

# Generate SHA-256 checksum
sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
echo "[BACKUP] Checksum: $(cat "$CHECKSUM_FILE")"

# Compress
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"
FINAL_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[BACKUP] Compressed size: $FINAL_SIZE"

# Prune old backups beyond retention period
echo "[BACKUP] Pruning backups older than $RETENTION_DAYS days..."
PRUNED=$(find "$BACKUP_DIR" -name "forgecomply360_*.gz" -mtime +$RETENTION_DAYS -print -delete | wc -l)
find "$BACKUP_DIR" -name "forgecomply360_*.sha256" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
echo "[BACKUP] Pruned $PRUNED old backup(s)"

echo "[BACKUP] Backup completed successfully: $BACKUP_FILE"
echo "[BACKUP] To restore: gunzip $BACKUP_FILE && sqlite3 /data/forgecomply360.db '.restore ${BACKUP_FILE%.gz}'"
