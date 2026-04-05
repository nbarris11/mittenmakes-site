const Stripe = require('stripe');
const { sendOrderConfirmationEmail, getRequiredEnv } = require('./_lib/email');

const readRawBody = req =>
  new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const toLineItems = stripeLineItems =>
  stripeLineItems.map(item => ({
    name: item.description || item.price?.product?.name || 'Mitten Makes item',
    description: item.price?.product?.description || '',
    quantity: item.quantity || 1,
    totalCents: item.amount_total || 0
  }));

const alreadySentEmail = paymentIntent =>
  paymentIntent?.metadata?.mitten_order_email_sent === 'true';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed');
  }

  try {
    const stripeClient = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
    const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET');
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).send('Missing Stripe signature');
    }

    const rawBody = await readRawBody(req);
    const event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      return res.status(200).json({ received: true, ignored: true });
    }

    const session = event.data.object;

    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
      return res.status(200).json({ received: true, ignored: true });
    }

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    let paymentIntent = null;
    if (paymentIntentId) {
      paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      if (alreadySentEmail(paymentIntent)) {
        return res.status(200).json({ received: true, duplicate: true });
      }
    }

    const lineItemsResponse = await stripeClient.checkout.sessions.listLineItems(session.id, {
      limit: 25,
      expand: ['data.price.product']
    });

    const fulfillmentMethod = session.metadata?.fulfillment_method === 'shipping' ? 'shipping' : 'pickup';
    const totalCents = Number(session.amount_total || 0);
    const shippingCents = Number(session.total_details?.amount_shipping || 0);
    const subtotalCents = Number(session.metadata?.merchandise_subtotal_cents || totalCents - shippingCents);
    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerName = session.customer_details?.name || 'there';

    if (!customerEmail) {
      throw new Error('Stripe checkout completed without a customer email, so the confirmation email could not be sent.');
    }

    await sendOrderConfirmationEmail({
      to: customerEmail,
      customerName,
      fulfillmentMethod,
      lineItems: toLineItems(lineItemsResponse.data),
      subtotalCents,
      shippingCents,
      totalCents
    });

    if (paymentIntentId) {
      await stripeClient.paymentIntents.update(paymentIntentId, {
        metadata: {
          mitten_order_email_sent: 'true',
          mitten_order_email_event_id: event.id,
          mitten_order_email_sent_at: new Date().toISOString()
        }
      });
    }

    return res.status(200).json({ received: true, emailed: true });
  } catch (error) {
    console.error('Stripe webhook email flow failed:', error);
    return res.status(error.statusCode || 500).send(error.message || 'Webhook handling failed');
  }
};
