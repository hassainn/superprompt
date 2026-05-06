// ═══════════════════════════════════════════════════════════════════════════
//  SuperPrompt — Automatic Activation Backend
//  Deploy: Google Apps Script → Deploy → New deployment → Web App
//  Execute as: Me  |  Access: Anyone
//
//  ── Setup steps ────────────────────────────────────────────────────────────
//  1. Go to script.google.com → New project → paste this file
//  2. Create a Google Sheet → copy its ID from the URL → paste below
//  3. Create a Razorpay account → Settings → Webhooks → add your web app URL
//     → enable event: payment.captured → copy the secret → paste below
//  4. Create two Razorpay Payment Links:
//       Pro    → Amount ₹79 → "Collect customer email" ON → copy short URL
//       Expert → Amount ₹149 → "Collect customer email" ON → copy short URL
//  5. Deploy this script as a Web App → copy the URL
//  6. Paste the Web App URL + Payment Link URLs into popup.js CONFIG section
// ═══════════════════════════════════════════════════════════════════════════

// ── Developer config (fill these in) ──────────────────────────────────────
const SHEET_ID                = 'YOUR_GOOGLE_SHEET_ID';
const RAZORPAY_WEBHOOK_SECRET = 'YOUR_RAZORPAY_WEBHOOK_SECRET';
const ADMIN_EMAIL             = 'support.alphaone@gmail.com';
const EXTENSION_NAME          = 'SuperPrompt';

// ── HMAC secret — MUST match HMAC_SECRET in popup.js & admin.html ─────────
const HMAC_SECRET = 'SP-NAZEER-KEY-2025';

// ── Tier definitions ───────────────────────────────────────────────────────
const TIERS = {
  pro:    { prefix: 'NZP', amountPaise: 7900,  label: 'Pro ✨',    price: '₹79/mo'  },
  expert: { prefix: 'NZE', amountPaise: 14900, label: 'Expert 🚀', price: '₹149/mo' },
};

// ═══════════════════════════════════════════════════════════════════════════
//  HTTP HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

// Called by Razorpay webhook (POST)
function doPost(e) {
  try {
    const body      = e.postData.contents;
    const signature = e.headers['X-Razorpay-Signature'] || '';

    if (!verifyRazorpaySignature(body, signature)) {
      Logger.log('Invalid webhook signature');
      return jsonResponse({ error: 'Unauthorized' });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      processPayment(event.payload.payment.entity);
    }

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResponse({ error: 'Internal error' });
  }
}

