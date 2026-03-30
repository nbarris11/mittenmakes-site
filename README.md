# Mitten Makes — Static Website

A beautiful, hand-crafted static website for Mitten Makes 3D printing business. Built with pure HTML, CSS, and custom SVG logos. Premium design, no frameworks, no build step.

## 📂 Project Structure

```
mittenmakes-site/
├── index.html          # Homepage with hero and product categories
├── shop.html           # Shop page with product grid
├── about.html          # About page with brand story
├── styles.css          # All styling (responsive, mobile-first)
├── netlify.toml        # Netlify deployment config
└── README.md           # This file
```

## 🎨 Design System

### Colors
- **Primary Coral:** `#D85A30` — buttons, accents, logo
- **Dark Coral:** `#993C1D` — hover states
- **Light Blush:** `#FAECE7` — light backgrounds
- **Charcoal:** `#2C2C2A` — primary text
- **Linen:** `#F1EFE8` — page background
- **White:** `#ffffff` — cards, nav

### Typography
- **Headings:** Playfair Display (serif, bold)
- **Body Text:** Inter (sans-serif)
- **Logo:** Playfair Display (Georgia fallback)

### Logo System
Three inline SVG logos used throughout:

1. **Full Logo** (hero, about): Stacked mitten + text (200px)
2. **Icon Mark** (favicon): MM monogram (40px)
3. **Horizontal Lockup** (nav, footer): Icon + text side-by-side

## 🚀 Deployment to Netlify

### Option 1: Drag & Drop (Easiest)

1. Go to **[netlify.com](https://netlify.com)** and log in (or create a free account)
2. Drag the entire `mittenmakes-site/` folder directly into the Netlify drop zone
3. Your site is live immediately at a Netlify subdomain
4. Copy the deploy URL to share

### Option 2: Git-Based Deployment

1. Push this folder to a GitHub repository
2. On Netlify, click **New site from Git**
3. Choose GitHub, authorize, and select your repo
4. Configure:
   - Build command: (leave empty)
   - Publish directory: `/` (root)
5. Click **Deploy site**
6. Netlify auto-deploys on every push

### Option 3: CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from project directory
netlify deploy --prod

# Follow the prompts to authorize and deploy
```

## 🔗 Connect Your Custom Domain (mittenmakes.com via Namecheap)

Once your site is live on Netlify:

### 1. In Netlify Dashboard
- Go to **Site settings** → **Domain management**
- Click **Add custom domain**
- Enter `mittenmakes.com`
- Click **Verify** (Netlify will confirm ownership)

### 2. Update DNS on Namecheap
- Log into **[namecheap.com](https://namecheap.com)**
- Go to **Domain List** → `mittenmakes.com`
- Click **Manage**
- Go to **Advanced DNS** tab
- Find the **CNAME Record** section
- Add records as suggested by Netlify (usually looks like):
  ```
  Type: CNAME
  Host: www
  Value: mittenmakes.netlify.app (provided by Netlify)
  ```
- Also add an **A Record** for the root domain:
  ```
  Type: A
  Host: @
  Value: 75.2.60.5 (or IP provided by Netlify)
  ```
- Save changes (may take 24–48 hours to fully propagate)

### 3. Netlify Settings
- Once DNS is set, go back to Netlify
- Site settings should show `mittenmakes.com` as primary domain
- Request SSL certificate (free with Netlify)

**Pro tip:** Use `www.mittenmakes.com` as your primary domain in Netlify, then set up a redirect from the apex (`mittenmakes.com`) to `www`.

## 📝 Editing Products

### Add a New Product

Edit `shop.html`. Find the product grid and duplicate any `<div class="product-card">` block:

```html
<div class="product-card">
    <div class="product-accent"></div>
    <h3 class="product-name">Product Name</h3>
    <p class="product-description">Product description here.</p>
    <p class="product-price">$15–25</p>
    <a href="mailto:mittenmakes@gmail.com?subject=Request:%20Product%20Name" class="btn btn-secondary">Request this</a>
</div>
```

Change the `subject` parameter in the mailto link to your product name.

### Edit Product Categories

The homepage shows 4 product categories in "What we make" section. Edit `index.html`:

```html
<div class="category-card">
    <h3>Category Name</h3>
    <p>Description of the category.</p>
    <p class="price-range">$X–Y</p>
</div>
```

### Update Contact Email

Search `mittenmakes@gmail.com` in all HTML files and replace with your actual email address.

## 🎯 Brand Details

- **Business Name:** Mitten Makes
- **Tagline:** "Made in Michigan, one layer at a time."
- **Location:** Metro Detroit, Michigan
- **Instagram:** @mittenmakes
- **Domain:** mittenmakes.com
- **Vibe:** Playful but premium, Michigan-proud, handmade craft

## 🛠️ Customization Tips

### Change Colors
Edit the CSS variables in `styles.css`. Search for hex codes:
- `#D85A30` (primary coral) → replace with your color
- `#993C1D` (dark coral) → hover state
- All other brand colors defined at the top

### Update Footer
Edit the footer in all pages (appears at bottom of `index.html`, `shop.html`, `about.html`)

### Add More Pages
Create a new `.html` file, copy the nav/footer structure from an existing page, and add a new nav link.

## 📱 Responsive Design

- **Desktop:** 3-column product grid
- **Tablet (768px):** 2 columns
- **Mobile:** 1 column, stacked layout
- Nav collapses responsively
- All text scales appropriately

## 🔍 SEO & Meta Tags

Update in each HTML `<head>`:
- `<title>` — Page title (appears in browser tab)
- `<meta name="description">` — Add for better search results
- `<meta name="theme-color">` — Brand color for browser UI

## 🚀 Performance

- Pure HTML/CSS (no JavaScript)
- Inline SVG logos (no extra requests)
- ~50KB total size (uncompressed)
- Fast loading, excellent Lighthouse scores
- Static site = fast, secure, and reliable

## 📞 Support & Questions

- **Netlify Help:** [docs.netlify.com](https://docs.netlify.com)
- **Namecheap Support:** [namecheap.com/support](https://namecheap.com/support)
- **DNS Propagation Check:** [whatsmydns.net](https://whatsmydns.net)

---

**Made with ♥️ in Michigan, one layer at a time.**
