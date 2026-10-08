(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: STORE.currency });
  const fmt = (n) => money.format(n);

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable — cart just won't persist */
      }
    },
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ---------- Mobile nav ---------- */
  const menuBtn = $("#menu-btn");
  const nav = $("#main-nav");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Tabs ---------- */
  // Each tab is a [data-view] block; the URL hash picks which one is shown.
  // A hash naming an element inside a tab (e.g. #faq) opens that tab and scrolls to it.
  const VIEWS = $$("[data-view]").map((v) => v.dataset.view);
  const VIEW_TITLES = { home: "Home", shop: "Shop", custom: "Custom Orders", cart: "Cart" };
  const baseTitle = document.title;

  function route() {
    const hash = decodeURIComponent(location.hash.slice(1));
    let view = VIEWS.includes(hash) ? hash : "home";
    let target = null;
    if (hash && !VIEWS.includes(hash)) {
      target = document.getElementById(hash);
      const owner = target && target.closest("[data-view]");
      if (owner) view = owner.dataset.view;
    }
    $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== view));
    $$("[data-nav]").forEach((a) => {
      const on = a.dataset.nav === view;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = view === "home" ? baseTitle : `${VIEW_TITLES[view]} · ${baseTitle}`;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.addEventListener("hashchange", route);
  // Clicking the tab you're already on doesn't fire hashchange, so re-run the route to jump back to its top.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href") === location.hash) route();
  });

  /* ---------- Shop ---------- */
  const state = { category: "all", query: "", sort: "featured" };

  function renderFilters() {
    $("#filters").innerHTML = CATEGORIES.map(
      (c) =>
        `<button class="filter${c.id === state.category ? " active" : ""}" role="tab" aria-selected="${c.id === state.category}" data-cat="${c.id}">${c.label}</button>`
    ).join("");
  }

  function visibleProducts() {
    const q = state.query.trim().toLowerCase();
    let list = PRODUCTS.filter(
      (p) =>
        (state.category === "all" || p.category === state.category) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    );
    if (state.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (state.sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderProducts() {
    const list = visibleProducts();
    $("#empty-state").hidden = list.length > 0;
    $("#product-grid").innerHTML = list.map(cardHtml).join("");
  }

  function renderFeatured() {
    $("#featured-grid").innerHTML = PRODUCTS.filter((p) => p.badge).slice(0, 4).map(cardHtml).join("");
  }

  function cardHtml(p) {
        const cat = CATEGORIES.find((c) => c.id === p.category);
        return `
        <article class="card" data-id="${p.id}">
          <button class="card-media" data-open="${p.id}" aria-label="View ${p.name}">
            ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
            ${productArt(p, p.colors[0])}
          </button>
          <div class="card-body">
            <p class="card-cat">${cat ? cat.label : ""}</p>
            <h3><button class="link-btn" data-open="${p.id}">${p.name}</button></h3>
            <div class="card-swatches" aria-label="Available colours">
              ${p.colors.map((k) => `<span style="background:${COLORS[k].hex}" title="${COLORS[k].name}"></span>`).join("")}
            </div>
            <div class="card-foot">
              <span class="price">${fmt(p.price)}</span>
              <button class="btn btn-small" data-quick-add="${p.id}">Add to cart</button>
            </div>
          </div>
        </article>`;
  }

  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderFilters();
    renderProducts();
  });
  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderProducts();
  });
  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderProducts();
  });
  const onGridClick = (e) => {
    const open = e.target.closest("[data-open]");
    if (open) return openProduct(open.dataset.open);
    const add = e.target.closest("[data-quick-add]");
    if (add) {
      const p = PRODUCTS.find((x) => x.id === add.dataset.quickAdd);
      addToCart(p.id, p.colors[0], 1);
    }
  };
  $("#product-grid").addEventListener("click", onGridClick);
  $("#featured-grid").addEventListener("click", onGridClick);

  /* ---------- Modals ---------- */
  let lastFocus = null;
  function openModal(el) {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => el.classList.add("show"));
    const focusable = el.querySelector("button, input, select, textarea, a[href]");
    if (focusable) focusable.focus();
  }
  function closeModal(el) {
    el.classList.remove("show");
    el.hidden = true;
    if (!$$(".modal").some((m) => !m.hidden)) {
      document.body.classList.remove("no-scroll");
    }
    if (lastFocus) lastFocus.focus();
  }
  $$(".modal").forEach((m) => {
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest("[data-close]")) closeModal(m);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    $$(".modal").filter((m) => !m.hidden).forEach(closeModal);
  });

  /* ---------- Product modal ---------- */
  const modal = $("#product-modal");
  let current = { product: null, color: null };

  function setModalColor(key) {
    current.color = key;
    $("#modal-media").innerHTML = productArt(current.product, key);
    $("#modal-color-name").textContent = COLORS[key].name;
    $$("#modal-swatches button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.color === key)));
  }

  function openProduct(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    current.product = p;
    const cat = CATEGORIES.find((c) => c.id === p.category);
    $("#modal-cat").textContent = cat ? cat.label : "";
    $("#modal-title").textContent = p.name;
    $("#modal-price").textContent = fmt(p.price);
    $("#modal-desc").textContent = p.description;
    $("#modal-specs").innerHTML = p.specs.map((s) => `<li>${s}</li>`).join("");
    $("#modal-swatches").innerHTML = p.colors
      .map(
        (k) =>
          `<button type="button" class="swatch" data-color="${k}" style="--sw:${COLORS[k].hex}" aria-label="${COLORS[k].name}" aria-pressed="false"></button>`
      )
      .join("");
    $("#modal-qty").value = 1;
    setModalColor(p.colors[0]);
    openModal(modal);
  }

  $("#modal-swatches").addEventListener("click", (e) => {
    const b = e.target.closest("[data-color]");
    if (b) setModalColor(b.dataset.color);
  });
  const qtyInput = $("#modal-qty");
  const clampQty = (n) => Math.min(20, Math.max(1, Math.round(Number(n)) || 1));
  $("#qty-minus").addEventListener("click", () => (qtyInput.value = clampQty(qtyInput.value - 1)));
  $("#qty-plus").addEventListener("click", () => (qtyInput.value = clampQty(+qtyInput.value + 1)));
  qtyInput.addEventListener("change", () => (qtyInput.value = clampQty(qtyInput.value)));
  $("#modal-add").addEventListener("click", () => {
    addToCart(current.product.id, current.color, clampQty(qtyInput.value));
    closeModal(modal);
  });

  /* ---------- Cart ---------- */
  let cart = storage.get("lw3d-cart", []).filter((i) => PRODUCTS.some((p) => p.id === i.id) && COLORS[i.color]);

  const lineKey = (id, color) => `${id}:${color}`;
  const subtotal = () => cart.reduce((s, i) => s + PRODUCTS.find((p) => p.id === i.id).price * i.qty, 0);
  const shipping = (sub) => (sub === 0 || sub >= STORE.freeShippingOver ? 0 : STORE.flatShipping);

  function saveCart() {
    storage.set("lw3d-cart", cart);
    renderCart();
  }

  function addToCart(id, color, qty) {
    const existing = cart.find((i) => lineKey(i.id, i.color) === lineKey(id, color));
    if (existing) existing.qty = Math.min(20, existing.qty + qty);
    else cart.push({ id, color, qty });
    saveCart();
    const p = PRODUCTS.find((x) => x.id === id);
    toast(`Added ${p.name} (${COLORS[color].name}) to cart`);
    const btn = $("#cart-open");
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  }

  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    $("#cart-count").textContent = count;
    $("#cart-count").classList.toggle("visible", count > 0);
    $$("[data-cart-count]").forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
    $("#cart-layout").classList.toggle("is-empty", cart.length === 0);

    const body = $("#cart-items");
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p><a href="#shop" class="btn btn-primary">Browse products</a></div>`;
    } else {
      body.innerHTML = cart
        .map((i) => {
          const p = PRODUCTS.find((x) => x.id === i.id);
          return `
          <div class="cart-line" data-key="${lineKey(i.id, i.color)}">
            <div class="cart-thumb">${productArt(p, i.color)}</div>
            <div class="cart-info">
              <p class="cart-name">${p.name}</p>
              <p class="cart-meta">${COLORS[i.color].name} · ${fmt(p.price)}</p>
              <div class="qty qty-small">
                <button type="button" data-dec aria-label="Decrease quantity">−</button>
                <span>${i.qty}</span>
                <button type="button" data-inc aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div class="cart-right">
              <p>${fmt(p.price * i.qty)}</p>
              <button class="link-btn remove" data-remove>Remove</button>
            </div>
          </div>`;
        })
        .join("");
    }

    const sub = subtotal();
    const ship = shipping(sub);
    $("#cart-subtotal").textContent = fmt(sub);
    $("#cart-shipping").textContent = ship === 0 && sub > 0 ? "Free" : fmt(ship);
    $("#cart-total").textContent = fmt(sub + ship);
    const remaining = STORE.freeShippingOver - sub;
    $("#ship-note").textContent =
      sub === 0 ? "" : remaining > 0 ? `Add ${fmt(remaining)} more for free shipping.` : "You've unlocked free shipping!";
  }

  $("#cart-items").addEventListener("click", (e) => {
    const line = e.target.closest(".cart-line");
    if (!line) return;
    const item = cart.find((i) => lineKey(i.id, i.color) === line.dataset.key);
    if (e.target.closest("[data-inc]")) item.qty = Math.min(20, item.qty + 1);
    else if (e.target.closest("[data-dec]")) item.qty -= 1;
    else if (e.target.closest("[data-remove]")) item.qty = 0;
    else return;
    cart = cart.filter((i) => i.qty > 0);
    saveCart();
  });


  /* ---------- Sending orders & quotes ---------- */
  // Posts to STORE.formEndpoint if configured, otherwise opens a pre-filled email.
  async function send(subject, fields) {
    if (STORE.previewMode) return "preview";
    if (STORE.formEndpoint) {
      const res = await fetch(STORE.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: subject, ...fields }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return "sent";
    }
    const body = Object.entries(fields)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    window.location.href = `mailto:${STORE.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return "email";
  }

  function showMessage(title, html) {
    $("#message-title").textContent = title;
    $("#message-body").innerHTML = html;
    openModal($("#message-modal"));
  }

  /* ---------- Checkout ---------- */
  const checkoutForm = $("#checkout-form");
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = checkoutForm;
    if (!cart.length) return;
    if (!validate(form)) return;
    const data = Object.fromEntries(new FormData(form));
    const sub = subtotal();
    const ship = shipping(sub);
    const items = cart
      .map((i) => {
        const p = PRODUCTS.find((x) => x.id === i.id);
        return `${i.qty} x ${p.name} (${COLORS[i.color].name}) — ${fmt(p.price * i.qty)}`;
      })
      .join("; ");
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const how = await send(`New order from ${data.name}`, {
        ...data,
        items,
        shipping: fmt(ship),
        total: fmt(sub + ship),
      });
      cart = [];
      saveCart();
      form.reset();
      showMessage(
        "Thanks for your order!",
        how === "preview"
          ? `<p>This is a preview, so nothing was sent and no order was placed. On the live site this order would go to ${escapeHtml(STORE.contactEmail)}.</p>`
          : how === "sent"
          ? `<p>We've received your order and will email <strong>${escapeHtml(data.email)}</strong> a payment link shortly.</p>`
          : `<p>Your email app should open with your order details — just hit send and we'll reply with a payment link.</p>`
      );
    } catch (err) {
      toast("Sorry, something went wrong. Please try again.");
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Validation ---------- */
  function validate(form) {
    let ok = true;
    $$("[required]", form).forEach((el) => {
      const field = el.closest(".field");
      let msg = "";
      if (!el.value.trim()) msg = "This field is required.";
      else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) msg = "Enter a valid email address.";
      else if (el.minLength > 0 && el.value.trim().length < el.minLength) msg = `Please add a little more detail (at least ${el.minLength} characters).`;
      else if (el.type === "number" && (+el.value < +el.min || +el.value > +el.max)) msg = `Enter a number from ${el.min} to ${el.max}.`;
      let err = field.querySelector(".error");
      if (msg) {
        ok = false;
        if (!err) {
          err = document.createElement("p");
          err.className = "error";
          field.appendChild(err);
        }
        err.textContent = msg;
        field.classList.add("invalid");
      } else {
        if (err) err.remove();
        field.classList.remove("invalid");
      }
    });
    if (!ok) {
      const first = form.querySelector(".invalid input, .invalid select, .invalid textarea");
      if (first) first.focus();
    }
    return ok;
  }

  /* ---------- Custom order form ---------- */
  const customForm = $("#custom-form");
  const SIZE_BASE = { xs: 6, s: 12, m: 25, l: 45, xl: 80 };
  const MATERIAL_MULT = { pla: 1, petg: 1.2, tpu: 1.4, resin: 1.6, unsure: 1.1 };
  const FINISH_MULT = { standard: 1, sanded: 1.25, painted: 1.6 };
  const DESIGN_FEE = { design: 30, part: 15 };

  function updateEstimate() {
    const size = $("#c-size").value;
    const qty = Math.max(1, Math.min(500, Math.round(+$("#c-qty").value) || 1));
    const material = (customForm.querySelector("[name=material]:checked") || {}).value || "pla";
    const finish = $("#c-finish").value;
    const type = $("#c-type").value;
    if (!size) {
      $("#estimate-value").textContent = "$—";
      $("#estimate-note").textContent = "Fill in size, material and quantity to see a ballpark price. Your final quote may differ.";
      return;
    }
    const unit = SIZE_BASE[size] * MATERIAL_MULT[material] * FINISH_MULT[finish];
    const discount = qty >= 50 ? 0.8 : qty >= 10 ? 0.9 : 1;
    const total = unit * qty * discount + (DESIGN_FEE[type] || 0);
    const low = Math.max(5, Math.floor((total * 0.85) / 5) * 5);
    const high = Math.ceil((total * 1.2) / 5) * 5;
    $("#estimate-value").textContent = `${fmt(low)} – ${fmt(high)}`;
    const notes = [];
    if (discount < 1) notes.push(`${Math.round((1 - discount) * 100)}% bulk discount applied`);
    if (DESIGN_FEE[type]) notes.push(`includes ~${fmt(DESIGN_FEE[type])} design time`);
    notes.push("final quote may differ");
    $("#estimate-note").textContent = notes.join(" · ").replace(/^./, (c) => c.toUpperCase()) + ".";
  }
  customForm.addEventListener("input", updateEstimate);
  customForm.addEventListener("change", updateEstimate);

  // File upload list
  const fileInput = $("#c-file");
  const dropzone = $("#dropzone");
  const MAX_FILE = 25 * 1024 * 1024;
  function renderFiles() {
    $("#file-list").innerHTML = [...fileInput.files]
      .map((f) => {
        const big = f.size > MAX_FILE;
        const size = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(f.size / 1024)} KB`;
        return `<li class="${big ? "too-big" : ""}"><span>${escapeHtml(f.name)}</span><small>${size}${big ? " — too large" : ""}</small></li>`;
      })
      .join("");
  }
  fileInput.addEventListener("change", renderFiles);
  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) => dropzone.addEventListener(ev, () => dropzone.classList.remove("drag")));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      renderFiles();
    }
  });

  const deadline = $("#c-deadline");
  deadline.min = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);

  customForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate(customForm)) return;
    if ([...fileInput.files].some((f) => f.size > MAX_FILE)) {
      toast("One of your files is over 25 MB — please remove it or email it to us.");
      return;
    }
    const data = Object.fromEntries(new FormData(customForm));
    delete data.files;
    const fileNames = [...fileInput.files].map((f) => f.name);
    const labels = (id) => $(`#${id}`).selectedOptions[0].textContent;
    const fields = {
      name: data.name,
      email: data.email,
      request: labels("c-type"),
      description: data.description,
      size: labels("c-size"),
      quantity: data.quantity,
      material: data.material,
      colour: data.color,
      finish: labels("c-finish"),
      deadline: data.deadline || "Flexible",
      estimate: $("#estimate-value").textContent,
      files: fileNames.length ? fileNames.join(", ") : "None",
    };
    const btn = customForm.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const how = await send(`Custom print quote request from ${data.name}`, fields);
      const fileHint =
        fileNames.length && how === "email"
          ? `<p class="muted">Please attach your file${fileNames.length > 1 ? "s" : ""} (${escapeHtml(fileNames.join(", "))}) to the email before sending.</p>`
          : "";
      showMessage(
        "Quote request received!",
        how === "preview"
          ? `<p>This is a preview, so nothing was sent. On the live site this quote request would go to ${escapeHtml(STORE.contactEmail)}.</p>`
          : how === "sent"
          ? `<p>Thanks ${escapeHtml(data.name)}! We'll review your project and email <strong>${escapeHtml(data.email)}</strong> a firm quote within 24 hours.</p>`
          : `<p>Thanks ${escapeHtml(data.name)}! Your email app should open with your request filled in — hit send and we'll reply with a quote within 24 hours.</p>${fileHint}`
      );
      customForm.reset();
      renderFiles();
      updateEstimate();
    } catch {
      toast("Sorry, something went wrong. Please try again.");
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  renderFilters();
  renderProducts();
  renderFeatured();
  renderCart();
  route();
  updateEstimate();
})();
