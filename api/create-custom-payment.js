const { createHash, timingSafeEqual } = require('crypto');
const Stripe = require('stripe');

const getRequiredEnv = name => {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}.`);
    error.statusCode = 500;
    throw error;
  }
  return value;
};

const MIN_SECRET_LENGTH = 24;

const sha256 = value => createHash('sha256').update(value).digest();

// Only the owner may create payment links. Hashing first gives timingSafeEqual equal-length inputs.
const getAuthFailure = req => {
  const secret = (process.env.CUSTOM_PAYMENT_SECRET || '').trim();
  if (secret.length < MIN_SECRET_LENGTH) {
    return { status: 503, error: 'Payment links are locked until CUSTOM_PAYMENT_SECRET is set in Vercel and the site is redeployed.' };
  }

  const header = req.headers.authorization;
  const given = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!timingSafeEqual(sha256(given), sha256(secret))) {
    return { status: 401, error: 'That access key is not right.' };
  }

  return null;
};

const buildBaseUrl = req => {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  // Must stay ahead of everything that reads the body or talks to Stripe.
  const authFailure = getAuthFailure(req);
  if (authFailure) return res.status(authFailure.status).json({ error: authFailure.error });

  try {
    const { amountCents, description, note: rawNote } = req.body || {};
    const note = typeof rawNote === 'string' ? rawNote : '';

    const amount = Number(amountCents);
    if (!Number.isInteger(amount) || amount < 50 || amount > 1000000) {
      return res.status(400).json({ error: 'Amount must be between $0.50 and $10,000.' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'A description is required.' });
    }

    const stripeClient = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
    const baseUrl = buildBaseUrl(req);

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: description.trim().slice(0, 200),
              description: note?.trim()
                ? `${note.trim().slice(0, 400)} — Handmade by Mitten Makes in Metro Detroit.`
                : 'Handmade by Mitten Makes in Metro Detroit.',
            },
          },
          quantity: 1,
        },
      ],
      billing_address_collection: 'auto',
      success_url: `${baseUrl}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        custom_order: 'true',
      },
    });

    return res.status(200).json({ url: `${baseUrl}/pay?id=${session.id}` });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Could not create payment link.' });
  }
};
