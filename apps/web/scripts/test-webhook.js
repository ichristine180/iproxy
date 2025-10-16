#!/usr/bin/env node

/**
 * Test script for NowPayments webhook
 * Usage: node scripts/test-webhook.js [status] [order_id]
 *
 * Examples:
 *   node scripts/test-webhook.js waiting payment-123-uuid
 *   node scripts/test-webhook.js finished payment-123-uuid
 *   node scripts/test-webhook.js failed payment-123-uuid
 */

const crypto = require('crypto');

const status = process.argv[2] || 'finished';
const orderId = process.argv[3];

if (!orderId) {
  console.error('Error: order_id is required');
  console.log('Usage: node scripts/test-webhook.js [status] [order_id]');
  console.log('Example: node scripts/test-webhook.js finished payment-1234567890-uuid');
  process.exit(1);
}

const payload = {
  payment_id: `test_${Date.now()}`,
  invoice_id: `inv_test_${Date.now()}`,
  payment_status: status,
  pay_address: 'bc1qtest123456789',
  price_amount: 10.00,
  price_currency: 'usd',
  pay_amount: 0.00025,
  actually_paid: status === 'finished' ? 0.00025 : 0,
  pay_currency: 'btc',
  order_id: orderId,
  order_description: `Test Payment - ${status}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const payloadString = JSON.stringify(payload);

// Generate signature if IPN secret is available
let signature = 'test-signature';
const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

if (ipnSecret) {
  signature = crypto
    .createHmac('sha512', ipnSecret)
    .update(payloadString)
    .digest('hex');
  console.log('✓ Generated valid signature');
} else {
  console.log('⚠ No NOWPAYMENTS_IPN_SECRET found, using test signature');
}

const url = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/nowpayments';

console.log('\n📤 Sending webhook to:', url);
console.log('📦 Payload:', JSON.stringify(payload, null, 2));
console.log('🔑 Signature:', signature.substring(0, 20) + '...\n');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nowpayments-sig': signature,
  },
  body: payloadString,
})
  .then(async (response) => {
    const text = await response.text();
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Body:', text);

    if (response.ok) {
      console.log('\n✅ Webhook sent successfully!');
      console.log('\nNext steps:');
      console.log('1. Check your terminal logs for webhook processing');
      console.log('2. Query database to verify updates:');
      console.log(`   SELECT * FROM webhook_events WHERE payload->>'order_id' = '${orderId}';`);
      console.log(`   SELECT * FROM payments WHERE metadata->>'order_id' = '${orderId}';`);
    } else {
      console.log('\n❌ Webhook failed');
    }
  })
  .catch((error) => {
    console.error('❌ Error sending webhook:', error.message);
    process.exit(1);
  });
