# Layerworks 3D — 3D Print Shop Website

A static storefront for selling 3D printed items, with a dedicated **custom order** section. Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Features

The site has five tabs across the top: **Home**, **Shop**, **Custom**, **Cart** and **Orders**.

- **Home**: featured products, a link to custom items, and the FAQ
- **Shop**: product grid with category filters, search and sorting; tap a product for details, colour and quantity
- **Custom**: a form to design a custom item (name, description, files, size, quantity, material, colour, finish, deadline) with a live price that adds the item straight to the cart
- **Cart**: every item with its description, chosen options and price, plus the checkout form
- **Orders**: every order placed on this device, with items, prices, date and shipping details
- **Shop owner page**: linked as "Shop owner" in the footer and protected by a PIN (`STORE.ownerPin`, default `1234`). Add products with a name, price, category, description, colours and an optional photo.

Products added on the owner page are stored in that browser only. To show them to all customers, use "Copy product list" and add the entries to `PRODUCTS` in `js/products.js`. The PIN only hides the page from casual visitors; it isn't real security.

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

## Deploy

Any static host works: GitHub Pages (Settings → Pages → deploy from this branch), Netlify or Vercel.
