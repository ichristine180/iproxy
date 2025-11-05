import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const orderId = id;

    // Create admin client to fetch order details
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch order with plan and payment details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        plan:plans(*),
        payment:payments(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(order, user);

    // For now, we'll return HTML that can be printed as PDF
    // In production, you'd use a library like puppeteer or pdfkit to generate actual PDFs
    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${orderId}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(order: any, user: any): string {
  const orderDate = new Date(order.start_at || order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${order.id.slice(0, 8)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    }

    .invoice {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #e0e0e0;
    }

    .company-info h1 {
      font-size: 32px;
      color: #2563eb;
      margin-bottom: 10px;
    }

    .company-info p {
      color: #666;
      line-height: 1.6;
    }

    .invoice-info {
      text-align: right;
    }

    .invoice-info h2 {
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
    }

    .invoice-info p {
      color: #666;
      margin: 5px 0;
    }

    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin: 40px 0;
    }

    .bill-to, .payment-info {
      flex: 1;
    }

    .bill-to h3, .payment-info h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .bill-to p, .payment-info p {
      color: #666;
      line-height: 1.8;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 40px 0;
    }

    thead {
      background: #f8f9fa;
    }

    th {
      text-align: left;
      padding: 15px;
      color: #333;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }

    td {
      padding: 20px 15px;
      border-bottom: 1px solid #e0e0e0;
      color: #666;
    }

    .totals {
      margin-top: 40px;
      text-align: right;
    }

    .totals table {
      margin-left: auto;
      width: 300px;
    }

    .totals td {
      padding: 10px;
      border: none;
    }

    .totals .label {
      color: #666;
    }

    .totals .amount {
      font-weight: 600;
      color: #333;
    }

    .totals .total-row {
      border-top: 2px solid #e0e0e0;
      font-size: 18px;
    }

    .totals .total-row td {
      padding-top: 20px;
      color: #2563eb;
      font-weight: 700;
    }

    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 14px;
    }

    .status {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status.paid {
      background: #d1fae5;
      color: #065f46;
    }

    .status.pending {
      background: #fef3c7;
      color: #92400e;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .invoice {
        box-shadow: none;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>HighBid proxies</h1>
        <p>Proxy Services Platform</p>
        <p>support@highbidproxies.com</p>
      </div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Status:</strong> <span class="status ${order.status === 'active' ? 'paid' : 'pending'}">${order.status}</span></p>
      </div>
    </div>

    <!-- Invoice Details -->
    <div class="invoice-details">
      <div class="bill-to">
        <h3>Bill To</h3>
        <p><strong>${user.email}</strong></p>
        <p>Customer ID: ${user.id.slice(0, 8)}</p>
      </div>
      <div class="payment-info">
        <h3>Payment Info</h3>
        <p><strong>Method:</strong> ${order.payment?.[0]?.payment_method || 'Wallet'}</p>
        <p><strong>Transaction ID:</strong> ${order.payment?.[0]?.id?.slice(0, 12) || 'N/A'}</p>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Duration</th>
          <th>Unit Price</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${order.plan?.name || 'Proxy Service'}</strong><br>
            <small>${order.plan?.description || ''}</small>
          </td>
          <td>${order.metadata?.duration_in_days || 30} days</td>
          <td>$${order.total_amount.toFixed(2)}</td>
          <td style="text-align: right;">$${order.total_amount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <table>
        <tr>
          <td class="label">Subtotal:</td>
          <td class="amount" style="text-align: right;">$${order.total_amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label">Tax (0%):</td>
          <td class="amount" style="text-align: right;">$0.00</td>
        </tr>
        <tr class="total-row">
          <td>TOTAL:</td>
          <td style="text-align: right;">$${order.total_amount.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This is a computer-generated invoice. No signature is required.</p>
      <p style="margin-top: 20px;">Questions? Contact us at support@highbidproxies.com</p>
    </div>
  </div>
</body>
</html>
  `;
}