// Called by extension to verify an activation code (GET)
// ?action=verify&code=NZP-2605-0001-A3F7
function doGet(e) {
  const params = e.parameter || {};

  if (params.action === 'verify') {
    const result = verifyCode(params.code || '');
    return jsonResponse(result);
  }

  if (params.action === 'health') {
    return jsonResponse({
      status: 'ok',
      service: 'SuperPrompt Activation Server',
      tiers: Object.keys(TIERS),
    });
  }

  // Default health check
  return jsonResponse({ status: 'SuperPrompt activation server running' });
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAYMENT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

function processPayment(payment) {
  const email     = (payment.email || payment.notes?.customer_email || '').toLowerCase().trim();
  const amountPaise = payment.amount;
  const paymentId   = payment.id;

  if (!email) {
    Logger.log('No email on payment: ' + paymentId);
    GmailApp.sendEmail(ADMIN_EMAIL,
      '[SuperPrompt] Payment missing email — ' + paymentId,
      'Payment ID: ' + paymentId + '\nAmount: ' + (amountPaise / 100) + '\n\nNo customer email found. Please handle manually.'
    );
    return;
  }

  // Determine tier by amount
  let tier = null;
  for (const [key, cfg] of Object.entries(TIERS)) {
    if (cfg.amountPaise === amountPaise) { tier = key; break; }
  }

  if (!tier) {
    Logger.log('Unknown amount: ' + amountPaise + ' for payment ' + paymentId);
    return;
  }

  // Check for duplicate payment (same email + tier active this month)
  if (isDuplicateThisMonth(email, tier)) {
    Logger.log('Duplicate payment ignored: ' + email + ' ' + tier);
    return;
  }

  // Generate unique activation code
  const code = generateUniqueCode(tier);

  // Save to sheet
  logActivation(paymentId, email, tier, code);

  // Auto-email the customer
  sendActivationEmail(email, tier, code);

  // Notify admin
  sendAdminNotification(paymentId, email, tier, code);

  Logger.log('Activated ' + tier + ' for ' + email + ' → ' + code);
}

// ═══════════════════════════════════════════════════════════════════════════
//  CODE GENERATION  (HMAC-SHA256 format matching admin.html & popup.js)
//  Format: NZP-YYMM-SSSS-CCCC
//    NZP/NZE = tier prefix
//    YYMM    = 2-digit year + 2-digit month (e.g. 2605 = May 2026)
//    SSSS    = 4-digit serial (0001–9999)
//    CCCC    = first 4 hex chars of HMAC-SHA256(secret, prefix+YYMM+serial)
// ═══════════════════════════════════════════════════════════════════════════

function generateUniqueCode(tier) {
  const cfg      = TIERS[tier];
  const yymm     = getYYMM(new Date());
  const serial   = getNextSerial(tier, yymm);
  const serialStr = String(serial).padStart(4, '0');

  // Compute HMAC-SHA256 checksum (matches popup.js validateLocalCode)
  const data     = cfg.prefix + yymm + serialStr;
  const sigBytes = Utilities.computeHmacSha256Signature(data, HMAC_SECRET);
  const hex      = sigBytes.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  const checksum = hex.slice(0, 4).toUpperCase();

  const code = cfg.prefix + '-' + yymm + '-' + serialStr + '-' + checksum;

  // Ensure no collision (extremely unlikely but safe)
  if (codeExistsInSheet(code)) {
    // Bump serial and retry
    return generateUniqueCode(tier);
  }
  return code;
}

function getNextSerial(tier, yymm) {
  const data  = getSheet().getDataRange().getValues();
  const prefix = TIERS[tier].prefix;
  let maxSerial = 0;

  for (let i = 1; i < data.length; i++) {
    const code = String(data[i][3]);
    if (code.startsWith(prefix + '-' + yymm + '-')) {
      const parts = code.split('-');
      if (parts.length >= 3) {
        const s = parseInt(parts[2], 10);
        if (s > maxSerial) maxSerial = s;
      }
    }
  }
  return maxSerial + 1;
}

function getYYMM(d) {
  return String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, '0');
}

// ═══════════════════════════════════════════════════════════════════════════
//  CODE VERIFICATION  (called by extension)
// ═══════════════════════════════════════════════════════════════════════════

