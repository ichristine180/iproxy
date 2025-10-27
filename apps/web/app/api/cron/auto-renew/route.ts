import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { iproxyService } from "@/lib/iproxy-service";

/**
 * Cron job to handle auto-renewal of proxies
 * This endpoint should be called periodically (e.g., daily)
 *
 * Workflow:
 * 1. Three days before expiry (except 1-day plans): Send notifications if auto-renew disabled or insufficient funds
 * 2. On expiry: Process auto-renewals or deactivate proxies, update quota
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // ===== STEP 1: Handle 3-day notifications =====
    // Find active proxies expiring in ~3 days (except 1-day plans)
    const { data: proxiesForNotification, error: notificationFetchError } = await supabaseAdmin
      .from("proxies")
      .select(`
        *,
        order:orders!proxies_order_id_fkey(
          *,
          plan:plans(*)
        )
      `)
      .eq("status", "active")
      .gte("expires_at", threeDaysFromNow.toISOString())
      .lt("expires_at", new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (notificationFetchError) {
      console.error("Error fetching proxies for notification:", notificationFetchError);
    }

    const notificationResults = [];
    let notificationsSent = 0;

    if (proxiesForNotification && proxiesForNotification.length > 0) {
      for (const proxy of proxiesForNotification) {
        try {
          // Skip 1-day plans
          const order = proxy.order;
          if (!order || !order.plan) continue;

          // Calculate plan duration from order dates
          const startAt = new Date(order.start_at);
          const expiresAt = new Date(order.expires_at);
          const durationDays = Math.ceil((expiresAt.getTime() - startAt.getTime()) / (24 * 60 * 60 * 1000));

          if (durationDays <= 1) {
            console.log(`Skipping 1-day plan notification for proxy ${proxy.id}`);
            continue;
          }

          // Get user profile
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", proxy.user_id)
            .single();

          if (!profile) {
            console.error(`Profile not found for user ${proxy.user_id}`);
            continue;
          }

          const expiryDate = new Date(proxy.expires_at);
          let notifyReason = "";

          if (proxy.auto_renew) {
            // Check if user has sufficient funds
            const { data: wallet } = await supabaseAdmin
              .from("user_wallet")
              .select("balance")
              .eq("user_id", proxy.user_id)
              .single();

            if (!wallet || wallet.balance < order.total_amount) {
              notifyReason = "insufficient_funds";
              // Send notification about insufficient funds
              await sendExpiryNotification(
                supabaseAdmin,
                profile,
                proxy,
                expiryDate,
                order.total_amount,
                "insufficient_funds"
              );
              notificationsSent++;
              notificationResults.push({
                proxy_id: proxy.id,
                user_email: profile.email,
                reason: notifyReason,
                sent: true,
              });
            }
          } else {
            // Auto-renew not enabled
            notifyReason = "auto_renew_disabled";
            await sendExpiryNotification(
              supabaseAdmin,
              profile,
              proxy,
              expiryDate,
              order.total_amount,
              "auto_renew_disabled"
            );
            notificationsSent++;
            notificationResults.push({
              proxy_id: proxy.id,
              user_email: profile.email,
              reason: notifyReason,
              sent: true,
            });
          }
        } catch (error: any) {
          console.error(`Error sending notification for proxy ${proxy.id}:`, error);
          notificationResults.push({
            proxy_id: proxy.id,
            sent: false,
            error: error.message,
          });
        }
      }
    }

    // ===== STEP 2: Handle expired proxies =====
    const { data: expiredProxies, error: expiredFetchError } = await supabaseAdmin
      .from("proxies")
      .select(`
        *,
        order:orders!proxies_order_id_fkey(
          *,
          plan:plans(*)
        )
      `)
      .eq("status", "active")
      .lt("expires_at", now.toISOString());

    if (expiredFetchError) {
      console.error("Error fetching expired proxies:", expiredFetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch expired proxies" },
        { status: 500 }
      );
    }

    const renewalResults = [];
    let renewedCount = 0;
    let deactivatedCount = 0;
    let quotaUpdated = 0;

    if (expiredProxies && expiredProxies.length > 0) {
      for (const proxy of expiredProxies) {
        try {
          const order = proxy.order;
          if (!order || !order.plan) {
            console.error(`Order or plan not found for proxy ${proxy.id}`);
            continue;
          }

          if (proxy.auto_renew) {
            // Check if user has sufficient funds for renewal
            const { data: wallet } = await supabaseAdmin
              .from("user_wallet")
              .select("balance")
              .eq("user_id", proxy.user_id)
              .single();

            if (wallet && wallet.balance >= order.total_amount) {
              // Sufficient funds - process auto-renewal
              // Calculate plan duration
              const startAt = new Date(order.start_at);
              const expiresAt = new Date(order.expires_at);
              const durationDays = Math.ceil((expiresAt.getTime() - startAt.getTime()) / (24 * 60 * 60 * 1000));

              const currentExpiry = new Date(proxy.expires_at);
              const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

              // Deduct from wallet
              const { error: walletError } = await supabaseAdmin
                .from("user_wallet")
                .update({ balance: wallet.balance - order.total_amount })
                .eq("user_id", proxy.user_id);

              if (walletError) {
                console.error(`Failed to deduct from wallet for proxy ${proxy.id}:`, walletError);
                throw walletError;
              }

              // Create renewal order
              const { data: newOrder, error: orderError } = await supabaseAdmin
                .from("orders")
                .insert({
                  user_id: proxy.user_id,
                  plan_id: order.plan.id,
                  status: "active",
                  total_amount: order.total_amount,
                  start_at: currentExpiry.toISOString(),
                  expires_at: newExpiry.toISOString(),
                  quantity: order.quantity,
                  metadata: {
                    ...order.metadata,
                    auto_renewed: true,
                    original_order_id: order.id,
                  },
                })
                .select()
                .single();

              if (orderError || !newOrder) {
                console.error(`Failed to create renewal order for proxy ${proxy.id}:`, orderError);
                throw orderError;
              }

              // Update proxy
              const { error: updateError } = await supabaseAdmin
                .from("proxies")
                .update({
                  expires_at: newExpiry.toISOString(),
                  order_id: newOrder.id,
                  updated_at: now.toISOString(),
                })
                .eq("id", proxy.id);

              if (updateError) {
                console.error(`Failed to update proxy ${proxy.id}:`, updateError);
                throw updateError;
              }

              renewedCount++;
              renewalResults.push({
                proxy_id: proxy.id,
                action: "renewed",
                new_expiry: newExpiry.toISOString(),
                amount_charged: order.total_amount,
              });

              console.log(`Auto-renewed proxy ${proxy.id}, new expiry: ${newExpiry.toISOString()}`);
            } else {
              // Insufficient funds - deactivate proxy
              await deactivateProxy(supabaseAdmin, proxy);
              deactivatedCount++;
              quotaUpdated++;
              renewalResults.push({
                proxy_id: proxy.id,
                action: "deactivated",
                reason: "insufficient_funds",
              });
            }
          } else {
            // Auto-renew not enabled - deactivate proxy
            await deactivateProxy(supabaseAdmin, proxy);
            deactivatedCount++;
            quotaUpdated++;
            renewalResults.push({
              proxy_id: proxy.id,
              action: "deactivated",
              reason: "auto_renew_disabled",
            });
          }
        } catch (error: any) {
          console.error(`Error processing expired proxy ${proxy.id}:`, error);
          renewalResults.push({
            proxy_id: proxy.id,
            action: "failed",
            error: error.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      notifications: {
        checked: proxiesForNotification?.length || 0,
        sent: notificationsSent,
        results: notificationResults,
      },
      renewals: {
        checked: expiredProxies?.length || 0,
        renewed: renewedCount,
        deactivated: deactivatedCount,
        quota_updated: quotaUpdated,
        results: renewalResults,
      },
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Error in auto-renew cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Send expiry notification email to user
 */
