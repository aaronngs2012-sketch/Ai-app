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
    $("#product-grid").innerHTML = list
      .map((p) => {
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
      })
      .join("");
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
  $("#product-grid").addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) return openProduct(open.dataset.open);
    const add = e.target.closest("[data-quick-add]");
    if (add) {
      const p = PRODUCTS.find((x) => x.id === add.dataset.quickAdd);
      addToCart(p.id, p.colors[0], 1);
    }
  });

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
    if (!$$(".modal").some((m) => !m.hidden) && !drawer.classList.contains("open")) {
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
    if (drawer.classList.contains("open")) closeCart();
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
  const drawer = $("#cart-drawer");
  const overlay = $("#overlay");

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

    const body = $("#cart-items");
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p><a href="#shop" class="btn btn-outline" data-close-cart>Browse products</a></div>`;
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
    $("#checkout-btn").disabled = cart.length === 0;
  }

  $("#cart-items").addEventListener("click", (e) => {
    if (e.target.closest("[data-close-cart]")) return closeCart();
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

  function openCart() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("show"));
    document.body.classList.add("no-scroll");
    $("#cart-close").focus();
  }
  function closeCart() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("show");
    overlay.hidden = true;
    if (!$$(".modal").some((m) => !m.hidden)) document.body.classList.remove("no-scroll");
  }
  $("#cart-open").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  /* ---------- Sending orders & quotes ---------- */
  // Posts to STORE.formEndpoint if configured, otherwise opens a pre-filled email.
  async function send(subject, fields) {
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
  $("#checkout-btn").addEventListener("click", () => {
    if (!cart.length) return;
    closeCart();
    const sub = subtotal();
    const ship = shipping(sub);
    const lines = cart
      .map((i) => {
        const p = PRODUCTS.find((x) => x.id === i.id);
        return `<li><span>${i.qty} × ${p.name} <small>(${COLORS[i.color].name})</small></span><span>${fmt(p.price * i.qty)}</span></li>`;
      })
      .join("");
    showMessage(
      "Review your order",
      `<ul class="summary-list">${lines}</ul>
       <div class="totals">
         <div><span>Shipping</span><span>${ship === 0 ? "Free" : fmt(ship)}</span></div>
         <div class="total"><span>Total</span><span>${fmt(sub + ship)}</span></div>
       </div>
       <form id="checkout-form" class="checkout-form" novalidate>
         <div class="field"><label for="co-name">Full name</label><input id="co-name" name="name" autocomplete="name" required></div>
         <div class="field"><label for="co-email">Email</label><input id="co-email" type="email" name="email" autocomplete="email" required></div>
         <div class="field"><label for="co-address">Shipping address</label><textarea id="co-address" name="address" rows="3" autocomplete="street-address" required></textarea></div>
         <div class="field"><label for="co-notes">Order notes <span class="optional">(e.g. keychain name)</span></label><input id="co-notes" name="notes"></div>
         <button class="btn btn-primary btn-block" type="submit">Place order</button>
         <p class="form-note">We'll email a secure payment link to confirm your order.</p>
       </form>`
    );
    $("#message-modal .message-icon").hidden = true;
    $("#message-modal .modal-card > .btn").hidden = true;
  });

  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "checkout-form") return;
    e.preventDefault();
    const form = e.target;
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
      closeModal($("#message-modal"));
      showMessage(
        "Thanks for your order!",
        how === "sent"
          ? `<p>We've received your order and will email <strong>${escapeHtml(data.email)}</strong> a payment link shortly.</p>`
          : `<p>Your email app should open with your order details — just hit send and we'll reply with a payment link.</p>`
      );
      resetMessageModal();
    } catch (err) {
      btn.disabled = false;
      toast("Sorry, something went wrong. Please try again.");
    }
  });

  function resetMessageModal() {
    $("#message-modal .message-icon").hidden = false;
    $("#message-modal .modal-card > .btn").hidden = false;
  }
  $("#message-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget || e.target.closest("[data-close]")) resetMessageModal();
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
        how === "sent"
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
  renderCart();
  updateEstimate();
})();
