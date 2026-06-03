# Mitten Makes — Project Guide for Claude

Storefront for **Mitten Makes**, a Metro Detroit 3D-printing gift business.
Static HTML/CSS site with Stripe checkout running on Vercel serverless functions.
No framework, no build step — files are served as-is.

## Stack & deployment

- **Hosting:** Vercel. Repo `nbarris11/mittenmakes-site` on GitHub; **every push to `main` auto-deploys.**
- **Domain:** `mittenmakes.com` (apex, see `CNAME`). Analytics proxied through `t.mittenmakes.com`.
- **Runtime:** Node 20 (serverless functions only). Deps: `stripe` ^20, `nodemailer` ^8.
- **No build:** edit HTML/CSS/JS directly. There is nothing to compile.
- ⚠️ The `README.md` is outdated (it describes Netlify + "no JavaScript"). Trust this file, not the README.

## Layout

- `index.html`, `shop.html`, `gifts.html`, `custom.html`, `about.html`, `contact.html`, etc. — top-level pages.
- `styles.css` — all styling, single file, mobile-first. Brand colors are CSS variables at the top.
- `shop-checkout.js` — front-end cart + checkout logic for the shop.
- `checkout-products.json` — **the product catalog / source of truth** for prices, customization options, shipping, and color choices. Both the front end and the checkout API read from it.
- `api/` — Vercel serverless functions (see below).
- `assets/`, `products/`, logos (`*.png`, `*.svg`).
- A large set of SEO landing-page folders (`custom-3d-printing-metro-detroit/`, `personalized-gifts-*/`, `farmington-hills-3d-printing/`, etc.) — programmatic local-SEO pages. `sitemap.xml` / `robots.txt` cover them.
- `blog/`, `gift-finder/`, `articulated-animals/` — content sections.
- `launch-lock.js` — retired launch countdown, intentionally a no-op. Leave in place; don't delete (older pages still include it).

## Payments (Stripe)

- `api/create-checkout-session.js` — builds a Stripe Checkout session from the cart, validating items/options against `checkout-products.json`.
- `api/create-custom-payment.js` — generates a one-off custom payment link. Used by the **private** `custom-payment.html` page to charge any custom amount.
- `api/pay.js` — resolves `/pay?id=cs_...` and 303-redirects to the live Stripe URL (the `/pay` rewrite is in `vercel.json`).
- `api/stripe-webhook.js` — handles Stripe webhooks; sends confirmation email via `api/_lib/email.js` (nodemailer).
- **Shipping rules** live in `checkout-products.json`: `$5` flat, free over `$45` (`shippingCents` / `freeShippingThresholdCents`).
- Secrets are env vars on Vercel (`STRIPE_SECRET_KEY`, webhook secret, email creds). **Never** hardcode keys or commit `.env`.

## Brand system

- **Colors:** Coral `#D85A30` (primary), Dark Coral `#993C1D` (hover), Blush `#FAECE7`, Charcoal `#2C2C2A` (text), Linen `#F1EFE8` (bg).
- **Fonts:** Playfair Display (headings/logo), Inter (body).
- **Voice:** playful but premium, Michigan-proud, handmade. Tagline: "Made in Michigan, one layer at a time."

## Conventions

- **Commits:** Conventional Commits with scopes, e.g. `feat(shop): ...`, `fix(checkout): ...`, `refactor(custom): ...`, `chore(copy): ...`.
- **Editing products/prices:** change `checkout-products.json` (the catalog), not just the HTML — the API validates against it.
- **Pricing must match** across the catalog, product cards, and any spotlight/featured sections (past bugs came from drift here).
- **Analytics:** PostHog is wired via the reverse proxy in `vercel.json`; keep the `t.mittenmakes.com` rewrites intact.

## Working agreements

- Pushing to `main` ships to production immediately — confirm before committing/pushing unless I've said go.
- This is not a git repo at the workspace root; the actual repo is this `mittenmakes-site/` folder.
- Prefer small, verifiable changes. There's no test suite — when a change is visual or interactive, verify it in the browser preview before claiming it works.
