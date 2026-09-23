const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const Database = require('better-sqlite3');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigins = (process.env.FRONTEND_URL || '').split(',').map(value => value.trim()).filter(Boolean);
const cashfreeBaseUrl = process.env.CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';
const cashfreeApiVersion = process.env.CASHFREE_API_VERSION || '2025-01-01';
const dataDirectory = path.join(__dirname, 'data');
const receiptDirectory = path.join(dataDirectory, 'receipts');
fs.mkdirSync(receiptDirectory, { recursive: true });

const db = new Database(path.join(dataDirectory, 'donations.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS donations (
    donation_id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_session_id TEXT,
    cf_payment_id TEXT,
    receipt_path TEXT,
    receipt_emailed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS webhook_events (
    event_key TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    received_at TEXT NOT NULL
  );
`);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: frontendOrigins.length ? frontendOrigins : true }));

function now() {
  return new Date().toISOString();
}

function cleanText(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function validateDonation(input) {
  const name = cleanText(input.name, 100);
  const email = cleanText(input.email, 254).toLowerCase();
  const mobile = cleanText(input.mobile, 20);
  const amount = Number(input.amount);
  const errors = [];

  if (name.length < 2 || name.length > 100) errors.push('Enter a valid donor name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
  if (!/^\+?[0-9][0-9\s-]{9,18}$/.test(mobile)) errors.push('Enter a valid mobile number.');
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000000) errors.push('Donation amount must be a whole number between ₹1 and ₹10,00,000.');

  return { valid: errors.length === 0, errors, value: { name, email, mobile, amount } };
}

function cashfreeHeaders(idempotencyKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-version': cashfreeApiVersion,
    'x-client-id': process.env.CASHFREE_CLIENT_ID,
    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
    'x-request-id': idempotencyKey,
    'x-idempotency-key': idempotencyKey
  };
}

async function cashfreeRequest(endpoint, options = {}) {
  const response = await fetch(`${cashfreeBaseUrl}${endpoint}`, {
    ...options,
    headers: { ...cashfreeHeaders(options.idempotencyKey || crypto.randomUUID()), ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'Cashfree API request failed.');
    error.status = response.status;
    throw error;
  }
  return body;
}

function ensureCashfreeConfigured() {
  if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
    const error = new Error('Cashfree credentials are not configured on the backend.');
    error.status = 503;
    throw error;
  }
}

function makeDonationId() {
  return `NWF-DON-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function makeOrderId() {
  return `NWF_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function getDonation(orderId) {
  return db.prepare('SELECT * FROM donations WHERE order_id = ?').get(orderId);
}

function createReceiptPdf(donation) {
  const receiptPath = path.join(receiptDirectory, `${donation.donation_id}.pdf`);
  const document = new PDFDocument({ size: 'A4', margin: 56 });
  const stream = fs.createWriteStream(receiptPath);
  document.pipe(stream);
  document.fontSize(22).fillColor('#17324d').text('Nazeen Welfare Foundation', { align: 'center' });
  document.moveDown(0.4).fontSize(13).fillColor('#168a9b').text('Donation Receipt', { align: 'center' });
  document.moveDown(1.4).fontSize(11).fillColor('#333333');
  const rows = [
    ['Donor name', donation.name],
    ['Email', donation.email],
    ['Mobile', donation.mobile],
    ['Amount', `INR ${donation.amount.toLocaleString('en-IN')}`],
    ['Donation ID', donation.donation_id],
    ['Cashfree order ID', donation.order_id],
    ['Transaction ID', donation.cf_payment_id || 'Not available'],
    ['Date', new Date(donation.updated_at).toLocaleString('en-IN')],
    ['Payment status', donation.status]
  ];
  rows.forEach(([label, value]) => {
    document.font('Helvetica-Bold').text(`${label}:`, { continued: true, width: 150 });
    document.font('Helvetica').text(` ${value}`);
    document.moveDown(0.45);
  });
  document.moveDown(1).fontSize(9).fillColor('#666666').text('Thank you for supporting the work of Nazeen Welfare Foundation. This receipt does not make any claim of tax exemption.', { align: 'left' });
  document.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(receiptPath));
    stream.on('error', reject);
  });
}

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not configured on the backend.');
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function emailReceipt(donation, receiptPath) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'Nazeen Welfare Foundation <noreply@example.com>',
    to: donation.email,
    subject: `Donation receipt ${donation.donation_id}`,
    text: `Thank you for your donation of INR ${donation.amount.toLocaleString('en-IN')} to Nazeen Welfare Foundation. Your receipt is attached.`,
    attachments: [{ filename: `${donation.donation_id}.pdf`, path: receiptPath }]
  });
}

async function finalizeSuccessfulDonation(orderId, paymentId) {
  const donation = getDonation(orderId);
  if (!donation) return;
  db.prepare(`UPDATE donations SET status = 'SUCCESS', cf_payment_id = COALESCE(?, cf_payment_id), updated_at = ? WHERE order_id = ?`).run(paymentId || null, now(), orderId);
  const updated = getDonation(orderId);
  if (!updated.receipt_path) {
    const receiptPath = await createReceiptPdf(updated);
    db.prepare('UPDATE donations SET receipt_path = ?, updated_at = ? WHERE order_id = ?').run(receiptPath, now(), orderId);
  }
  const ready = getDonation(orderId);
  if (!ready.receipt_emailed) {
    await emailReceipt(ready, ready.receipt_path);
    db.prepare('UPDATE donations SET receipt_emailed = 1, updated_at = ? WHERE order_id = ?').run(now(), orderId);
  }
}

function webhookSignatureIsValid(rawBody, signature, timestamp) {
  if (!signature || !timestamp || !process.env.CASHFREE_CLIENT_SECRET) return false;
  const expected = crypto.createHmac('sha256', process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest('base64');
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(String(signature));
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

app.post('/api/cashfree/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const rawBody = request.body.toString('utf8');
  if (!webhookSignatureIsValid(rawBody, request.headers['x-webhook-signature'], request.headers['x-webhook-timestamp'])) {
    return response.status(401).json({ error: 'Invalid webhook signature.' });
  }
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return response.status(400).json({ error: 'Invalid webhook body.' });
  }

  const orderId = event?.data?.order?.order_id;
  const paymentId = event?.data?.payment?.cf_payment_id || null;
  if (!orderId) return response.status(400).json({ error: 'Webhook order ID is missing.' });
  const eventKey = crypto.createHash('sha256').update(rawBody).digest('hex');
  const inserted = db.prepare('INSERT OR IGNORE INTO webhook_events (event_key, order_id, received_at) VALUES (?, ?, ?)').run(eventKey, orderId, now());
  if (!inserted.changes) {
    const existingDonation = getDonation(orderId);
    if (existingDonation?.status === 'SUCCESS' && !existingDonation.receipt_emailed) {
      try {
        await finalizeSuccessfulDonation(orderId, paymentId);
      } catch (error) {
        console.error('Donation receipt retry failed:', error.message);
      }
    }
    return response.status(200).json({ received: true, duplicate: true });
  }

  const paymentStatus = event?.data?.payment?.payment_status;
  if (paymentStatus === 'SUCCESS') {
    try {
      await finalizeSuccessfulDonation(orderId, paymentId);
    } catch (error) {
      console.error('Donation finalization failed:', error.message);
    }
  } else if (paymentStatus === 'FAILED') {
    db.prepare("UPDATE donations SET status = 'FAILED', updated_at = ? WHERE order_id = ? AND status != 'SUCCESS'").run(now(), orderId);
  } else if (paymentStatus === 'USER_DROPPED') {
    db.prepare("UPDATE donations SET status = 'CANCELLED', updated_at = ? WHERE order_id = ? AND status != 'SUCCESS'").run(now(), orderId);
  } else if (paymentStatus === 'PENDING') {
    db.prepare("UPDATE donations SET status = 'PENDING', updated_at = ? WHERE order_id = ? AND status != 'SUCCESS'").run(now(), orderId);
  }
  return response.status(200).json({ received: true });
});

app.use(express.json({ limit: '32kb' }));

app.post('/api/donations/orders', async (request, response) => {
  try {
    ensureCashfreeConfigured();
    const validation = validateDonation(request.body || {});
    if (!validation.valid) return response.status(400).json({ error: validation.errors.join(' ') });
    if (!process.env.BACKEND_PUBLIC_URL || !process.env.FRONTEND_URL) return response.status(503).json({ error: 'Payment return URLs are not configured.' });

    const donationId = makeDonationId();
    const orderId = makeOrderId();
    const createdAt = now();
    const order = await cashfreeRequest('/orders', {
      method: 'POST',
      idempotencyKey: crypto.randomUUID(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: validation.value.amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: donationId.replace(/[^a-zA-Z0-9]/g, ''),
          customer_name: validation.value.name,
          customer_email: validation.value.email,
          customer_phone: validation.value.mobile.replace(/\D/g, '').slice(-10)
        },
        order_meta: {
          return_url: `${process.env.FRONTEND_URL}?donation_status=return&order_id=${encodeURIComponent(orderId)}`,
          notify_url: `${process.env.BACKEND_PUBLIC_URL}/api/cashfree/webhook`
        },
        order_note: 'Donation to Nazeen Welfare Foundation'
      })
    });
    db.prepare(`INSERT INTO donations (donation_id, order_id, name, email, mobile, amount, status, payment_session_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`).run(donationId, orderId, validation.value.name, validation.value.email, validation.value.mobile, validation.value.amount, order.payment_session_id, createdAt, createdAt);
    return response.status(201).json({ donationId, orderId, paymentSessionId: order.payment_session_id });
  } catch (error) {
    console.error('Order creation failed:', error.message);
    return response.status(error.status || 500).json({ error: error.message || 'Unable to start payment.' });
  }
});

app.get('/api/donations/orders/:orderId/status', (request, response) => {
  const donation = getDonation(request.params.orderId);
  if (!donation) return response.status(404).json({ error: 'Donation not found.' });
  return response.json({
    status: donation.status,
    donationId: donation.donation_id,
    orderId: donation.order_id,
    amount: donation.amount,
    email: donation.email,
    receiptReady: Boolean(donation.receipt_path),
    receiptUrl: donation.status === 'SUCCESS' && donation.receipt_path ? `/api/donations/orders/${encodeURIComponent(donation.order_id)}/receipt` : null
  });
});

app.get('/api/donations/orders/:orderId/receipt', (request, response) => {
  const donation = getDonation(request.params.orderId);
  if (!donation || donation.status !== 'SUCCESS' || !donation.receipt_path || !fs.existsSync(donation.receipt_path)) return response.status(404).json({ error: 'Receipt is not available yet.' });
  return response.download(donation.receipt_path, `${donation.donation_id}.pdf`);
});

app.get('/health', (request, response) => response.json({ ok: true, service: 'nazeen-donations' }));

app.listen(port, () => console.log(`Donation backend listening on port ${port}`));