async function sendExpiryNotification(
  _supabaseAdmin: any,
  profile: any,
  proxy: any,
  expiryDate: Date,
  renewalAmount: number,
  reason: "insufficient_funds" | "auto_renew_disabled"
) {
  try {
    const emailSubject =
      reason === "insufficient_funds"
        ? "Action Required: Insufficient Funds for Proxy Auto-Renewal"
        : "Reminder: Your Proxy Rental is Expiring Soon";

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Proxy Rental Expiration Notice</h2>
        <p>Hello,</p>
        <p>Your proxy rental <strong>${proxy.label}</strong> will expire on <strong>${expiryDate.toLocaleString()}</strong>.</p>

        ${
          reason === "insufficient_funds"
            ? `
        <p style="color: #d32f2f; font-weight: bold;">
          Auto-renewal is enabled, but your wallet balance is insufficient to complete the renewal.
        </p>
        <p>Required amount: <strong>$${renewalAmount.toFixed(2)}</strong></p>
        <p>Please top up your deposit to ensure uninterrupted service.</p>
        `
            : `
        <p>Auto-renewal is currently <strong>not activated</strong> for this proxy.</p>
        <p>To extend your rental for the next period, please:</p>
        <ol>
          <li>Top up your deposit with at least <strong>$${renewalAmount.toFixed(2)}</strong></li>
          <li>Enable auto-renewal for seamless service continuation</li>
        </ol>
        `
        }

        <p>If you do not take action, your proxy access will be removed after the expiration date.</p>

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://iproxy.com"}/dashboard"
             style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Manage Your Account
          </a>
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    `;

    // Send email notification
    if (profile.notify_email) {
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: profile.email,
            subject: emailSubject,
            html: emailBody,
          }),
        }
      );

      if (!emailResponse.ok) {
        console.error(`Failed to send email to ${profile.email}`);
      } else {
        console.log(`Expiry notification sent to ${profile.email}`);
      }
    }

    // TODO: Add Telegram notification if profile.notify_telegram is true
  } catch (error) {
    console.error("Error sending expiry notification:", error);
    throw error;
  }
}

/**
 * Deactivate proxy and update quota
 */
async function deactivateProxy(supabaseAdmin: any, proxy: any) {
  try {
    // Step 1: Delete proxy access from iProxy service
    if (proxy.iproxy_connection_id && proxy.id) {
      console.log(`Attempting to delete proxy access ${proxy.id} from connection ${proxy.iproxy_connection_id}`);

      const deleteResult = await iproxyService.deleteProxyAccess(
        proxy.iproxy_connection_id,
        proxy.id
      );

      if (!deleteResult.success) {
        console.error(`Failed to delete proxy access from iProxy: ${deleteResult.error}`);
        // Continue with database update even if API deletion fails
        // This ensures we don't leave orphaned records
      } else {
        console.log(`Successfully deleted proxy access ${proxy.id} from iProxy service`);
      }
    } else {
      console.warn(`Proxy ${proxy.id} missing iproxy_connection_id or id, skipping API deletion`);
    }

    // Step 2: Update proxy status to inactive in database
    const { error: proxyError } = await supabaseAdmin
      .from("proxies")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proxy.id);

    if (proxyError) {
      console.error(`Failed to deactivate proxy ${proxy.id}:`, proxyError);
      throw proxyError;
    }

    // Update quota - add freed connection back to quota
    // Get the first quota record (assuming single quota tracking)
    const { data: quota, error: quotaFetchError } = await supabaseAdmin
      .from("quota")
      .select("*")
      .limit(1)
      .single();

    if (quotaFetchError && quotaFetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching quota:", quotaFetchError);
      throw quotaFetchError;
    }

    if (quota) {
      // Update existing quota
      const { error: quotaUpdateError } = await supabaseAdmin
        .from("quota")
        .update({
          available_connection_number: quota.available_connection_number + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quota.id);

      if (quotaUpdateError) {
        console.error("Error updating quota:", quotaUpdateError);
        throw quotaUpdateError;
      }

      console.log(`Freed 1 connection, quota updated. New available: ${quota.available_connection_number + 1}`);
    } else {
      // Create quota if it doesn't exist
      const { error: quotaCreateError } = await supabaseAdmin
        .from("quota")
        .insert({
          available_connection_number: 1,
        });

      if (quotaCreateError) {
        console.error("Error creating quota:", quotaCreateError);
        throw quotaCreateError;
      }

      console.log("Created quota with 1 available connection");
    }

    console.log(`Proxy ${proxy.id} deactivated and quota updated`);
  } catch (error) {
    console.error(`Error in deactivateProxy for ${proxy.id}:`, error);
    throw error;
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
