#!/usr/bin/env node

/**
 * Railway Cron Job Runner (Node.js version)
 * This script is executed by Railway's cron service
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;
const CRON_SECRET = process.env.CRON_SECRET;

async function runCron() {
  console.log("==========================================");
  console.log("Starting Auto-Renew Cron Job");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("==========================================");

  // Validate environment variables
  if (!APP_URL) {
    console.error("❌ Error: APP_URL environment variable is not set");
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
    console.error("❌ Error running cron job:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runCron();
