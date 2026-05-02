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

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string' || !id.startsWith('cs_')) {
    return res.status(400).send('Invalid payment link.');
  }

  try {
    const stripeClient = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
    const session = await stripeClient.checkout.sessions.retrieve(id);

    if (!session.url) {
      return res.status(410).send('This payment link has expired or already been used.');
    }

    return res.redirect(303, session.url);
  } catch (error) {
    if (error.code === 'resource_missing') {
      return res.status(404).send('Payment link not found.');
    }
    return res.status(500).send('Could not load payment link. Try again.');
  }
};
