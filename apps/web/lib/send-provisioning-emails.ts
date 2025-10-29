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
  customerEmailSent: boolean;
}> {
  let adminEmailsSent = 0;
  let customerEmailSent = false;

  // Send email notification to admins
  try {
    const { data: admins } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const adminEmails = admins
        .map((admin: any) => admin.email)
        .filter(Boolean);

      for (const adminEmail of adminEmails) {
        try {
          const response = await fetch(`${origin}/api/notifications/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: adminEmail,
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
          }
        } catch (error) {
          console.error(`Failed to send email to admin ${adminEmail}:`, error);
        }
      }
    }
  } catch (emailError) {
    console.error("Failed to fetch admins or send admin emails:", emailError);
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
    customerEmailSent,
  };
}

/**
 * Sends email notification to admins when a connection needs configuration
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
}): Promise<{ success: boolean; emailsSent: number }> {
  let emailsSent = 0;

  try {
    const { data: admins } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const adminEmails = admins
        .map((admin: any) => admin.email)
        .filter(Boolean);

      for (const adminEmail of adminEmails) {
        try {
          const response = await fetch(`${origin}/api/notifications/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: adminEmail,
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
          }
        } catch (error) {
          console.error(`Failed to send email to admin ${adminEmail}:`, error);
        }
      }
    }
  } catch (emailError) {
    console.error("Failed to send connection config emails:", emailError);
  }

  return { success: true, emailsSent };
}
