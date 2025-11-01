#!/bin/bash

# Railway Cron Job Runner
# This script is executed by Railway's cron service

set -e  # Exit on error

echo "=========================================="
echo "Starting Auto-Renew Cron Job"
echo "Time: $(date)"
echo "=========================================="

# Check required environment variables
if [ -z "$APP_URL" ]; then
    echo "❌ Error: APP_URL environment variable is not set"
    exit 1
fi

if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  Warning: CRON_SECRET is not set (authentication may fail)"
fi

echo "Calling endpoint: ${APP_URL}/api/cron/auto-renew"

# Make the API call
response=$(curl -s -w "\n%{http_code}" -X POST "${APP_URL}/api/cron/auto-renew" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json")

# Extract status code and body
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: ${http_code}"

if [ "$http_code" = "200" ]; then
    echo "✅ Cron job completed successfully"
    echo "Response: ${body}"
    exit 0
else
    echo "❌ Cron job failed"
    echo "Response: ${body}"
    exit 1
fi
