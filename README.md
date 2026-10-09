# Modlify — 3D Print Shop Website

A static storefront for selling 3D printed items, with a dedicated **custom order** section. Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Features

The site has five tabs across the top: **Home**, **Shop**, **Custom**, **Cart** and **Orders**.

- **Home**: featured products, a link to custom items, and the FAQ
- **Shop**: product grid with category filters, search and sorting; tap a product for details, colour and quantity
- **Custom**: a form to design a custom item (name, description, files, size, quantity, material, colour, finish, deadline) with a live price that adds the item straight to the cart
- **Cart**: every item with its description, chosen options and price, plus the checkout form
- **Orders**: every order placed on this device, with items, prices, date and shipping details
- **Shop owner page**: linked as "Shop owner" in the footer and protected by a PIN (`STORE.ownerPin` in `js/products.js`). Once unlocked:
  - every product card in Featured and Shop gets an **Edit** button
  - change any product's photo (chosen from Photos on a phone), name, price, category, description, details, colours, badge and whether it's featured
  - add or delete products
  - change the home page banner picture

### Sales tax

Checkout asks for the customer's state. Orders shipped within `STORE.salesTax.state` (Florida) get `STORE.salesTax.rate` (7%: 6% state plus Miami-Dade's 1% surtax) on the items, not on shipping. The tax appears in the cart, the order email, the Orders tab and the PayPal amount.

### Getting paid

Under the owner PIN, **Get paid** stores the owner's PayPal.me name (never card details). Once it's published, checkout for shop-only orders shows a **Pay with PayPal** button that opens `paypal.me/<name>/<total>USD`, and each order in the Orders tab has the same link. Orders that include custom items don't get the button; the owner confirms the price by email first.

### Publishing changes

Owner edits are first saved only in that browser as unpublished changes. **Publish to website** sends them to GitHub using the contents API:

- each new photo is saved as a JPEG in `images/`
- the full product list and banner picture are saved to `data/shop.json`

GitHub Pages then rebuilds, and every visitor gets the new `data/shop.json` within a minute or two. When `data/shop.json` exists it replaces the built-in `PRODUCTS` in `js/products.js`.

Publishing needs a one-time GitHub fine-grained personal access token with **Contents: Read and write** on this repository only. The owner page explains how to make one. The token is stored in that browser's localStorage. The PIN only hides the page from casual visitors; the token is what actually protects the repository.

The code avoids recent JavaScript syntax so it runs on older phones and browsers.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Customise

Everything store-specific lives in **`js/products.js`**:

- `STORE` — currency, shipping price, free-shipping threshold, contact email, form endpoint
- `COLORS` — the filament colours you offer
- `CATEGORIES` / `PRODUCTS` — your catalogue. Set `image: "images/photo.jpg"` on a product to use a real photo instead of the built-in illustration.

Custom-order pricing rules for the estimate are at the top of the custom form section in `js/app.js` (`SIZE_BASE`, `MATERIAL_MULT`, `FINISH_MULT`, `DESIGN_FEE`).

### Receiving orders

There's no backend or payment processor. By default, submitting a checkout or custom order opens the customer's email app with the details filled in, addressed to `STORE.contactEmail`.

To receive submissions directly, create a form endpoint (e.g. [Formspree](https://formspree.io)) and set `STORE.formEndpoint` — orders and quote requests will be POSTed to it as JSON. Note that uploaded files are listed by name only; to accept the files themselves, use a form service that supports file uploads or ask customers to email them.

For real card payments, connect a provider such as Stripe Payment Links, Shopify Buy Button or Snipcart.

## Updating the site

GitHub Pages and browsers keep copies of files for a few minutes. Run `./bump-version.sh` before committing changes to `css/` or `js/`. It gives the file links in `index.html` a new `?v=` number, so visitors get the new files straight away.

## Deploy

Any static host works: GitHub Pages (Settings → Pages → deploy from this branch), Netlify or Vercel.
