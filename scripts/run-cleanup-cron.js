#!/usr/bin/env node

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';

// Check if this is running during build phase
if (process.env.RAILWAY_IS_BUILDER === 'true') {
  console.log("⚠️  Running in build phase - skipping cron execution");
  process.exit(0);
}

if (!CRON_SECRET) {
  console.error('Error: CRON_SECRET environment variable is not set');
  process.exit(1);
}

// Check if URL is localhost in production
if (BASE_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
  console.error("❌ Error: BASE_URL is set to localhost in production!");
  console.error("Please set NEXT_PUBLIC_APP_BASE_URL to your production URL in Railway");
  process.exit(1);
}

console.log('==========================================');
console.log('Starting Cleanup Reservations Cron Job');
console.log('Time:', new Date().toISOString());
console.log('Calling endpoint:', `${BASE_URL}/api/cron/cleanup-reservations`);
console.log('==========================================');

fetch(`${BASE_URL}/api/cron/cleanup-reservations`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
})
.then(async (response) => {
  const data = await response.json();

  console.log('HTTP Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('Timestamp:', new Date().toISOString());
  console.log('==========================================');

  if (!response.ok) {
    console.error('❌ Cron job failed');
    process.exit(1);
  }

  if (data.success) {
    console.log('✅ Cron job completed successfully');
    console.log(`Released ${data.released_count} expired reservation(s)`);
    process.exit(0);
  } else {
    console.error('❌ Cron job returned failure');
    process.exit(1);
  }
})
.catch(error => {
  console.error('❌ Cron job failed with error:', error.message);

  if (error.cause) {
    console.error('Cause:', error.cause);
  }

  if (BASE_URL.includes('localhost')) {
    console.error("\n⚠️  BASE_URL is set to localhost - this won't work in production!");
    console.error("Set NEXT_PUBLIC_APP_BASE_URL in Railway to your production URL");
  }

  console.error('Stack:', error.stack);
  process.exit(1);
});
