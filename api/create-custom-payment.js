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

  try {
    const { amountCents, description, note } = req.body || {};

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
