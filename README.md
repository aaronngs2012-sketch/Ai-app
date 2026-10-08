# Layerworks 3D — 3D Print Shop Website

A static storefront for selling 3D printed items, with a dedicated **custom order** section. Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Features

- **Shop** — product grid with category filters, search and sorting
- **Product details** — colour picker (preview updates live), quantity, specs
- **Cart** — slide-out drawer, saved in the browser, free-shipping threshold
- **Checkout** — collects name, email, address and notes, then sends the order to you
- **Custom orders** — project type, description, file upload (STL/OBJ/3MF/STEP/images), size, quantity, material, colour, finish and deadline, with an **instant price estimate**
- How-it-works steps, FAQ, responsive mobile layout and dark mode

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

## Deploy

Any static host works: GitHub Pages (Settings → Pages → deploy from this branch), Netlify or Vercel.
