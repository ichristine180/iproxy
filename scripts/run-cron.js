#!/usr/bin/env node

/**
 * Railway Cron Job Runner (Node.js version)
 * This script is executed by Railway's cron service
 */

let APP_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
const CRON_SECRET = process.env.CRON_SECRET;

// Ensure URL has a protocol
if (APP_URL && !APP_URL.startsWith('http://') && !APP_URL.startsWith('https://')) {
  APP_URL = `https://${APP_URL}`;
}

async function runCron() {
  console.log("==========================================");
  console.log("Starting Auto-Renew Cron Job");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("==========================================");

  // Check if this is running during build phase
  if (process.env.RAILWAY_IS_BUILDER === 'true') {
    console.log("⚠️  Running in build phase - skipping cron execution");
    console.log("Cron will run on schedule after deployment");
    process.exit(0);
  }

  // Validate environment variables
  if (!APP_URL) {
    console.error("❌ Error: NEXT_PUBLIC_APP_BASE_URL environment variable is not set");
    process.exit(1);
  }

  // Check if URL is localhost in production
  if (APP_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.error("❌ Error: APP_URL is set to localhost in production!");
    console.error("Please set NEXT_PUBLIC_APP_BASE_URL to your production URL in Railway");
    process.exit(1);
  }

  if (!CRON_SECRET) {
    console.warn("⚠️  Warning: CRON_SECRET is not set (authentication may fail)");
  }

  const endpoint = `${APP_URL}/api/cron/auto-renew`;
  console.log(`Calling endpoint: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log(`HTTP Status: ${response.status}`);

    if (response.ok) {
      console.log("✅ Cron job completed successfully");
      console.log("\n📊 Results:");
      console.log("─────────────────────────────────────");

      if (data.notifications) {
        console.log("\n📧 Notifications:");
        console.log(`   Checked: ${data.notifications.checked || 0}`);
        console.log(`   Sent: ${data.notifications.sent || 0}`);
      }

      if (data.renewals) {
        console.log("\n♻️  Renewals:");
        console.log(`   Checked: ${data.renewals.checked || 0}`);
        console.log(`   Renewed: ${data.renewals.renewed || 0}`);
        console.log(`   Deactivated: ${data.renewals.deactivated || 0}`);
        console.log(`   Quota Updated: ${data.renewals.quota_updated || 0}`);
      }

      console.log("\n─────────────────────────────────────");
      console.log(`Timestamp: ${data.timestamp || new Date().toISOString()}`);

      process.exit(0);
    } else {
      console.error("❌ Cron job failed");
      console.error("Response:", JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Cron job failed with error:", error.message);

    if (error.cause) {
      console.error("Cause:", error.cause);
    }

    if (APP_URL.includes('localhost')) {
      console.error("\n⚠️  APP_URL is set to localhost - this won't work in production!");
      console.error("Set NEXT_PUBLIC_APP_BASE_URL in Railway to your production URL");
    }

    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

runCron();
