/**
 * Send email notifications when an order requires manual provisioning
 * Used across wallet-payment, activate, and nowpayments webhook routes
 */

interface SendProvisioningEmailsParams {
  supabase: any;
  orderId: string;
  userId: string;
  userEmail: string;
  plan: {
    name: string;
    [key: string]: any;
  };
  quantity: number;
  totalAmount: number;
  duration_days?: number;
  connectionId: string;
  origin: string;
}

/**
 * Sends email notifications to admins and customer when order needs manual provisioning
 */
export async function sendProvisioningEmails({
  supabase,
  orderId,
  userId,
  userEmail,
  plan,
  quantity,
  totalAmount,
  duration_days,
  connectionId,
  origin,
}: SendProvisioningEmailsParams): Promise<{
  success: boolean;
  adminEmailsSent: number;
  adminTelegramsSent: number;
  customerEmailSent: boolean;
}> {
  let adminEmailsSent = 0;
  let adminTelegramsSent = 0;
  let customerEmailSent = false;

  // Send email and Telegram notifications to admins
  try {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, email, notify_email, notify_telegram, telegram_chat_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        // Send email notification if enabled
        if (admin.email && admin.notify_email !== false) {
          try {
            const response = await fetch(`${origin}/api/notifications/email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: admin.email,
                subject: "⚠️ New Order Requires Manual Provisioning",
                html: `
                  <h2>Order Awaiting Activation</h2>
                  <p>A new order requires manual provisioning due to inactive connection.</p>
                  <h3>Order Details:</h3>
                  <ul>
                    <li><strong>Order ID:</strong> ${orderId}</li>
                    <li><strong>User ID:</strong> ${userId}</li>
                    <li><strong>User Email:</strong> ${userEmail}</li>
                    <li><strong>Plan:</strong> ${plan.name}</li>
                    <li><strong>Quantity:</strong> ${quantity}</li>
                    <li><strong>Amount:</strong> $${totalAmount.toFixed(2)}</li>
                    <li><strong>Connection ID:</strong> ${connectionId}</li>
                    ${duration_days ? `<li><strong>Duration:</strong> ${duration_days} days</li>` : ""}
                  </ul>
                  <p><strong>Action Required:</strong> Please activate this order in the admin panel.</p>
                  <p><a href="${origin}/admin/processing-orders" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">View Processing Orders</a></p>
                `,
              }),
            });

            if (response.ok) {
              adminEmailsSent++;
              console.log(`Manual provisioning email sent to admin ${admin.email}`);
            }
          } catch (error) {
            console.error(`Failed to send email to admin ${admin.email}:`, error);
          }
        }

        // Send Telegram notification if enabled
        if (admin.notify_telegram && admin.telegram_chat_id) {
          try {
            const telegramMessage = `
⚠️ *New Order Requires Manual Provisioning*

A new order requires manual provisioning due to inactive connection.

*Order Details:*
• Order ID: \`${orderId}\`
• User ID: \`${userId}\`
• User Email: ${userEmail}
• Plan: *${plan.name}*
• Quantity: ${quantity}
• Amount: *$${totalAmount.toFixed(2)}*
• Connection ID: \`${connectionId}\`
${duration_days ? `• Duration: ${duration_days} days` : ""}

*Action Required:* Please activate this order in the admin panel.

[View Processing Orders](${origin}/admin/processing-orders)
            `.trim();

            const telegramResponse = await fetch(`${origin}/api/notifications/telegram`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: admin.telegram_chat_id,
                message: telegramMessage,
              }),
            });

            if (telegramResponse.ok) {
              adminTelegramsSent++;
              console.log(`Manual provisioning notification sent via Telegram to admin ${admin.email}`);
            } else {
              const errorData = await telegramResponse.json();
              console.error(`Failed to send Telegram to admin ${admin.email} (${admin.telegram_chat_id}):`, errorData.error);

              // If chat not found, disable Telegram notifications for this admin
              if (errorData.error?.includes('chat not found') || errorData.error?.includes('bot was blocked')) {
                console.log(`Disabling Telegram notifications for admin ${admin.email} due to invalid chat_id`);
                await supabase
                  .from('profiles')
                  .update({ notify_telegram: false })
                  .eq('id', admin.id);
              }
            }
          } catch (error) {
            console.error(`Failed to send Telegram notification to admin ${admin.email}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch admins or send admin notifications:", error);
  }

  // Send notification to customer
  try {
    // Fetch user profile to check notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("notify_email, notify_telegram, telegram_chat_id, payment_confirmations")
      .eq("id", userId)
      .single();

    // Check if payment confirmations are enabled (default to true if not set)
    const shouldNotify = profile?.payment_confirmations !== false;

    if (!shouldNotify) {
      console.log(`User ${userEmail} has payment_confirmations disabled, skipping notification`);
      return {
        success: true,
        adminEmailsSent,
        adminTelegramsSent,
        customerEmailSent: false,
      };
    }

    const emailHtml = `
      <h2>Thank you for your order!</h2>
      <p>Hi,</p>
      <p>We've received your payment and your order is currently being processed.</p>
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Order ID:</strong> ${orderId.slice(0, 8)}</li>
        <li><strong>Plan:</strong> ${plan.name}</li>
        <li><strong>Quantity:</strong> ${quantity} proxy${quantity > 1 ? "ies" : ""}</li>
        <li><strong>Amount Paid:</strong> $${totalAmount.toFixed(2)}</li>
        ${duration_days ? `<li><strong>Duration:</strong> ${duration_days} days</li>` : ""}
      </ul>
      <p><strong>What's Next?</strong></p>
      <p>Your proxies are being provisioned and will be available shortly. You'll receive another email once they're ready to use.</p>
      <p>You can check your order status at any time in your dashboard: <a href="${origin}/dashboard">${origin}/dashboard</a></p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>iProxy Team</p>
    `;

    // Send email if enabled
    if (profile?.notify_email !== false) {
      const response = await fetch(`${origin}/api/notifications/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: "Order Received - Processing in Progress",
          html: emailHtml,
        }),
      });

      customerEmailSent = response.ok;

      if (response.ok) {
        console.log(`Payment confirmation email sent to ${userEmail}`);
      }
    } else {
      console.log(`Email notifications disabled for ${userEmail}`);
    }

    // Send Telegram notification if enabled
    if (profile?.notify_telegram && profile?.telegram_chat_id) {
      const telegramMessage = `
🎉 *Thank you for your order!*

We've received your payment and your order is currently being processed.

*Order Details:*
• Order ID: \`${orderId.slice(0, 8)}\`
• Plan: *${plan.name}*
• Quantity: ${quantity} proxy${quantity > 1 ? "ies" : ""}
• Amount Paid: *$${totalAmount.toFixed(2)}*
${duration_days ? `• Duration: ${duration_days} days` : ""}

*What's Next?*
Your proxies are being provisioned and will be available shortly. You'll receive another notification once they're ready to use.

[View Dashboard](${origin}/dashboard)
      `.trim();

      try {
        const telegramResponse = await fetch(`${origin}/api/notifications/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: profile.telegram_chat_id,
            message: telegramMessage,
          }),
        });

        if (telegramResponse.ok) {
          console.log(`Payment confirmation sent via Telegram to ${userEmail}`);
        } else {
          const errorData = await telegramResponse.json();
          console.error(`Failed to send Telegram to ${userEmail} (${profile.telegram_chat_id}):`, errorData.error);

          // If chat not found, disable Telegram notifications for this user
          if (errorData.error?.includes('chat not found') || errorData.error?.includes('bot was blocked')) {
            console.log(`Disabling Telegram notifications for ${userEmail} due to invalid chat_id`);
            await supabase
              .from('profiles')
              .update({ notify_telegram: false })
              .eq('id', userId);
          }
        }
      } catch (telegramError) {
        console.error(`Failed to send Telegram notification to ${userEmail}:`, telegramError);
      }
    }
  } catch (emailError) {
    console.error("Failed to send customer notification:", emailError);
  }

  return {
    success: true,
    adminEmailsSent,
    adminTelegramsSent,
    customerEmailSent,
  };
}

/**
 * Sends email and Telegram notifications to admins when a connection needs configuration
 */
export async function sendConnectionConfigNeededEmail({
  supabase,
  orderId,
  userEmail,
  connectionId,
  origin,
}: {
  supabase: any;
  orderId: string;
  userEmail: string;
  connectionId: string;
  origin: string;
}): Promise<{ success: boolean; emailsSent: number; telegramsSent: number }> {
  let emailsSent = 0;
  let telegramsSent = 0;

  try {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, email, notify_email, notify_telegram, telegram_chat_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        // Send email notification if enabled
        if (admin.email && admin.notify_email !== false) {
          try {
            const response = await fetch(`${origin}/api/notifications/email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: admin.email,
                subject: "⚠️ Connection Needs Configuration",
                html: `
                  <h2>Connection Requires Configuration</h2>
                  <p>A connection has been sold and needs to be configured on the Android device.</p>
                  <h3>Details:</h3>
                  <ul>
                    <li><strong>Order ID:</strong> ${orderId}</li>
                    <li><strong>User Email:</strong> ${userEmail}</li>
                    <li><strong>Connection ID:</strong> ${connectionId}</li>
                  </ul>
                  <p><strong>Action Required:</strong> Please configure this connection on the Android device.</p>
                `,
              }),
            });

            if (response.ok) {
              emailsSent++;
              console.log(`Config notification email sent to admin ${admin.email}`);
            }
          } catch (error) {
            console.error(`Failed to send email to admin ${admin.email}:`, error);
          }
        }

        // Send Telegram notification if enabled
        if (admin.notify_telegram && admin.telegram_chat_id) {
          try {
            const telegramMessage = `
⚠️ *Connection Needs Configuration*

A connection has been sold and needs to be configured on the Android device.

*Details:*
• Order ID: \`${orderId}\`
• User Email: ${userEmail}
• Connection ID: \`${connectionId}\`

*Action Required:* Please configure this connection on the Android device.
            `.trim();

            const telegramResponse = await fetch(`${origin}/api/notifications/telegram`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: admin.telegram_chat_id,
                message: telegramMessage,
              }),
            });

            if (telegramResponse.ok) {
              telegramsSent++;
              console.log(`Config notification sent via Telegram to admin ${admin.email}`);
            } else {
              const errorData = await telegramResponse.json();
              console.error(`Failed to send Telegram to admin ${admin.email} (${admin.telegram_chat_id}):`, errorData.error);

              // If chat not found, disable Telegram notifications for this admin
              if (errorData.error?.includes('chat not found') || errorData.error?.includes('bot was blocked')) {
                console.log(`Disabling Telegram notifications for admin ${admin.email} due to invalid chat_id`);
                await supabase
                  .from('profiles')
                  .update({ notify_telegram: false })
                  .eq('id', admin.id);
              }
            }
          } catch (error) {
            console.error(`Failed to send Telegram notification to admin ${admin.email}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to send connection config notifications:", error);
  }

  return { success: true, emailsSent, telegramsSent };
}
