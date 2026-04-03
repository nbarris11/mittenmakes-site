const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Resolve the checkout catalog relative to this serverless function so it works
// reliably in local development and when deployed on Vercel.
const CONFIG_PATH = path.join(__dirname, '..', 'checkout-products.json');

const readCheckoutConfig = () => JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const normalizeOptions = (product, rawOptions = null) => {
  const customization = product.customization;
  if (!customization) return rawOptions || null;

  if (customization.kind === 'golf-ball-holder') {
    const allowedColors = customization.colorOptions || [];
    const customWords = String(rawOptions?.customWords || '').trim().slice(0, customization.maxWords || 24);
    const primaryColor = allowedColors.includes(rawOptions?.primaryColor) ? rawOptions.primaryColor : '';
    const secondaryColor = allowedColors.includes(rawOptions?.secondaryColor) ? rawOptions.secondaryColor : '';

    if (!customWords || !primaryColor || !secondaryColor || primaryColor === secondaryColor) {
      return null;
    }

    return { customWords, primaryColor, secondaryColor };
  }

  return null;
};

const getRequiredEnv = name => {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}. Add it in your deployment settings before using Stripe checkout.`);
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
    return res.status(405).json({ error: 'Method not allowed. Use POST for checkout session creation.' });
  }

  try {
    // Use your platform secret key here. Vercel should provide this as an
    // environment variable so it never lives in client-side code.
    const stripeClient = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
    const checkoutConfig = readCheckoutConfig();
    const products = new Map(checkoutConfig.products.map(product => [product.id, product]));
    const minimumSubtotalCents = checkoutConfig.minimumSubtotalCents;
    const shippingCents = checkoutConfig.shippingCents;
    const finishStyleOptions = checkoutConfig.finishStyleOptions || [];
    const finishStyleMap = new Map(finishStyleOptions.map(option => [option.id, option]));
    const solidColorOptions = checkoutConfig.solidColorOptions || [];

    const { items, fulfillmentMethod } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Add ready-to-order items before checking out.' });
    }

    if (!['pickup', 'shipping'].includes(fulfillmentMethod)) {
      return res.status(400).json({ error: 'Choose local pickup or shipping before checking out.' });
    }

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.get(item.id);
      const quantity = Number(item.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 25) {
        return res.status(400).json({ error: 'One of the cart items is invalid. Refresh the page and try again.' });
      }

      const options = normalizeOptions(product, item.options);
      let optionDescription = '';
      let unitAmount = product.priceCents;

      if (product.customization) {
        if (!options) {
          return res.status(400).json({ error: `Add the custom words and two colors for ${product.name} before checking out.` });
        }

        optionDescription = ` Words: ${options.customWords}. Colors: ${options.primaryColor} + ${options.secondaryColor}.`;
      } else {
        const finishStyle = finishStyleMap.get(options?.finishStyle || 'solid');
        const noOptionsProvided = !options || Object.keys(options).length === 0;
        const solidColor = typeof options?.solidColor === 'string' && options.solidColor
          ? options.solidColor
          : (noOptionsProvided ? (solidColorOptions[0] || '') : '');

        if (!finishStyle) {
          return res.status(400).json({ error: `Choose a valid finish for ${product.name} before checking out.` });
        }

        if (finishStyle.id === 'solid' && !solidColorOptions.includes(solidColor)) {
          return res.status(400).json({ error: `Choose a solid color for ${product.name} before checking out.` });
        }

        unitAmount += finishStyle.priceDeltaCents || 0;
        optionDescription = finishStyle.id === 'solid'
          ? ` Finish: ${finishStyle.label}. Color: ${solidColor}.`
          : ` Finish: ${finishStyle.label}.`;
      }

      subtotal += unitAmount * quantity;
      normalizedItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
            description: `${product.description}${optionDescription} Made to order by Mitten Makes in Metro Detroit.`
          }
        },
        quantity
      });
    }

    if (subtotal < minimumSubtotalCents) {
      return res.status(400).json({
        error: `Online checkout starts at $${(minimumSubtotalCents / 100).toFixed(2)} in ready-to-order items before shipping.`
      });
    }

    const baseUrl = buildBaseUrl(req);
    // Start from the base session config shared by both pickup and shipping.
    const sessionConfig = {
      mode: 'payment',
      line_items: normalizedItems,
      billing_address_collection: 'auto',
      success_url: `${baseUrl}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop.html?checkout=cancelled#online-checkout`,
      metadata: {
        fulfillment_method: fulfillmentMethod,
        merchandise_subtotal_cents: String(subtotal)
      }
    };

    if (fulfillmentMethod === 'shipping') {
      // Shipping stays flat for now, so we provide a single built-in shipping
      // option to Stripe Checkout when the customer chooses shipping on-site.
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['US']
      };
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            display_name: 'Flat rate shipping',
            type: 'fixed_amount',
            fixed_amount: {
              amount: shippingCents,
              currency: 'usd'
            },
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3
              },
              maximum: {
                unit: 'business_day',
                value: 7
              }
            }
          }
        }
      ];
    }

    const session = await stripeClient.checkout.sessions.create(sessionConfig);
    return res.status(200).json({ url: session.url });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || 'Stripe checkout could not be created right now.'
    });
  }
};
