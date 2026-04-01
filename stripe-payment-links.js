/*
  Phase 1 Stripe Payment Links for Mitten Makes

  How to use this file:
  1. In your Stripe Dashboard, create a Payment Link for a ready-to-order item.
  2. Paste the full https://buy.stripe.com/... URL into the matching product below.
  3. Save and deploy. The matching "Buy with Stripe" button will appear automatically on shop cards.

  Important:
  - Leave a value as an empty string to keep that product inquiry-first.
  - Use Payment Links only for fixed-price / ready-to-order versions of a product.
  - Keep custom, personalized, or variable-price items on the request form flow.
*/
window.MITTEN_STRIPE_PAYMENT_LINKS = {
  // Paste full Stripe Payment Link URLs below.
  "dual-color-star-fidget": "https://buy.stripe.com/fZu8wO5O04FtaXH8EP9k400",
  "blue-starfish-fidget": "https://buy.stripe.com/eVqaEWfoA6NB6HraMX9k401",
  "bun-slime-fidget": "https://buy.stripe.com/eVq14m3FS5Jx1n7cV59k402",
  "fidget-switch": "https://buy.stripe.com/bJe8wOgsE2xl9TDaMX9k403",
  "whale-shark": "https://buy.stripe.com/00w6oGcco9ZNaXHbR19k404",
  "cookie-dragon-keychain-figure": "https://buy.stripe.com/5kQ5kCa4gb3Re9TcV59k405",
  "penguin-articulated-keychain": "https://buy.stripe.com/14AaEW6S4dbZ7Lv8EP9k406",
  "elephant-articulated-keychain": "https://buy.stripe.com/14A9AS5O09ZNe9T8EP9k407",
  "bookmarks-3-pack": "https://buy.stripe.com/bJe00ifoA0pd0j3f3d9k408",
  "cable-monster-desk-helper": "",
  "flirty-heart-photo-card-display": "",
  "fleggy-flexi-egg-buddy": "",
  "tiny-t-rex": "",
  "crystal-dragon": "",
  "bone-dragon": "",
  "water-dragon": "",
  "cute-octopus": "https://buy.stripe.com/4gMfZg7W8c7Vgi1dZ99k409"
};

document.addEventListener('DOMContentLoaded', () => {
  const paymentLinks = window.MITTEN_STRIPE_PAYMENT_LINKS || {};

  Object.entries(paymentLinks).forEach(([cardId, url]) => {
    if (!url) return;

    const card = document.getElementById(cardId);
    const actions = card?.querySelector('.product-card-actions');
    if (!card || !actions) return;

    const existing = actions.querySelector('.btn-stripe');
    if (existing) return;

    const stripeButton = document.createElement('a');
    stripeButton.href = url;
    stripeButton.className = 'btn btn-primary btn-stripe';
    stripeButton.target = '_blank';
    stripeButton.rel = 'noopener noreferrer';
    stripeButton.textContent = 'Buy with Stripe';
    stripeButton.setAttribute('aria-label', `Buy ${card.querySelector('.product-name')?.textContent?.trim() || 'this item'} with Stripe`);

    actions.prepend(stripeButton);
  });

  const featuredActions = document.querySelector('.featured-gift-copy .order-actions');
  const featuredTitle = document.getElementById('featured-gift-title')?.textContent?.trim();
  const featuredCard = document.getElementById('dual-color-star-fidget');
  const featuredLink = paymentLinks['dual-color-star-fidget'];

  if (featuredActions && featuredTitle === 'Dual-Color Star Fidget' && featuredLink && !featuredActions.querySelector('.btn-stripe')) {
    const featuredStripeButton = document.createElement('a');
    featuredStripeButton.href = featuredLink;
    featuredStripeButton.className = 'btn btn-primary btn-stripe';
    featuredStripeButton.target = '_blank';
    featuredStripeButton.rel = 'noopener noreferrer';
    featuredStripeButton.textContent = 'Buy with Stripe';
    featuredStripeButton.setAttribute('aria-label', 'Buy Dual-Color Star Fidget with Stripe');

    const requestButton = featuredActions.querySelector('.btn.btn-primary');
    if (requestButton) {
      requestButton.classList.remove('btn-primary');
      requestButton.classList.add('btn-secondary');
    }

    featuredActions.prepend(featuredStripeButton);
  }
});
