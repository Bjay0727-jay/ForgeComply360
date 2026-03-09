#!/usr/bin/env bash
# ============================================================================
# ForgeComply 360 — Migration Column Validator
#
# Cross-references INSERT column lists against CREATE TABLE definitions
# to catch column name mismatches before deployment.
#
# Called from: scripts/pre-deploy-check.sh
# Exit code: 0 = pass, 1 = failures found
# ============================================================================

set -euo pipefail

SCHEMA_FILE="database/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "  FAIL  Schema file not found: $SCHEMA_FILE"
  exit 1
fi

TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

# ── Step 1: Extract table->columns from all SQL files ──

# Multi-line CREATE TABLE: extract via sed
sed -n '
  /CREATE TABLE/I {
    s/.*CREATE TABLE[[:space:]]*\(IF NOT EXISTS[[:space:]]*\)\{0,1\}\([a-zA-Z_][a-zA-Z0-9_]*\).*/TABLE:\2/Ip
  }
  /^[[:space:]]*)[[:space:]]*;/ {
    s/.*/ENDTABLE/p
  }
  /^[[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]\+\(TEXT\|INTEGER\|REAL\|BLOB\|NUMERIC\|DEFAULT\)/ {
    s/^[[:space:]]*\([a-zA-Z_][a-zA-Z0-9_]*\)[[:space:]].*/COL:\1/p
  }
' "$SCHEMA_FILE" database/migrate-*.sql 2>/dev/null > "$TMPDIR_WORK/parsed.txt"

current_table=""
while IFS= read -r line; do
  case "$line" in
    TABLE:*) current_table="${line#TABLE:}" ;;
    ENDTABLE) current_table="" ;;
    COL:*)
      [ -n "$current_table" ] && echo "${line#COL:}" >> "$TMPDIR_WORK/$current_table.cols"
      ;;
  esac
done < "$TMPDIR_WORK/parsed.txt"

# Single-line CREATE TABLE ... (...);
grep -ihE 'CREATE TABLE.*\(.*\);' "$SCHEMA_FILE" database/migrate-*.sql 2>/dev/null | while IFS= read -r line; do
  tbl=$(echo "$line" | sed -E 's/.*CREATE TABLE (IF NOT EXISTS )?([a-zA-Z_]+).*/\2/i')
  [ -n "$tbl" ] && [ "$tbl" != "$line" ] || continue
  cols=$(echo "$line" | sed -E 's/[^(]*\((.+)\).*/\1/')
  IFS=',' read -ra segs <<< "$cols"
  for seg in "${segs[@]}"; do
    seg="${seg#"${seg%%[![:space:]]*}"}"
    case "$seg" in FOREIGN*|PRIMARY*|UNIQUE*|CHECK*|foreign*|primary*|unique*|check*) continue ;; esac
    col="${seg%% *}"
    case "$col" in [a-zA-Z_]*) echo "$col" >> "$TMPDIR_WORK/$tbl.cols" ;; esac
  done
done

# Deduplicate
find "$TMPDIR_WORK" -name '*.cols' -exec sh -c 'sort -u "$1" -o "$1"' _ {} \;

# ── Step 2: Validate INSERT columns ──
# Extract unique "table|col1,col2,..." patterns, then validate each once

# Pre-process: extract table and column list from all INSERT statements
# Output: "filename|table|col1,col2,..."
for migration_file in database/migrate-*.sql; do
  [ -f "$migration_file" ] || continue
  basename_f=$(basename "$migration_file")
  grep -oiE 'INTO[[:space:]]+[a-zA-Z_]+[[:space:]]*\([^)]+\)' "$migration_file" 2>/dev/null | \
    sort -u | \
    sed -E "s/INTO[[:space:]]+([a-zA-Z_]+)[[:space:]]*\(([^)]+)\)/${basename_f}|\1|\2/i"
done > "$TMPDIR_WORK/all_inserts.txt" 2>/dev/null || true

# Load all column files into a lookup string per table (avoids fork per check)
declare -A SCHEMA_COLS
for col_file in "$TMPDIR_WORK"/*.cols; do
  [ -f "$col_file" ] || continue
  tname=$(basename "$col_file" .cols)
  SCHEMA_COLS["$tname"]=" $(tr '\n' ' ' < "$col_file") "
done

# Now validate: for each unique pattern, check columns
FAIL=0
while IFS='|' read -r src_file table cols_str; do
  schema_str="${SCHEMA_COLS[$table]:-}"
  [ -n "$schema_str" ] || continue

  IFS=',' read -ra icols <<< "$cols_str"
  for c in "${icols[@]}"; do
    # Trim whitespace using parameter expansion (no fork)
    c="${c#"${c%%[![:space:]]*}"}"
    c="${c%"${c##*[![:space:]]}"}"
    [ -n "$c" ] || continue
    if [[ "$schema_str" != *" $c "* ]]; then
      echo "  FAIL  $src_file — Column '$c' not in table '$table'"
      FAIL=1
    fi
  done
done < "$TMPDIR_WORK/all_inserts.txt"

if [ "$FAIL" -eq 0 ]; then
  echo "  PASS  All INSERT column names match schema definitions"
fi

exit "$FAIL"