function verifyCode(code) {
  if (!code || code.length < 10) return { valid: false, reason: 'invalid_format' };

  const sheet  = getSheet();
  const rows   = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // columns: 0=paymentId, 1=email, 2=tier, 3=code, 4=date, 5=status
    if (row[3] === code.trim().toUpperCase()) {
      const status = row[5];
      if (status === 'revoked') return { valid: false, reason: 'revoked' };
      return { valid: true, tier: row[2], email: row[1] };
    }
  }
  return { valid: false, reason: 'not_found' };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GOOGLE SHEET HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getSheet() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName('Activations');

  if (!sheet) {
    // First-time setup: create sheet with headers
    sheet = ss.insertSheet('Activations');
    sheet.appendRow(['Payment ID', 'Email', 'Tier', 'Code', 'Date', 'Status']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  return sheet;
}

function logActivation(paymentId, email, tier, code) {
  getSheet().appendRow([
    paymentId,
    email,
    tier,
    code,
    new Date().toISOString(),
    'active',
  ]);
}

function codeExistsInSheet(code) {
  const data = getSheet().getDataRange().getValues();
  return data.some((row, i) => i > 0 && row[3] === code);
}

function isDuplicateThisMonth(email, tier) {
  const yymm = getYYMM(new Date());
  const data  = getSheet().getDataRange().getValues();
  return data.some((row, i) =>
    i > 0 &&
    row[1] === email &&
    row[2] === tier &&
    row[3].includes('-' + yymm + '-') &&
    row[5] === 'active'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  EMAIL SENDING
// ═══════════════════════════════════════════════════════════════════════════

function sendActivationEmail(email, tier, code) {
  const cfg = TIERS[tier];
  const tierName = cfg.label.replace(/[✨🚀]/g, '').trim();

  const subject = `${EXTENSION_NAME} ${cfg.label} — Your Activation Code`;

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.15);">
      <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:28px 24px;text-align:center;">
        <div style="font-size:36px;margin-bottom:6px;">⚡</div>
        <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">${EXTENSION_NAME}</div>
        <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">AI Prompt Enhancer</div>
      </div>
      <div style="padding:28px 24px;">
        <p style="font-size:15px;color:#1a1523;margin:0 0 16px;">Hi there! 👋</p>
        <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 20px;">
          Thank you for subscribing to <strong>${EXTENSION_NAME} ${cfg.label}</strong> (${cfg.price}).
          Here's your activation code:
        </p>
        <div style="background:linear-gradient(135deg,#f8f7ff,#eef2ff);border:2px solid #6366f1;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6366f1;margin-bottom:8px;">Activation Code</div>
          <div style="font-family:monospace;font-size:22px;font-weight:800;color:#1a1523;letter-spacing:1.5px;">${code}</div>
        </div>
        <div style="background:#f8f7ff;border-radius:10px;padding:16px;margin:0 0 20px;">
          <div style="font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">How to Activate</div>
          <ol style="font-size:13px;color:#444;line-height:1.8;margin:0;padding-left:18px;">
            <li>Click the <strong>SuperPrompt</strong> icon in your Chrome toolbar</li>
            <li>Click the <strong>${tierName}</strong> pill button</li>
            <li>Enter the code above and click <strong>Activate</strong></li>
            <li>Done! Enjoy your ${cfg.label} prompts 🎉</li>
          </ol>
        </div>
        <p style="font-size:12px;color:#888;line-height:1.5;margin:0;">
          This code is valid for the current and next calendar month.<br>
          Need help? Reply to this email.
        </p>
      </div>
      <div style="background:#f0eeff;padding:14px 24px;text-align:center;font-size:11px;color:#6b6b8a;">
        ${EXTENSION_NAME} · ${ADMIN_EMAIL}
      </div>
    </div>`;

  const plainBody = `Hi there!

Thank you for subscribing to ${EXTENSION_NAME} ${cfg.label} (${cfg.price}).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Your Activation Code:

  ${code}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How to activate:
  1. Click the SuperPrompt icon in your Chrome toolbar
  2. Click the "${tierName}" pill button
  3. Enter the code above and click Activate
  4. Done! Enjoy your ${cfg.label} prompts.

This code is valid for the current and next calendar month.

Need help? Reply to this email.
— ${EXTENSION_NAME} Team (${ADMIN_EMAIL})`;

  GmailApp.sendEmail(email, subject, plainBody, { htmlBody: htmlBody });
}

function sendAdminNotification(paymentId, email, tier, code) {
  GmailApp.sendEmail(
    ADMIN_EMAIL,
    `[SuperPrompt] ✅ New ${tier} subscriber — ${email}`,
    `Payment ID : ${paymentId}\nCustomer   : ${email}\nTier       : ${tier}\nCode sent  : ${code}\nDate       : ${new Date().toLocaleString()}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  RAZORPAY SIGNATURE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

function verifyRazorpaySignature(body, signature) {
  if (!signature) return false;
  try {
    const expected = Utilities.computeHmacSha256Signature(body, RAZORPAY_WEBHOOK_SECRET);
    const hex      = expected.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
    return hex === signature;
  } catch (e) {
    Logger.log('Signature error: ' + e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Manual admin helpers (run from Apps Script editor if needed) ───────────

function revokeCode(code) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === code) {
      sheet.getRange(i + 1, 6).setValue('revoked');
      Logger.log('Revoked: ' + code);
      return;
    }
  }
  Logger.log('Code not found: ' + code);
}

function listActiveSubscribers() {
  const data = getSheet().getDataRange().getValues();
  data.slice(1)
    .filter(r => r[5] === 'active')
    .forEach(r => Logger.log(`${r[1]} | ${r[2]} | ${r[3]} | ${r[4]}`));
}
