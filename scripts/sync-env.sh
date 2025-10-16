#!/bin/bash

# Sync Environment Variables Script
# Syncs root .env to app .env.local files for Next.js compatibility

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT_ENV="$ROOT_DIR/.env"

echo "🔄 Syncing environment variables from root .env..."

if [ ! -f "$ROOT_ENV" ]; then
  echo "❌ Error: Root .env file not found at $ROOT_ENV"
  exit 1
fi

# Function to sync env to an app
sync_env_to_app() {
  local app_name=$1
  local app_dir="$ROOT_DIR/apps/$app_name"
  local app_env="$app_dir/.env.local"

  if [ ! -d "$app_dir" ]; then
    echo "⚠️  Warning: App directory not found: $app_dir"
    return
  fi

  echo "  → Syncing to apps/$app_name/.env.local"

  # Create .env.local with header
  cat > "$app_env" << 'EOF'
# This file is auto-generated from root .env
# DO NOT EDIT MANUALLY - Update root .env instead
# Run: npm run env:sync to update

EOF

  # Append root .env content
  cat "$ROOT_ENV" >> "$app_env"

  echo "  ✅ Synced to $app_name"
}

# Sync to all apps
sync_env_to_app "web"
sync_env_to_app "rent"
sync_env_to_app "docs"

echo ""
echo "✅ Environment variables synced successfully!"
echo ""
echo "ℹ️  Remember to run 'npm run env:sync' after updating root .env"
