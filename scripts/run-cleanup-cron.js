#!/usr/bin/env node



const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('Error: CRON_SECRET environment variable is not set');
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
  console.error('Stack:', error.stack);
  process.exit(1);
});
