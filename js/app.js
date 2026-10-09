/*
 * Modlify storefront.
 * Written to run on older phones and browsers as well as new ones: no async/await,
 * object spread, optional catch bindings or other recent syntax.
 */
function startShop(published) {
  "use strict";

  /* ---------- Helpers ---------- */
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (sel) {
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches(sel)) return el;
        el = el.parentNode;
      }
      return null;
    };
  }
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function find(list, fn) {
    for (var i = 0; i < list.length; i++) if (fn(list[i])) return list[i];
    return null;
  }
  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  }
  function formValues(form) {
    var out = {};
    $$("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.type === "file") return;
      if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return;
      out[el.name] = el.value.trim();
    });
    return out;
  }

  var esc = escapeHtml; // from products.js
  var money = null;
  try {
    money = new Intl.NumberFormat("en-US", { style: "currency", currency: STORE.currency });
  } catch (e) {
    /* very old browsers: fall back to a plain format */
  }
  function fmt(n) {
    return money ? money.format(n) : "$" + Number(n).toFixed(2);
  }

  var storage = {
    get: function (key, fallback, session) {
      try {
        var raw = (session ? sessionStorage : localStorage).getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    remove: function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        /* ignore */
      }
    },
    set: function (key, value, session) {
      try {
        (session ? sessionStorage : localStorage).setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
  };

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2600);
  }

  /* ---------- Shop data ---------- */
  // The website shows data/shop.json when it has been published from the Shop owner
  // page, otherwise the built-in products from products.js. Edits the owner hasn't
  // published yet are kept as a draft in this browser only, so only they see them.
  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }
  var DRAFT_KEY = "lw3d-draft";
  var base = {
    products: published ? published.products : clone(PRODUCTS),
    heroImage: (published && published.heroImage) || "",
    paypal: (published && published.paypal) || "",
    phone: (published && published.phone) || "",
    updated: (published && published.updated) || 0,
  };
  var draft = storage.get(DRAFT_KEY, null);
  if (draft && !(draft.products && draft.products.length >= 0 && draft.products.forEach)) draft = null;
  // Once the website has caught up with what was published, the draft is no longer needed.
  if (draft && draft.publishedAt && base.updated >= draft.publishedAt) {
    draft = null;
    storage.remove(DRAFT_KEY);
  }
  // Products added with the earlier version of the owner page.
  var legacy = storage.get("lw3d-owner-products", []);
  if (legacy && legacy.length) {
    if (!draft) draft = { products: clone(base.products).concat(legacy), heroImage: base.heroImage };
    storage.set(DRAFT_KEY, draft);
    storage.remove("lw3d-owner-products");
  }

  function activeData() {
    return draft || base;
  }
  var heroArt = $(".hero-art");
  var heroDrawing = heroArt.innerHTML;
  function applyData() {
    var d = activeData();
    PRODUCTS.length = 0;
    d.products.forEach(function (p) {
      PRODUCTS.push(p);
    });
    heroArt.classList.toggle("has-photo", !!d.heroImage);
    heroArt.innerHTML = d.heroImage ? '<img class="hero-photo" src="' + esc(d.heroImage) + '" alt="">' : heroDrawing;
  }
  applyData();

  function productById(id) {
    return find(PRODUCTS, function (p) {
      return p.id === id;
    });
  }
  function categoryLabel(id) {
    var c = find(CATEGORIES, function (c) {
      return c.id === id;
    });
    return c ? c.label : "";
  }

  /* ---------- Tabs ---------- */
  // Each tab is a [data-view] block and the URL hash picks which one is shown.
  // A hash naming an element inside a tab (e.g. #faq) opens that tab and scrolls to it.
  var VIEWS = $$("[data-view]").map(function (v) {
    return v.dataset.view;
  });
  var VIEW_TITLES = { home: "Home", shop: "Shop", custom: "Custom Items", cart: "Cart", orders: "Orders", manage: "Shop Owner" };
  var baseTitle = document.title;

  function jumpToTop() {
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }

  function currentHash() {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      return "";
    }
  }

  function route(hash) {
    if (typeof hash !== "string") hash = currentHash();
    var view = VIEWS.indexOf(hash) >= 0 ? hash : "home";
    var target = null;
    if (hash && VIEWS.indexOf(hash) < 0) {
      target = document.getElementById(hash);
      var owner = target && target.closest("[data-view]");
      if (owner) view = owner.dataset.view;
    }
    $$("[data-view]").forEach(function (v) {
      v.hidden = v.dataset.view !== view;
    });
    $$("[data-nav]").forEach(function (a) {
      var on = a.dataset.nav === view;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = view === "home" ? baseTitle : VIEW_TITLES[view] + " · " + baseTitle;
    if (view === "orders") renderOrders();
    if (target) target.scrollIntoView();
    else jumpToTop();
  }
  // Tabs and in-page links are handled here instead of by the browser, because some
  // viewers (embedded previews, in-app browsers) block or ignore "#" link navigation.
  // The address bar is updated when allowed so Back still works.
  function go(hash) {
    try {
      if (location.hash !== "#" + hash) history.pushState(null, "", "#" + hash);
    } catch (e) {
      /* history not available here — the tab still switches */
    }
    route(hash);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    go(a.getAttribute("href").slice(1));
  });
  window.addEventListener("hashchange", function () {
    route();
  });
  window.addEventListener("popstate", function () {
    route();
  });

  /* ---------- Shop ---------- */
  var state = { category: "all", query: "", sort: "featured" };

  function renderFilters() {
    $("#filters").innerHTML = CATEGORIES.map(function (c) {
      var on = c.id === state.category;
      return '<button type="button" class="filter' + (on ? " active" : "") + '" aria-pressed="' + on + '" data-cat="' + c.id + '">' + esc(c.label) + "</button>";
    }).join("");
  }

  function visibleProducts() {
    var q = state.query.trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      return (
        (state.category === "all" || p.category === state.category) &&
        (!q || p.name.toLowerCase().indexOf(q) >= 0 || (p.description || "").toLowerCase().indexOf(q) >= 0)
      );
    });
    if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return list;
  }

  function cardHtml(p) {
    var colors = productColors(p);
    return (
      '<article class="card">' +
      (ownerUnlocked ? '<button type="button" class="edit-chip" data-edit="' + esc(p.id) + '">Edit</button>' : "") +
      '<button type="button" class="card-media" data-open="' + esc(p.id) + '" aria-label="View ' + esc(p.name) + '">' +
      (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") +
      productArt(p, colors[0]) +
      "</button>" +
      '<div class="card-body">' +
      '<p class="card-cat">' + esc(categoryLabel(p.category)) + "</p>" +
      '<h3><button type="button" class="link-btn" data-open="' + esc(p.id) + '">' + esc(p.name) + "</button></h3>" +
      '<p class="card-desc">' + esc(p.description) + "</p>" +
      '<div class="card-swatches" aria-label="Available colours">' +
      colors.map(function (k) {
        return COLORS[k] ? '<span style="background:' + COLORS[k].hex + '" title="' + COLORS[k].name + '"></span>' : "";
      }).join("") +
      "</div>" +
      '<div class="card-foot"><span class="price">' + fmt(p.price) + "</span></div>" +
      '<div class="card-buttons">' +
      '<button type="button" class="btn btn-small" data-quick-add="' + esc(p.id) + '">Add to cart</button>' +
      '<button type="button" class="btn btn-small btn-buy" data-buy-now="' + esc(p.id) + '">Buy now</button>' +
      "</div></div></article>"
    );
  }

  function renderProducts() {
    var list = visibleProducts();
    $("#empty-state").hidden = list.length > 0;
    $("#product-grid").innerHTML = list.map(cardHtml).join("");
  }

  function renderFeatured() {
    // Owner-chosen featured items, or items with a badge if none were chosen.
    var featured = PRODUCTS.filter(function (p) { return p.featured === true || (p.featured === undefined && p.badge); }).slice(0, 4);
    $("#featured-grid").innerHTML = featured.map(cardHtml).join("");
  }

  function renderShop() {
    renderFilters();
    renderProducts();
    renderFeatured();
  }

  $("#filters").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderFilters();
    renderProducts();
  });
  $("#search").addEventListener("input", function (e) {
    state.query = e.target.value;
    renderProducts();
  });
  $("#sort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    renderProducts();
  });
  function onGridClick(e) {
    var edit = e.target.closest("[data-edit]");
    if (edit) {
      go("manage");
      openEditor(edit.dataset.edit);
      return;
    }
    var open = e.target.closest("[data-open]");
    if (open) return openProduct(open.dataset.open);
    var buy = e.target.closest("[data-buy-now]");
    if (buy) {
      var item = productById(buy.dataset.buyNow);
      if (item) {
        addProductToCart(item.id, productColors(item)[0], 1);
        goToCheckout();
      }
      return;
    }
    var add = e.target.closest("[data-quick-add]");
    if (add) {
      var p = productById(add.dataset.quickAdd);
      if (p) addProductToCart(p.id, productColors(p)[0], 1);
    }
  }
  $("#product-grid").addEventListener("click", onGridClick);
  $("#featured-grid").addEventListener("click", onGridClick);

  /* ---------- Modals ---------- */
  var lastFocus = null;
  function openModal(el) {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(function () {
      el.classList.add("show");
    });
    var focusable = el.querySelector("button, input, select, textarea, a[href]");
    if (focusable) focusable.focus();
  }
  function closeModal(el) {
    el.classList.remove("show");
    el.hidden = true;
    var anyOpen = $$(".modal").some(function (m) { return !m.hidden; });
    if (!anyOpen) document.body.classList.remove("no-scroll");
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
  }
  $$(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m || e.target.closest("[data-close]")) closeModal(m);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    $$(".modal").filter(function (m) { return !m.hidden; }).forEach(closeModal);
  });

  // actions: [{ label, href, primary }] — each closes the message when tapped.
  function showMessage(title, html, actions) {
    $("#message-title").textContent = title;
    $("#message-body").innerHTML = html;
    actions = actions || [{ label: "Done", primary: true }];
    $("#message-actions").innerHTML = actions.map(function (a) {
      var cls = "btn btn-block " + (a.primary ? "btn-primary" : "btn-outline");
      return a.href
        ? '<a class="' + cls + '" href="' + esc(a.href) + '"' + (a.external ? ' target="_blank" rel="noopener"' : "") + " data-close>" + esc(a.label) + "</a>"
        : '<button type="button" class="' + cls + '" data-close>' + esc(a.label) + "</button>";
    }).join("");
    openModal($("#message-modal"));
  }

  /* ---------- Product details ---------- */
  var modal = $("#product-modal");
  var current = { product: null, color: null };

  function setModalColor(key) {
    current.color = key;
    $("#modal-media").innerHTML = productArt(current.product, key);
    $("#modal-color-name").textContent = COLORS[key] ? COLORS[key].name : "";
    $$("#modal-swatches button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.color === key));
    });
  }

  function openProduct(id) {
    var p = productById(id);
    if (!p) return;
    current.product = p;
    $("#modal-cat").textContent = categoryLabel(p.category);
    $("#modal-title").textContent = p.name;
    $("#modal-price").textContent = fmt(p.price);
    $("#modal-desc").textContent = p.description;
    $("#modal-specs").innerHTML = (p.specs || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    $("#modal-swatches").innerHTML = productColors(p).map(function (k) {
      return '<button type="button" class="swatch" data-color="' + k + '" style="background:' + COLORS[k].hex + '" aria-label="' + COLORS[k].name + '" aria-pressed="false"></button>';
    }).join("");
    $("#modal-qty").value = 1;
    setModalColor(productColors(p)[0]);
    openModal(modal);
  }

  $("#modal-swatches").addEventListener("click", function (e) {
    var b = e.target.closest("[data-color]");
    if (b) setModalColor(b.dataset.color);
  });
  var qtyInput = $("#modal-qty");
  function clampQty(n) {
    return Math.min(20, Math.max(1, Math.round(Number(n)) || 1));
  }
  $("#qty-minus").addEventListener("click", function () {
    qtyInput.value = clampQty(Number(qtyInput.value) - 1);
  });
  $("#qty-plus").addEventListener("click", function () {
    qtyInput.value = clampQty(Number(qtyInput.value) + 1);
  });
  qtyInput.addEventListener("change", function () {
    qtyInput.value = clampQty(qtyInput.value);
  });
  $("#modal-add").addEventListener("click", function () {
    addProductToCart(current.product.id, current.color, clampQty(qtyInput.value));
    closeModal(modal);
  });
  $("#modal-buy").addEventListener("click", function () {
    addProductToCart(current.product.id, current.color, clampQty(qtyInput.value));
    closeModal(modal);
    goToCheckout();
  });

  // Buy now: the item is already in the cart, so jump straight to the checkout form.
  function goToCheckout() {
    go("cart");
    var name = $("#co-name");
    if (name) name.focus();
  }

  /* ---------- Cart ---------- */
  // Shop lines:   { kind: "product", key, id, color, qty }
  // Custom lines: { kind: "custom", key, qty, custom: { title, description, details[], price, color } }
  var cart = storage.get("lw3d-cart", []).filter(function (l) {
    if (!l) return false;
    if (l.kind === "custom") return l.custom && typeof l.custom.price === "number";
    return productById(l.id) && COLORS[l.color];
  }).map(function (l) {
    if (l.kind !== "custom") {
      l.kind = "product";
      l.key = l.id + ":" + l.color;
    }
    return l;
  });

  // Everything the cart and orders need to display a line.
  function lineInfo(l) {
    if (l.kind === "custom") {
      return {
        name: l.custom.title,
        badge: "Custom",
        description: l.custom.description,
        details: l.custom.details,
        unit: l.custom.price,
        total: l.custom.price,
        art: productArt({ name: l.custom.title, art: "custom", colors: [] }, l.custom.color),
        fixedQty: true,
      };
    }
    var p = productById(l.id);
    return {
      name: p.name,
      badge: "",
      description: p.description,
      details: [COLORS[l.color].name],
      unit: p.price,
      total: p.price * l.qty,
      art: productArt(p, l.color),
      fixedQty: false,
    };
  }

  function subtotal() {
    return cart.reduce(function (s, l) { return s + lineInfo(l).total; }, 0);
  }
  function shipping(sub) {
    return sub === 0 || sub >= STORE.freeShippingOver ? 0 : STORE.flatShipping;
  }
  function itemCount() {
    return cart.reduce(function (s, l) { return s + (l.kind === "custom" ? 1 : l.qty); }, 0);
  }

  function saveCart() {
    storage.set("lw3d-cart", cart);
    renderCart();
  }

  function bumpCartTab() {
    var tab = $("#cart-tab");
    tab.classList.remove("bump");
    void tab.offsetWidth;
    tab.classList.add("bump");
  }

  function addProductToCart(id, color, qty) {
    var key = id + ":" + color;
    var existing = find(cart, function (l) { return l.key === key; });
    if (existing) existing.qty = Math.min(20, existing.qty + qty);
    else cart.push({ kind: "product", key: key, id: id, color: color, qty: qty });
    saveCart();
    toast("Added " + productById(id).name + " (" + COLORS[color].name + ") to your cart");
    bumpCartTab();
  }

  function addCustomToCart(custom) {
    cart.push({ kind: "custom", key: "custom-" + Date.now(), qty: 1, custom: custom });
    saveCart();
    bumpCartTab();
  }

  function lineHtml(info, qtyHtml) {
    return (
      '<div class="cart-thumb">' + info.art + "</div>" +
      '<div class="cart-info">' +
      '<p class="cart-name">' + esc(info.name) + (info.badge ? ' <span class="pill">' + info.badge + "</span>" : "") + "</p>" +
      '<p class="cart-desc">' + esc(info.description) + "</p>" +
      (info.details.length ? '<ul class="detail-list">' + info.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" : "") +
      qtyHtml +
      "</div>"
    );
  }

  function renderCart() {
    var count = itemCount();
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
    });
    $("#cart-layout").classList.toggle("is-empty", cart.length === 0);

    var body = $("#cart-items");
    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty"><p>Your cart is empty.</p>' +
        '<p>Pick something from the Shop tab, or design your own in the Custom tab.</p></div>';
    } else {
      body.innerHTML = cart.map(function (l) {
        var info = lineInfo(l);
        var qtyHtml = info.fixedQty
          ? '<p class="cart-meta">Estimated price, confirmed before you pay</p>'
          : '<div class="cart-qty-row"><div class="qty qty-small">' +
            '<button type="button" data-dec aria-label="Decrease quantity">−</button>' +
            "<span>" + l.qty + "</span>" +
            '<button type="button" data-inc aria-label="Increase quantity">+</button>' +
            '</div><span class="cart-meta">' + fmt(info.unit) + " each</span></div>";
        return (
          '<div class="cart-line" data-key="' + esc(l.key) + '">' +
          lineHtml(info, qtyHtml) +
          '<div class="cart-right"><p>' + fmt(info.total) + "</p>" +
          '<button type="button" class="link-btn remove" data-remove>Remove</button></div>' +
          "</div>"
        );
      }).join("");
    }

    var sub = subtotal();
    var ship = shipping(sub);
    $("#cart-subtotal").textContent = fmt(sub);
    $("#cart-shipping").textContent = ship === 0 && sub > 0 ? "Free" : fmt(ship);
    $("#cart-total").textContent = fmt(sub + ship);
    var remaining = STORE.freeShippingOver - sub;
    $("#ship-note").textContent =
      sub === 0 ? "" : remaining > 0 ? "Add " + fmt(remaining) + " more for free shipping." : "You've unlocked free shipping!";
  }

  $("#cart-items").addEventListener("click", function (e) {
    var row = e.target.closest(".cart-line");
    if (!row) return;
    var line = find(cart, function (l) { return l.key === row.dataset.key; });
    if (!line) return;
    if (e.target.closest("[data-inc]")) line.qty = Math.min(20, line.qty + 1);
    else if (e.target.closest("[data-dec]")) line.qty -= 1;
    else if (e.target.closest("[data-remove]")) line.qty = 0;
    else return;
    cart = cart.filter(function (l) { return l.qty > 0; });
    saveCart();
  });

  /* ---------- Sending ---------- */
  // Resolves to "preview" (nothing sent), "sent" (posted to STORE.formEndpoint)
  // or "email" (opened the customer's email app with the details filled in).
  function send(subject, fields) {
    // Until a real contact email is set in products.js, nothing is sent anywhere.
    if (STORE.previewMode || /@example\.com$/i.test(STORE.contactEmail)) return Promise.resolve("preview");
    if (STORE.formEndpoint) {
      return fetch(STORE.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(assign({ _subject: subject }, fields)),
      }).then(function (res) {
        if (!res.ok) throw new Error("Request failed (" + res.status + ")");
        return "sent";
      });
    }
    var body = Object.keys(fields).map(function (k) { return k + ": " + fields[k]; }).join("\n");
    window.location.href = "mailto:" + STORE.contactEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return Promise.resolve("email");
  }

  /* ---------- Contact & hours ---------- */
  function phoneNumber() {
    return activeData().phone || STORE.phone || "";
  }
  function renderContact() {
    $("#contact-email").textContent = STORE.contactEmail;
    $("#contact-email-main").textContent = STORE.contactEmail;
    var phone = phoneNumber();
    var dial = phone.replace(/[^0-9+]/g, "");
    $("#contact-phone-row").hidden = !phone;
    $("#footer-phone").hidden = !phone;
    $("#contact-phone").textContent = phone;
    $("#footer-phone").textContent = phone;
    $("#contact-text").href = "sms:" + dial;
    $("#contact-call").href = "tel:" + dial;
    $("#footer-hours").textContent = STORE.hoursSummary;
    var today = new Date().getDay();
    $("#hours-body").innerHTML = STORE.hours.map(function (h, i) {
      var calls = h.closed ? "Closed" : h.calls || "No calls";
      return (
        '<tr class="' + (i === today ? "is-today" : "") + (h.closed ? " is-closed" : "") + '">' +
        '<th scope="row">' + esc(h.day) + (i === today ? ' <span class="pill">Today</span>' : "") + "</th>" +
        "<td>" + (h.messages === false ? "No messages" : "Any time") + "</td>" +
        '<td class="' + (h.calls ? "has-calls" : "no-calls") + '">' + esc(calls) + "</td></tr>"
      );
    }).join("");
  }

  /* ---------- Payments ---------- */
  function paypalName() {
    return activeData().paypal || "";
  }
  // A PayPal.me link that opens PayPal with the amount already filled in.
  function paypalLink(amount) {
    return "https://paypal.me/" + encodeURIComponent(paypalName()) + "/" + amount.toFixed(2) + STORE.currency;
  }
  // Shop-only orders can be paid straight away; custom items are priced by the owner first.
  function canPayNow(order) {
    return !!paypalName() && !order.items.some(function (it) { return it.custom; });
  }

  /* ---------- Orders ---------- */
  var orders = storage.get("lw3d-orders", []);

  function newOrderNumber() {
    return "MOD-" + String(Date.now()).slice(-6);
  }

  function renderOrders() {
    var list = $("#orders-list");
    if (!orders.length) {
      list.innerHTML =
        '<div class="panel cart-empty"><p>You haven\'t placed any orders yet.</p>' +
        '<p>Pick something from the Shop tab, or design your own in the Custom tab.</p></div>';
      return;
    }
    list.innerHTML = orders.map(function (o) {
      var date = new Date(o.date);
      var dateText = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) +
        " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return (
        '<article class="panel order">' +
        '<header class="order-head"><div><h3>Order ' + esc(o.number) + '</h3><p class="cart-meta">' + dateText + "</p></div>" +
        '<span class="status">' + esc(o.status) + "</span></header>" +
        '<div class="order-items">' +
        o.items.map(function (it) {
          return (
            '<div class="order-line"><div class="cart-info">' +
            '<p class="cart-name">' + esc(it.name) + (it.custom ? ' <span class="pill">Custom</span>' : "") + "</p>" +
            '<p class="cart-desc">' + esc(it.description) + "</p>" +
            (it.details && it.details.length ? '<ul class="detail-list">' + it.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" : "") +
            "</div>" +
            '<div class="cart-right"><p>' + fmt(it.total) + '</p><p class="cart-meta">' + (it.custom ? "Custom" : "Qty " + it.qty + " × " + fmt(it.unit)) + "</p></div></div>"
          );
        }).join("") +
        "</div>" +
        '<div class="totals">' +
        "<div><span>Subtotal</span><span>" + fmt(o.subtotal) + "</span></div>" +
        "<div><span>Shipping</span><span>" + (o.shipping === 0 ? "Free" : fmt(o.shipping)) + "</span></div>" +
        '<div class="total"><span>Total</span><span>' + fmt(o.total) + "</span></div></div>" +
        '<p class="cart-meta">Shipping to ' + esc(o.customer.name) + ", " + esc(o.customer.address) + "</p>" +
        (canPayNow(o) ? '<a class="btn btn-primary btn-block" href="' + esc(paypalLink(o.total)) + '" target="_blank" rel="noopener">Pay ' + fmt(o.total) + " with PayPal</a>" : "") +
        "</article>"
      );
    }).join("");
  }

  /* ---------- Checkout ---------- */
  var checkoutForm = $("#checkout-form");
  checkoutForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cart.length || !validate(checkoutForm)) return;
    var data = formValues(checkoutForm);
    var sub = subtotal();
    var ship = shipping(sub);
    var order = {
      number: newOrderNumber(),
      date: new Date().toISOString(),
      status: "Order received",
      items: cart.map(function (l) {
        var info = lineInfo(l);
        return { name: info.name, description: info.description, details: info.details, qty: l.qty, unit: info.unit, total: info.total, custom: l.kind === "custom" };
      }),
      subtotal: sub,
      shipping: ship,
      total: sub + ship,
      customer: data,
    };
    var btn = checkoutForm.querySelector("button[type=submit]");
    btn.disabled = true;
    send("New order " + order.number + " from " + data.name, {
      name: data.name,
      email: data.email,
      address: data.address,
      notes: data.notes || "None",
      items: order.items.map(function (it) {
        return (it.custom ? "[Custom] " : it.qty + " x ") + it.name + " (" + it.details.join(", ") + ") — " + fmt(it.total);
      }).join("\n"),
      shipping: fmt(ship),
      total: fmt(order.total),
    })
      .then(function (how) {
        orders.unshift(order);
        storage.set("lw3d-orders", orders);
        cart = [];
        saveCart();
        checkoutForm.reset();
        var msg =
          how === "preview"
            ? "This shop isn't taking real orders yet, so nothing was sent and you won't be charged."
            : how === "sent"
            ? "We've received your order and will email <strong>" + esc(data.email) + "</strong> a payment link shortly."
            : paypalName()
            ? "Your email app should open with your order details. Send that email so we know what to make and where to ship it."
            : "Your email app should open with your order details. Send that email and we'll reply with a payment link.";
        var actions = [];
        if (how !== "preview" && canPayNow(order)) {
          msg += " Then tap the PayPal button to pay.";
          actions.push({ label: "Pay " + fmt(order.total) + " with PayPal", href: paypalLink(order.total), external: true, primary: true });
        } else if (how !== "preview" && paypalName()) {
          msg += " We'll check your custom item and email you the final price with a PayPal link.";
        }
        actions.push({ label: "View my orders", href: "#orders", primary: !actions.length });
        actions.push({ label: "Keep shopping", href: "#shop" });
        showMessage("Order " + order.number + " placed", "<p>" + msg + "</p>", actions);
      })
      .catch(function () {
        toast("Your order couldn't be sent. Check your connection and try again.");
      })
      .then(function () {
        btn.disabled = false;
      });
  });

  /* ---------- Validation ---------- */
  function setError(field, msg) {
    var err = field.querySelector(".error");
    if (msg) {
      if (!err) {
        err = document.createElement("p");
        err.className = "error";
        field.appendChild(err);
      }
      err.textContent = msg;
      field.classList.add("invalid");
    } else {
      if (err) err.parentNode.removeChild(err);
      field.classList.remove("invalid");
    }
  }

  function validate(form) {
    var ok = true;
    $$("[required]", form).forEach(function (el) {
      var field = el.closest(".field");
      var v = el.value.trim();
      var msg = "";
      if (!v) msg = "Please fill this in.";
      else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Enter an email address like name@example.com.";
      else if (el.minLength > 0 && v.length < el.minLength) msg = "Please add a bit more detail (at least " + el.minLength + " characters).";
      else if (el.type === "number" && (Number(v) < Number(el.min) || Number(v) > Number(el.max))) msg = "Enter a number from " + el.min + " to " + el.max + ".";
      if (msg) ok = false;
      setError(field, msg);
    });
    if (!ok) {
      var first = form.querySelector(".invalid input, .invalid select, .invalid textarea");
      if (first) first.focus();
    }
    return ok;
  }

  /* ---------- Custom item form ---------- */
  var customForm = $("#custom-form");
  var SIZE_BASE = { xs: 7, s: 9, m: 13, l: 15, xl: 25 };
  var MATERIAL_MULT = { pla: 1, petg: 1.1, tpu: 1.25, resin: 1.4, unsure: 1 };
  var MATERIAL_NAMES = { pla: "PLA", petg: "PETG", tpu: "TPU", resin: "Resin", unsure: "Material: advise me" };
  var FINISH_MULT = { standard: 1, sanded: 1.15, painted: 1.35 };
  var DESIGN_FEE = { design: 10, part: 5 };

  $("#c-color").innerHTML =
    Object.keys(COLORS).map(function (k) { return '<option value="' + k + '">' + COLORS[k].name + "</option>"; }).join("") +
    '<option value="multi">Multi-colour</option>';

  function selectedText(id) {
    var el = $("#" + id);
    return el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : "";
  }

  function customQuote() {
    var size = $("#c-size").value;
    if (!size) return null;
    var qty = Math.max(1, Math.min(500, Math.round(Number($("#c-qty").value)) || 1));
    var checked = customForm.querySelector("[name=material]:checked");
    var material = checked ? checked.value : "pla";
    var finish = $("#c-finish").value;
    var type = $("#c-type").value;
    var discount = qty >= 50 ? 0.8 : qty >= 10 ? 0.9 : 1;
    var fee = DESIGN_FEE[type] || 0;
    var price = Math.max(2, Math.round(SIZE_BASE[size] * MATERIAL_MULT[material] * FINISH_MULT[finish] * qty * discount + fee));
    return { qty: qty, material: material, price: price, discount: discount, fee: fee };
  }

  function updateEstimate() {
    var q = customQuote();
    if (!q) {
      $("#estimate-value").textContent = "$—";
      $("#estimate-note").textContent = "Choose a size to see your price.";
      return;
    }
    $("#estimate-value").textContent = fmt(q.price);
    var notes = [q.qty === 1 ? "For 1 item" : "For " + q.qty + " items"];
    if (q.discount < 1) notes.push(Math.round((1 - q.discount) * 100) + "% bulk discount");
    if (q.fee) notes.push("includes " + fmt(q.fee) + " design time");
    notes.push("we confirm the final price before you pay");
    $("#estimate-note").textContent = notes.join(" · ") + ".";
  }
  customForm.addEventListener("input", updateEstimate);
  customForm.addEventListener("change", updateEstimate);

  var fileInput = $("#c-file");
  var dropzone = $("#dropzone");
  var MAX_FILE = 25 * 1024 * 1024;
  function chosenFiles() {
    return Array.prototype.slice.call(fileInput.files || []);
  }
  function renderFiles() {
    $("#file-list").innerHTML = chosenFiles().map(function (f) {
      var big = f.size > MAX_FILE;
      var size = f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + " MB" : Math.ceil(f.size / 1024) + " KB";
      return '<li class="' + (big ? "too-big" : "") + '"><span>' + esc(f.name) + "</span><small>" + size + (big ? " (too large)" : "") + "</small></li>";
    }).join("");
  }
  fileInput.addEventListener("change", renderFiles);
  ["dragenter", "dragover"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropzone.classList.add("drag");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function () {
      dropzone.classList.remove("drag");
    });
  });
  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files.length) {
      try {
        fileInput.files = e.dataTransfer.files;
      } catch (err) {
        /* older browsers can't set files; the picker still works */
      }
      renderFiles();
    }
  });

  var minDate = new Date(Date.now() + 3 * 864e5);
  $("#c-deadline").min = minDate.getFullYear() + "-" + ("0" + (minDate.getMonth() + 1)).slice(-2) + "-" + ("0" + minDate.getDate()).slice(-2);

  customForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(customForm)) return;
    if (chosenFiles().some(function (f) { return f.size > MAX_FILE; })) {
      toast("One of your files is over 25 MB. Remove it and email it to us instead.");
      return;
    }
    var d = formValues(customForm);
    var q = customQuote();
    var details = [
      selectedText("c-type"),
      "Size: " + selectedText("c-size"),
      "Qty " + q.qty,
      MATERIAL_NAMES[q.material],
      selectedText("c-color"),
      selectedText("c-finish").replace(/\s*\(.*\)$/, "") + " finish",
    ];
    if (d.deadline) details.push("Needed by " + d.deadline);
    var files = chosenFiles().map(function (f) { return f.name; });
    if (files.length) details.push("Files: " + files.join(", "));
    addCustomToCart({
      title: d.title,
      description: d.description,
      details: details,
      price: q.price,
      color: COLORS[d.color] ? d.color : Object.keys(COLORS)[0],
    });
    showMessage(
      "Added to your cart",
      "<p><strong>" + esc(d.title) + "</strong> (" + fmt(q.price) + ") is in your cart." +
        (files.length ? " After you place your order, email your file" + (files.length > 1 ? "s" : "") + " to " + esc(STORE.contactEmail) + " so we can print them." : "") +
        "</p>",
      [
        { label: "Go to cart", href: "#cart", primary: true },
        { label: "Make another item" },
      ]
    );
    customForm.reset();
    renderFiles();
    updateEstimate();
  });

  /* ---------- Shop owner page ---------- */
  var OWNER_KEY = "lw3d-owner";
  var TOKEN_KEY = "lw3d-gh-token";
  var ownerUnlocked = false;
  var ownerLogin = $("#owner-login");
  var ownerPanel = $("#owner-panel");
  var productForm = $("#product-form");
  var editingId = null; // null while adding a new product
  var pendingImage; // undefined = keep current picture, "" = use the drawing, data URL = new photo
  var discardArmed = false;

  function setOwnerUnlocked(on) {
    ownerUnlocked = on;
    storage.set(OWNER_KEY, on, true);
    ownerLogin.hidden = on;
    ownerPanel.hidden = !on;
    $("#owner-lock").hidden = !on;
    $("#shop-add").hidden = !on;
    if (on) renderOwner();
    else closeEditor();
    renderShop();
  }

  ownerLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    var pin = $("#owner-pin");
    if (pin.value === String(STORE.ownerPin)) {
      pin.value = "";
      setError(pin.closest(".field"), "");
      setOwnerUnlocked(true);
    } else {
      setError(pin.closest(".field"), "That PIN isn't right. Try again.");
      pin.select();
    }
  });
  $("#owner-lock").addEventListener("click", function () {
    setOwnerUnlocked(false);
  });

  // Applies a change to a copy of the shop data, saves it as this browser's draft,
  // and refreshes the page. Returns false if the browser couldn't save it.
  function editShop(change) {
    var next = clone(activeData());
    delete next.updated;
    change(next);
    if (!storage.set(DRAFT_KEY, next)) {
      toast("This device is out of space for photos. Publish your changes, then try again.");
      return false;
    }
    draft = next;
    applyData();
    cart = cart.filter(function (l) {
      return l.kind === "custom" || productById(l.id);
    });
    saveCart();
    renderShop();
    renderOwner();
    return true;
  }

  // Shrinks a chosen photo so it loads quickly and fits in browser storage.
  function readPhoto(file, maxSize, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () {
        toast("That photo couldn't be opened. Try a different one.");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* Product editor */
  $("#p-category").innerHTML = CATEGORIES.filter(function (c) { return c.id !== "all"; }).map(function (c) {
    return '<option value="' + c.id + '">' + esc(c.label) + "</option>";
  }).join("");
  $("#p-colors").innerHTML = Object.keys(COLORS).map(function (k) {
    return '<label class="chip chip-color"><input type="checkbox" name="colors" value="' + k + '">' +
      '<span><i style="background:' + COLORS[k].hex + '"></i>' + COLORS[k].name + "</span></label>";
  }).join("");

  function editorProduct() {
    var p = editingId ? clone(productById(editingId)) : { name: "New product", art: "custom", colors: [] };
    if (pendingImage !== undefined) {
      if (pendingImage) p.image = pendingImage;
      else delete p.image;
    }
    if (!p.art) p.art = "custom";
    return p;
  }
  function renderPreview() {
    var p = editorProduct();
    var checked = $$("[name=colors]:checked", productForm)[0];
    $("#p-preview").innerHTML = productArt(p, checked ? checked.value : productColors(p)[0]);
    $("#p-image-remove").hidden = !p.image;
  }

  function openEditor(id) {
    var p = id ? productById(id) : null;
    if (id && !p) return;
    editingId = id || null;
    pendingImage = undefined;
    productForm.reset();
    $$(".field", productForm).forEach(function (f) { setError(f, ""); });
    $("#editor-title").textContent = p ? "Edit “" + p.name + "”" : "Add a product";
    $("#editor-save").textContent = p ? "Save changes" : "Add to shop";
    $("#p-name").value = p ? p.name : "";
    $("#p-price").value = p ? p.price : "";
    $("#p-category").value = p ? p.category : "home";
    $("#p-desc").value = p ? p.description : "";
    $("#p-specs").value = p ? (p.specs || []).join("\n") : "";
    $("#p-badge").value = p && p.badge ? p.badge : "";
    $("#p-featured").checked = p ? p.featured === true || (p.featured === undefined && !!p.badge) : false;
    var colors = p ? productColors(p) : [Object.keys(COLORS)[0]];
    $$("[name=colors]", productForm).forEach(function (el) {
      el.checked = colors.indexOf(el.value) >= 0;
    });
    productForm.hidden = false;
    renderPreview();
    productForm.scrollIntoView();
    $("#p-name").focus();
  }
  function closeEditor() {
    productForm.hidden = true;
    editingId = null;
    pendingImage = undefined;
  }

  $("#p-image").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    readPhoto(file, 800, function (url) {
      pendingImage = url;
      renderPreview();
    });
    e.target.value = "";
  });
  $("#p-image-remove").addEventListener("click", function () {
    pendingImage = "";
    renderPreview();
  });
  $("#p-colors").addEventListener("change", renderPreview);
  $("#editor-cancel").addEventListener("click", function () {
    closeEditor();
    $("#owner-products").scrollIntoView();
  });
  $("#product-new").addEventListener("click", function () {
    openEditor(null);
  });
  $("#shop-add").addEventListener("click", function () {
    go("manage");
    openEditor(null);
  });

  productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = validate(productForm);
    var colors = $$("[name=colors]:checked", productForm).map(function (el) { return el.value; });
    setError($("#p-colors").closest(".field"), colors.length ? "" : "Choose at least one colour.");
    if (!ok || !colors.length) return;
    var d = formValues(productForm);
    var p = editorProduct();
    p.id = editingId || "own-" + Date.now();
    p.name = d.name;
    p.price = Math.round(Number(d.price) * 100) / 100;
    p.category = d.category;
    p.description = d.description;
    p.specs = (d.specs || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
    p.colors = colors;
    p.featured = $("#p-featured").checked;
    if (d.badge) p.badge = d.badge;
    else delete p.badge;
    var adding = !editingId;
    var saved = editShop(function (data) {
      if (adding) data.products.push(p);
      else
        data.products = data.products.map(function (x) {
          return x.id === p.id ? p : x;
        });
    });
    if (!saved) return;
    closeEditor();
    toast(adding ? p.name + " added to the shop" : p.name + " updated");
    $("#owner-products").scrollIntoView();
  });

  /* Product list */
  function renderOwnerProducts() {
    $("#owner-products").innerHTML = PRODUCTS.length
      ? PRODUCTS.map(function (p) {
          return (
            '<div class="cart-line" data-owner-id="' + esc(p.id) + '">' +
            '<div class="cart-thumb">' + productArt(p, productColors(p)[0]) + "</div>" +
            '<div class="cart-info"><p class="cart-name">' + esc(p.name) + (p.image ? "" : ' <span class="pill">Drawing</span>') + "</p>" +
            '<p class="cart-desc">' + esc(categoryLabel(p.category)) + " · " + fmt(p.price) + "</p></div>" +
            '<div class="cart-right owner-actions"><button type="button" class="btn btn-small" data-owner-edit>Edit</button>' +
            '<button type="button" class="link-btn remove" data-owner-delete>Delete</button></div>' +
            "</div>"
          );
        }).join("")
      : '<p class="cart-meta">There are no products in the shop. Tap “Add new product” to add one.</p>';
  }
  var deleteArmed = null;
  $("#owner-products").addEventListener("click", function (e) {
    var row = e.target.closest("[data-owner-id]");
    if (!row) return;
    var id = row.dataset.ownerId;
    if (e.target.closest("[data-owner-edit]")) return openEditor(id);
    var del = e.target.closest("[data-owner-delete]");
    if (!del) return;
    // Ask for a second tap rather than a confirm() dialog, which some viewers block.
    if (deleteArmed !== id) {
      deleteArmed = id;
      del.textContent = "Tap again to delete";
      return;
    }
    deleteArmed = null;
    var name = productById(id).name;
    if (editingId === id) closeEditor();
    if (editShop(function (data) {
      data.products = data.products.filter(function (x) { return x.id !== id; });
    })) toast(name + " deleted");
  });

  /* Home banner */
  function renderHeroPreview() {
    var img = activeData().heroImage;
    $("#hero-preview").innerHTML = img ? '<img src="' + esc(img) + '" alt="Home page banner">' : '<span class="cart-meta">Printer drawing</span>';
    $("#hero-reset").hidden = !img;
  }
  $("#hero-image").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    readPhoto(file, 1200, function (url) {
      if (editShop(function (data) { data.heroImage = url; })) toast("Banner picture changed");
    });
    e.target.value = "";
  });
  $("#hero-reset").addEventListener("click", function () {
    if (editShop(function (data) { data.heroImage = ""; })) toast("Banner set back to the drawing");
  });

  /* Publishing to GitHub */
  function token() {
    return storage.get(TOKEN_KEY, "");
  }
  function renderPublish() {
    var has = !!token();
    var status;
    if (draft && draft.publishedAt) status = "Published! The website updates for everyone in about 1–2 minutes.";
    else if (draft) status = "You have changes that only you can see. Tap “Publish to website” so customers see them.";
    else status = "The website is up to date.";
    $("#publish-status").textContent = status;
    $("#publish-status").classList.toggle("is-pending", !!draft && !draft.publishedAt);
    $("#publish-btn").disabled = !draft || !!draft.publishedAt;
    $("#discard-btn").hidden = !draft || !!draft.publishedAt;
    $("#discard-btn").textContent = "Discard changes";
    discardArmed = false;
    $("#gh-summary").textContent = has ? "Publishing is set up ✓ (change token)" : "Set up publishing (one time)";
    $("#gh-forget").hidden = !has;
  }
  function renderPayments() {
    var name = paypalName();
    $("#pp-name").value = name;
    $("#pp-test").hidden = !name;
    if (name) $("#pp-test").href = "https://paypal.me/" + encodeURIComponent(name);
  }
  $("#pp-save").addEventListener("click", function () {
    var input = $("#pp-name");
    var v = input.value.trim().replace(/^.*paypal\.me\//i, "").replace(/\/.*$/, "");
    if (v && !/^[A-Za-z0-9]{1,20}$/.test(v)) {
      setError(input.closest(".field"), "Use only the letters and numbers after paypal.me/, for example modlify.");
      return;
    }
    setError(input.closest(".field"), "");
    if (v === paypalName()) {
      toast("No change to save");
      return;
    }
    if (editShop(function (data) { data.paypal = v; })) {
      toast(v ? "PayPal saved. Tap Publish to website to turn it on." : "PayPal removed");
    }
  });

  function renderPhone() {
    $("#phone-input").value = phoneNumber();
  }
  $("#phone-save").addEventListener("click", function () {
    var input = $("#phone-input");
    var v = input.value.trim();
    var digits = v.replace(/[^0-9]/g, "");
    if (v && (!/^[0-9+()\-.\s]+$/.test(v) || digits.length < 7 || digits.length > 15)) {
      setError(input.closest(".field"), "Enter a phone number using numbers, spaces, + ( ) or -.");
      return;
    }
    setError(input.closest(".field"), "");
    if (v === phoneNumber()) {
      toast("No change to save");
      return;
    }
    if (editShop(function (data) { data.phone = v; })) {
      renderContact();
      toast(v ? "Phone saved. Tap Publish to website to show it." : "Phone number removed");
    }
  });

  function renderOwner() {
    renderPhone();
    renderPayments();
    renderOwnerProducts();
    renderHeroPreview();
    renderPublish();
  }

  $("#gh-save").addEventListener("click", function () {
    var input = $("#gh-token");
    var v = input.value.trim();
    if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(v)) {
      setError(input.closest(".field"), "That doesn't look like a GitHub token. It starts with github_pat_.");
      return;
    }
    setError(input.closest(".field"), "");
    storage.set(TOKEN_KEY, v);
    input.value = "";
    $("#gh-setup").open = false;
    renderPublish();
    toast("Token saved. You can publish now.");
  });
  $("#gh-forget").addEventListener("click", function () {
    storage.remove(TOKEN_KEY);
    renderPublish();
    toast("Token removed from this device");
  });

  $("#discard-btn").addEventListener("click", function () {
    if (!discardArmed) {
      discardArmed = true;
      $("#discard-btn").textContent = "Tap again to discard";
      return;
    }
    draft = null;
    storage.remove(DRAFT_KEY);
    closeEditor();
    applyData();
    renderShop();
    renderCart();
    renderContact();
    renderOwner();
    toast("Changes discarded");
  });

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function github(method, path, body) {
    var url = "https://api.github.com/repos/" + STORE.githubRepo + "/contents/" + path;
    if (method === "GET") url += "?ref=" + encodeURIComponent(STORE.githubBranch);
    return fetch(url, {
      method: method,
      headers: {
        Authorization: "Bearer " + token(),
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      if (method === "GET" && res.status === 404) return null;
      return res.json().then(
        function (j) { return { res: res, json: j }; },
        function () { return { res: res, json: {} }; }
      ).then(function (r) {
        if (!r.res.ok) {
          var err = new Error(r.json.message || "GitHub error " + r.res.status);
          err.status = r.res.status;
          throw err;
        }
        return r.json;
      });
    });
  }
  function putFile(path, base64, message, sha) {
    var body = { message: message, content: base64, branch: STORE.githubBranch };
    if (sha) body.sha = sha;
    return github("PUT", path, body);
  }
  function publishError(err) {
    if (err.status === 401) return "GitHub didn't accept your token. It may be wrong or expired. Set up publishing again with a new token.";
    if (err.status === 403 || err.status === 404) return "Your token doesn't have permission to change Ai-app. Make a new token with Contents set to “Read and write” for Ai-app.";
    if (err.status === 409 || err.status === 422) return "GitHub was busy saving another change. Wait a few seconds and tap Publish again.";
    return "Publishing didn't finish (" + err.message + "). Check your internet connection and try again.";
  }

  $("#publish-btn").addEventListener("click", function () {
    if (!draft) return;
    if (!token()) {
      $("#gh-setup").open = true;
      $("#gh-setup").scrollIntoView();
      toast("Set up publishing first. It only takes a minute.");
      return;
    }
    var btn = $("#publish-btn");
    var status = $("#publish-status");
    var data = clone(draft);
    delete data.publishedAt;
    var stamp = Date.now();
    // Photos are uploaded as files and the products then point at them.
    var uploads = [];
    data.products.forEach(function (p) {
      if (p.image && p.image.indexOf("data:") === 0) {
        uploads.push({ target: p, key: "image", path: "images/" + String(p.id).replace(/[^a-z0-9-]/gi, "") + "-" + stamp + ".jpg" });
      }
    });
    if (data.heroImage && data.heroImage.indexOf("data:") === 0) {
      uploads.push({ target: data, key: "heroImage", path: "images/banner-" + stamp + ".jpg" });
    }
    btn.disabled = true;
    var chain = Promise.resolve();
    uploads.forEach(function (u, i) {
      chain = chain.then(function () {
        status.textContent = "Uploading photo " + (i + 1) + " of " + uploads.length + "…";
        return putFile(u.path, u.target[u.key].split(",")[1], "Add photo " + u.path).then(function () {
          u.target[u.key] = u.path;
        });
      });
    });
    chain
      .then(function () {
        status.textContent = "Saving products…";
        return github("GET", "data/shop.json");
      })
      .then(function (existing) {
        data.updated = stamp;
        return putFile("data/shop.json", utf8ToBase64(JSON.stringify(data, null, 2) + "\n"), "Update shop from the owner page", existing && existing.sha);
      })
      .then(function () {
        data.publishedAt = stamp;
        delete data.updated;
        draft = data;
        storage.set(DRAFT_KEY, draft);
        applyData();
        renderShop();
        renderOwner();
        toast("Published to the website");
      })
      .catch(function (err) {
        // Keep any photos that did upload, so a retry doesn't send them again.
        delete data.updated;
        draft = data;
        storage.set(DRAFT_KEY, draft);
        btn.disabled = false;
        status.textContent = publishError(err);
        status.classList.add("is-pending");
      });
  });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  renderContact();
  setOwnerUnlocked(storage.get(OWNER_KEY, false, true) === true);
  renderShop();
  renderCart();
  updateEstimate();
  route();

  // Everything loaded, so hide the "buttons can't run here" warning.
  var warning = document.getElementById("js-warning");
  if (warning) warning.parentNode.removeChild(warning);
}

// Load published shop data (if any), then start. Falls back to the built-in
// products when there's nothing published or the file can't be fetched.
(function () {
  var started = false;
  function begin(data) {
    if (started) return;
    started = true;
    startShop(data && data.products && data.products.forEach ? data : null);
  }
  var timer = setTimeout(function () {
    begin(null);
  }, 4000);
  function done(data) {
    clearTimeout(timer);
    begin(data);
  }
  try {
    if (!window.fetch || location.protocol === "file:") return done(null);
    fetch("data/shop.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(done, function () {
        done(null);
      });
  } catch (e) {
    done(null);
  }
})();
