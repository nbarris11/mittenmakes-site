const nodemailer = require('nodemailer');

const getRequiredEnv = name => {
  const value = process.env[name];
  if (!value) {
    const error = new Error(
      `Missing required environment variable: ${name}. Add it in Vercel before enabling Mitten Makes order emails.`
    );
    error.statusCode = 500;
    throw error;
  }
  return value;
};

const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMoney = cents =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format((Number(cents || 0) / 100));

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const host = getRequiredEnv('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || 465);
  const user = getRequiredEnv('SMTP_USER');
  const pass = getRequiredEnv('SMTP_PASS');

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return cachedTransporter;
};

const buildLineItemsHtml = lineItems =>
  lineItems
    .map(item => {
      const description = item.description ? `<div style="font-size:12px;color:#6c7280;margin-top:4px;">${escapeHtml(item.description)}</div>` : '';
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ece7df;">
            <div style="font-weight:600;color:#2d2d2d;">${escapeHtml(item.name)}</div>
            ${description}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #ece7df;text-align:center;color:#4a4a4a;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ece7df;text-align:right;color:#2d2d2d;font-weight:600;">${formatMoney(item.totalCents)}</td>
        </tr>
      `;
    })
    .join('');

const buildLineItemsText = lineItems =>
  lineItems
    .map(item => {
      const details = item.description ? `\n   ${item.description}` : '';
      return `- ${item.name} x${item.quantity} — ${formatMoney(item.totalCents)}${details}`;
    })
    .join('\n');

const buildOrderEmail = ({ customerFirstName, fulfillmentMethod, lineItems, subtotalCents, shippingCents, totalCents }) => {
  const pickup = fulfillmentMethod === 'pickup';
  const heading = pickup ? 'Your Mitten Makes order is in.' : 'Your Mitten Makes order is on the list.';
  const fulfillmentCopy = pickup
    ? 'You chose free local pickup. I’ll follow up when it’s ready and share the pickup details from Farmington Hills.'
    : 'You chose shipping. I’ll get everything printed, packed, and on the way as soon as it’s ready.';
  const shippingRow = pickup
    ? ''
    : `
      <tr>
        <td style="padding:10px 0;color:#6c7280;">Shipping</td>
        <td style="padding:10px 0;text-align:right;color:#2d2d2d;font-weight:600;">${formatMoney(shippingCents)}</td>
      </tr>
    `;

  const html = `
    <div style="margin:0;padding:0;background:#faf9f6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
        <div style="background:#D85A30;color:#fff;padding:20px 24px;border-radius:18px 18px 0 0;">
          <div style="font-size:12px;letter-spacing:0.22em;font-weight:700;">MITTEN MAKES</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.1;">${heading}</h1>
        </div>
        <div style="background:#fff;border:1px solid #efe8de;border-top:0;border-radius:0 0 18px 18px;padding:24px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hi ${escapeHtml(customerFirstName || 'there')}, thanks so much for your order with Mitten Makes.</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4f5663;">${fulfillmentCopy}</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#4f5663;">Because every piece is made to order, exact color placement and filament blends can vary a little from the listing photos. If anything needs clarification before I print, I’ll reach out by email.</p>

          <table role="presentation" style="width:100%;border-collapse:collapse;margin:24px 0;">
            <thead>
              <tr>
                <th style="text-align:left;padding-bottom:8px;font-size:12px;letter-spacing:0.12em;color:#8a6f64;">ITEM</th>
                <th style="text-align:center;padding-bottom:8px;font-size:12px;letter-spacing:0.12em;color:#8a6f64;">QTY</th>
                <th style="text-align:right;padding-bottom:8px;font-size:12px;letter-spacing:0.12em;color:#8a6f64;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${buildLineItemsHtml(lineItems)}
            </tbody>
          </table>

          <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:8px;">
            <tr>
              <td style="padding:10px 0;color:#6c7280;">Merchandise subtotal</td>
              <td style="padding:10px 0;text-align:right;color:#2d2d2d;font-weight:600;">${formatMoney(subtotalCents)}</td>
            </tr>
            ${shippingRow}
            <tr>
              <td style="padding:12px 0 0;color:#2d2d2d;font-weight:700;">Order total</td>
              <td style="padding:12px 0 0;text-align:right;color:#2d2d2d;font-weight:700;">${formatMoney(totalCents)}</td>
            </tr>
          </table>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #efe8de;font-size:13px;line-height:1.7;color:#6c7280;">
            <div>Questions? Reply to this email or reach me at <a href="mailto:mittenmakes@gmail.com" style="color:#D85A30;text-decoration:none;">mittenmakes@gmail.com</a>.</div>
            <div style="margin-top:6px;">Made to order in Farmington Hills, MI.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Hi ${customerFirstName || 'there'},`,
    '',
    'Thanks so much for your order with Mitten Makes.',
    pickup
      ? 'You chose free local pickup. I’ll follow up when it’s ready and share the pickup details from Farmington Hills.'
      : 'You chose shipping. I’ll get everything printed, packed, and on the way as soon as it’s ready.',
    "Because every piece is made to order, exact color placement and filament blends can vary a little from the listing photos. If anything needs clarification before I print, I’ll reach out by email.",
    '',
    'Order details:',
    buildLineItemsText(lineItems),
    '',
    `Merchandise subtotal: ${formatMoney(subtotalCents)}`,
    pickup ? '' : `Shipping: ${formatMoney(shippingCents)}`,
    `Order total: ${formatMoney(totalCents)}`,
    '',
    'Questions? Reply to this email or reach me at mittenmakes@gmail.com.',
    'Made to order in Farmington Hills, MI.'
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
};

const sendOrderConfirmationEmail = async ({
  to,
  customerName,
  fulfillmentMethod,
  lineItems,
  subtotalCents,
  shippingCents,
  totalCents
}) => {
  const transporter = getTransporter();
  const from = process.env.ORDER_FROM_EMAIL || getRequiredEnv('SMTP_USER');
  const replyTo = process.env.ORDER_REPLY_TO_EMAIL || getRequiredEnv('SMTP_USER');
  const ownerInbox = process.env.ORDER_NOTIFICATION_EMAIL || '';
  const customerFirstName = String(customerName || '').trim().split(/\s+/)[0];
  const subject = 'Thanks for your Mitten Makes order';
  const { html, text } = buildOrderEmail({
    customerFirstName,
    fulfillmentMethod,
    lineItems,
    subtotalCents,
    shippingCents,
    totalCents
  });

  await transporter.sendMail({
    from,
    to,
    bcc: ownerInbox || undefined,
    replyTo,
    subject,
    html,
    text
  });
};

module.exports = {
  sendOrderConfirmationEmail,
  getRequiredEnv,
  formatMoney
};
