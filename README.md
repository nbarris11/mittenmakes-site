# Mitten Makes — Storefront

The website for **Mitten Makes**, a Metro Detroit 3D-printing gift business.
Static HTML/CSS pages with a real cart and Stripe checkout, running on Vercel.
No framework and no build step — files are served exactly as they sit in the repo.

> Working on this with Claude Code? See [`CLAUDE.md`](CLAUDE.md) for the full project guide.

## Stack

- **Hosting:** Vercel — **every push to `main` auto-deploys to production.**
- **Domain:** [mittenmakes.com](https://mittenmakes.com) (apex, see `CNAME`).
- **Payments:** Stripe Checkout via Vercel serverless functions in `api/`.
- **Email:** transactional confirmations via Nodemailer (`api/_lib/email.js`).
- **Analytics:** PostHog (reverse-proxied through `t.mittenmakes.com`), Vercel Analytics, Google tag.
- **Runtime:** Node 20 (serverless functions only). Front end is plain HTML/CSS/JS.

## Project structure

```
mittenmakes-site/
├── index.html              # Homepage (hero + bestsellers)
├── shop.html               # Shop with cart
├── gifts.html              # Paid-ad landing page
├── custom.html             # Custom-order inquiry
├── about.html / contact.html / returns-policy.html
├── styles.css              # All styling (single file, mobile-first)
├── shop-checkout.js        # Front-end cart + checkout logic
├── checkout-products.json  # ⭐ Product catalog — source of truth for prices/options/shipping
├── api/                    # Vercel serverless functions (Stripe)
│   ├── create-checkout-session.js   # Cart → Stripe Checkout session
│   ├── create-custom-payment.js     # Custom-amount payment link generator
│   ├── pay.js                       # /pay?id=cs_… → redirect to Stripe
│   ├── stripe-webhook.js            # Webhook → confirmation email
│   └── _lib/email.js
├── assets/                 # Images, logos, favicons
├── products/, blog/, gift-finder/
├── <seo-landing-pages>/    # Local-SEO pages (see below)
├── sitemap.xml, robots.txt, vercel.json, CNAME
└── CLAUDE.md               # Guide for AI/contributors
```

## Editing products & prices

`checkout-products.json` is the **source of truth**. The shop front end and the checkout API both read from it, so edit the catalog — not just the HTML card — or prices and validation will drift.

A standard product entry:

```json
{
  "id": "void-octopus",
  "name": "Void Octopus",
  "priceCents": 1500,
  "priceLabel": "$15.00",
  "image": "assets/void-octopus-cinderwing.png?v=20260403a",
  "description": "Standard ready-to-order version.",
  "simpleAddToCart": true
}
```

- `priceCents` is what Stripe charges; `priceLabel` is the displayed string — **keep them in sync.**
- `image` paths carry a `?v=` cache-buster — bump it when you replace an image.
- Some products add a `customization` block (e.g. golf-ball holders, bookmarks) with allowed colors/options that the API validates.
- Shipping lives at the top of the file: `$5` flat, free over `$45` (`shippingCents` / `freeShippingThresholdCents`).

## Local-SEO landing pages

Folders like `custom-3d-printing-metro-detroit/`, `personalized-gifts-metro-detroit/`, and `farmington-hills-3d-printing/` are standalone location/keyword pages. Each is an `index.html` with its own `<title>`, meta description, canonical, and JSON-LD. Add new ones to `sitemap.xml`.

## Brand system

| Token | Value | Use |
|---|---|---|
| Coral | `#D85A30` | primary buttons, accents, logo |
| Dark Coral | `#993C1D` | hover states |
| Blush | `#FAECE7` | light backgrounds |
| Charcoal | `#2C2C2A` | primary text |
| Linen | `#F1EFE8` | page background |

- **Headings/logo:** Playfair Display. **Body:** Inter.
- **Voice:** playful but premium, Michigan-proud, handmade.
- **Tagline:** *"Made in Michigan, one layer at a time."*

## Deploying

Push to `main`. Vercel builds and deploys automatically. There is no build command and no local build step.

Required Vercel environment variables: `STRIPE_SECRET_KEY`, the Stripe webhook signing secret, and the email credentials used by `api/_lib/email.js`. Never commit secrets or `.env`.

---

**Made with ♥ in Michigan, one layer at a time.**
