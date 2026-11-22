/* Receives the site's request forms and emails them to the shop inbox.
   Called by /form-submit.js. On any error other than a 400 the browser re-sends the form
   through FormSubmit, so failing loudly here is safe and silently dropping is not. */
const { getTransporter, getRequiredEnv } = require('./_lib/email');

const INBOX = 'mittenmakes@gmail.com';

const FORMS = {
  order: {
    subject: 'New Mitten Makes order inquiry',
    reply: 'Thanks for reaching out to Mitten Makes. We got your inquiry and will follow up soon with next steps.'
  },
  holiday: {
    subject: 'Holiday order inquiry - Mitten Makes',
    reply: 'Thanks for reaching out to Mitten Makes. We got your holiday inquiry and will follow up soon with next steps.'
  },
  contact: {
    subject: 'New Mitten Makes contact request',
    reply: 'Thanks for reaching out to Mitten Makes. We got your message and will follow up soon.'
  },
  'gift-finder': {
    subject: 'Gift Finder request from Mitten Makes',
    reply: 'Thanks for sending your Gift Finder ideas to Mitten Makes. We will follow up soon with the best print options.'
  }
};

const MAX_FIELDS = 40;
const MAX_FIELD_LENGTH = 5000;
const MAX_TOTAL_LENGTH = 20000;
const SEND_TIMEOUT_MS = 8000;
const REPLY_TIMEOUT_MS = 3000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_INSTANCE = 30;

// One plain address: no commas, brackets or whitespace that could add recipients or headers.
const EMAIL_PATTERN = /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

// Per warm instance only. This slows casual abuse; it is not a global limit.
const recent = new Map();
const countHit = key => {
  const now = Date.now();
  for (const [name, times] of recent) {
    if (now - times[times.length - 1] >= WINDOW_MS) recent.delete(name);
  }
  const times = (recent.get(key) || []).filter(time => now - time < WINDOW_MS);
  times.push(now);
  recent.set(key, times);
  return times.length;
};

const isSameOrigin = req => {
  try {
    return new URL(req.headers.origin).host === (req.headers['x-forwarded-host'] || req.headers.host);
  } catch {
    return false;
  }
};

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Email timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const readFields = raw => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const entries = Object.entries(raw);
  if (entries.length > MAX_FIELDS) return null;

  const fields = new Map();
  let total = 0;
  for (const [name, value] of entries) {
    if (!/^[a-z][a-z0-9_]{0,50}$/i.test(name) || typeof value !== 'string' || value.length > MAX_FIELD_LENGTH) return null;
    total += value.length;
    if (total > MAX_TOTAL_LENGTH) return null;
    if (value.trim()) fields.set(name, value.trim());
  }
  return fields;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ error: 'Forbidden.' });

  try {
    const { form, fields: rawFields, honey } = req.body || {};
    if (honey) return res.status(200).json({ ok: true });

    const config = Object.prototype.hasOwnProperty.call(FORMS, form) ? FORMS[form] : null;
    const fields = readFields(rawFields);
    if (!config || !fields) {
      return res.status(422).json({ error: 'That form could not be read.' });
    }

    const email = fields.get('email') || '';
    if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
      return res.status(400).json({ error: 'Please check your email address and send again.' });
    }
    if (!email && !fields.get('phone')) {
      return res.status(400).json({ error: 'Add an email or phone number so we can reply.' });
    }

    const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    if (countHit(`ip:${ip}`) > MAX_PER_IP || countHit('all') > MAX_PER_INSTANCE) {
      return res.status(429).json({ error: 'Too many requests.' });
    }

    const transporter = getTransporter();
    const from = process.env.ORDER_FROM_EMAIL || getRequiredEnv('SMTP_USER');

    // Plain text only, so nothing a visitor types is rendered as HTML in the inbox.
    const text = Array.from(fields, ([name, value]) => `${name.replace(/_/g, ' ')}:\n${value}`).join('\n\n');

    await withTimeout(transporter.sendMail({
      from,
      to: INBOX,
      replyTo: email || undefined,
      subject: config.subject,
      text
    }), SEND_TIMEOUT_MS);

    // The auto-reply never repeats visitor input, and each address gets one per window,
    // so this endpoint can't be used to send someone else's words from the shop's address.
    if (email && countHit(`to:${email.toLowerCase()}`) === 1) {
      try {
        await withTimeout(transporter.sendMail({
          from,
          to: email,
          replyTo: INBOX,
          subject: 'We got your message - Mitten Makes',
          text: `${config.reply}\n\nMitten Makes\n(248) 291-7642\nhttps://www.mittenmakes.com`
        }), REPLY_TIMEOUT_MS);
      } catch (error) {
        console.error('Form auto-reply failed:', error.code || error.name);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Form email failed:', error.code || error.message);
    return res.status(502).json({ error: 'The message could not be sent.' });
  }
};
