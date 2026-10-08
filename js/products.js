/*
 * Product catalogue and store settings.
 * Edit this file to add, remove or re-price items — no other code changes needed.
 *
 * `art` picks one of the built-in SVG illustrations in ART below. To use a real
 * photo instead, set `image: "images/your-photo.jpg"` on the product.
 */

const STORE = {
  currency: "USD",
  flatShipping: 6.5,
  freeShippingOver: 60,
  contactEmail: "hello@example.com",
  // Optional: a form endpoint (e.g. https://formspree.io/f/xxxx) that receives
  // custom-order requests and checkout orders as JSON. Leave empty to fall back
  // to opening the customer's email app with the details filled in.
  formEndpoint: "",
};

const COLORS = {
  black: { name: "Matte Black", hex: "#2b2d31" },
  white: { name: "Bone White", hex: "#ece8df" },
  grey: { name: "Slate Grey", hex: "#7b8494" },
  red: { name: "Signal Red", hex: "#e2483d" },
  blue: { name: "Ocean Blue", hex: "#2f7de1" },
  green: { name: "Forest Green", hex: "#3a9a5b" },
  yellow: { name: "Sunflower Yellow", hex: "#f4c430" },
  orange: { name: "Tangerine", hex: "#f08a24" },
  purple: { name: "Galaxy Purple", hex: "#7a4fd6" },
  gold: { name: "Silk Gold", hex: "#c9a14a" },
  teal: { name: "Teal", hex: "#1fa5a0" },
  pink: { name: "Blush Pink", hex: "#f29fb5" },
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "home", label: "Home & Decor" },
  { id: "desk", label: "Desk & Office" },
  { id: "toys", label: "Toys & Games" },
  { id: "garden", label: "Plants & Garden" },
  { id: "gifts", label: "Gifts" },
];

const PRODUCTS = [
  {
    id: "spiral-vase",
    name: "Spiral Vase",
    category: "home",
    price: 24,
    art: "vase",
    colors: ["teal", "white", "gold", "purple"],
    badge: "Bestseller",
    description: "A twisting, faceted vase printed in a single continuous spiral. Watertight liner included for fresh flowers.",
    specs: ["18 cm tall", "PLA with watertight insert", "Print time ~9 hrs"],
  },
  {
    id: "geo-planter",
    name: "Geometric Planter",
    category: "garden",
    price: 18,
    art: "planter",
    colors: ["white", "black", "green", "pink"],
    description: "Low-poly planter with a hidden drainage tray. Perfect for succulents and small herbs.",
    specs: ["12 cm wide", "Drainage tray included", "PETG — UV resistant"],
  },
  {
    id: "cable-organiser",
    name: "Cable Organiser Set",
    category: "desk",
    price: 12,
    art: "cable",
    colors: ["black", "white", "grey"],
    description: "Set of 6 weighted cable clips that keep chargers from slipping off your desk.",
    specs: ["Set of 6", "Fits cables up to 6 mm", "Non-slip base"],
  },
  {
    id: "phone-stand",
    name: "Adjustable Phone Stand",
    category: "desk",
    price: 16,
    art: "stand",
    colors: ["black", "grey", "blue", "orange"],
    badge: "New",
    description: "Three viewing angles, fits phones and small tablets, with a slot for your charging cable.",
    specs: ["3 angles", "Fits devices up to 13 mm thick", "Fold-flat design"],
  },
  {
    id: "flexi-dragon",
    name: "Articulated Flexi Dragon",
    category: "toys",
    price: 28,
    art: "dragon",
    colors: ["purple", "red", "green", "gold"],
    badge: "Bestseller",
    description: "Print-in-place dragon with fully articulated body and wings. A satisfying fidget and a great shelf piece.",
    specs: ["30 cm long", "Print-in-place joints", "Ages 8+"],
  },
  {
    id: "dice-tower",
    name: "Castle Dice Tower",
    category: "toys",
    price: 34,
    art: "tower",
    colors: ["grey", "black", "gold"],
    description: "Medieval castle dice tower with internal baffles for truly random rolls. Built-in dice tray.",
    specs: ["22 cm tall", "Fits up to 25 mm dice", "Felt-lined tray"],
  },
  {
    id: "headphone-hook",
    name: "Under-Desk Headphone Hook",
    category: "desk",
    price: 14,
    art: "hook",
    colors: ["black", "white", "red"],
    description: "Clamp-on hook that keeps your headset off the desk. No screws or adhesive needed.",
    specs: ["Fits desks 10–40 mm", "Holds up to 2 kg", "Padded clamp"],
  },
  {
    id: "lithophane-lamp",
    name: "Moon Lithophane Lamp",
    category: "gifts",
    price: 45,
    art: "moon",
    colors: ["white"],
    badge: "Gift idea",
    description: "A detailed moon sphere that reveals its craters when lit. Warm LED base with USB power and touch dimming.",
    specs: ["15 cm diameter", "USB-C LED base included", "3 brightness levels"],
  },
  {
    id: "name-keychain",
    name: "Personalised Keychain",
    category: "gifts",
    price: 9,
    art: "keychain",
    colors: ["red", "blue", "green", "yellow", "pink", "black"],
    description: "Your name or short word in bold two-tone letters. Add the name you want in the order notes at checkout.",
    specs: ["Up to 10 characters", "Two-colour print", "Steel ring included"],
  },
  {
    id: "honeycomb-shelf",
    name: "Honeycomb Wall Shelf",
    category: "home",
    price: 22,
    art: "hex",
    colors: ["white", "black", "yellow", "teal"],
    description: "Modular hexagon shelf that connects to others for endless layouts. Mounting hardware included.",
    specs: ["20 cm across", "Interlocking design", "Holds up to 3 kg"],
  },
  {
    id: "self-water-pot",
    name: "Self-Watering Pot",
    category: "garden",
    price: 26,
    art: "pot",
    colors: ["green", "white", "orange"],
    description: "Two-part pot with a wicking reservoir that keeps soil moist for up to two weeks.",
    specs: ["14 cm tall", "300 ml reservoir", "Water level window"],
  },
  {
    id: "puzzle-cube",
    name: "Twisty Puzzle Cube",
    category: "toys",
    price: 19,
    art: "cube",
    colors: ["blue", "red", "yellow", "green"],
    description: "Interlocking puzzle cube that looks simple and takes ages to solve. Printed as one interlocking piece.",
    specs: ["6 cm cube", "Difficulty: tricky", "Ages 10+"],
  },
];

/* Simple illustrated product art. Each function returns SVG markup tinted with `c`. */
const ART = {
  vase: (c) => `
    <path d="M70 30h60l-8 22c18 14 26 34 26 58 0 34-20 60-48 60s-48-26-48-60c0-24 8-44 26-58z" fill="${c}"/>
    <path d="M78 52c14 30 4 70 10 118M100 52c-6 34 10 76 0 118M122 52c-14 30 0 70-10 118" stroke="#000" stroke-opacity=".14" stroke-width="5" fill="none"/>
    <path d="M94 30c-4-18 6-22 6-22s10 4 6 22" fill="#3a9a5b"/><circle cx="100" cy="10" r="8" fill="#f29fb5"/>`,
  planter: (c) => `
    <path d="M100 18c-6 18-26 22-26 40h52c0-18-20-22-26-40z" fill="#3a9a5b"/>
    <path d="M78 40c-16-8-30-2-30-2s10 16 30 14M122 40c16-8 30-2 30-2s-10 16-30 14" fill="#4fb36e"/>
    <path d="M42 64h116l-18 100H60z" fill="${c}"/>
    <path d="M42 64l58 40 58-40M60 164l40-60 40 60M42 64l18 100M158 64l-18 100" stroke="#000" stroke-opacity=".14" stroke-width="3" fill="none"/>`,
  cable: (c) => `
    <rect x="30" y="110" width="140" height="44" rx="12" fill="${c}"/>
    <path d="M52 110v-14a12 12 0 0 1 24 0v14M88 110v-14a12 12 0 0 1 24 0v14M124 110v-14a12 12 0 0 1 24 0v14" fill="none" stroke="${c}" stroke-width="10"/>
    <path d="M64 30c0 40 0 60 0 80M100 20c0 40 0 70 0 90M136 30c0 40 0 60 0 80" stroke="#555" stroke-width="6" stroke-linecap="round" fill="none"/>
    <rect x="30" y="136" width="140" height="18" rx="9" fill="#000" fill-opacity=".14"/>`,
  stand: (c) => `
    <rect x="70" y="28" width="62" height="112" rx="10" fill="#2b2d31" transform="rotate(-14 100 84)"/>
    <rect x="76" y="36" width="50" height="94" rx="5" fill="#8fc6ff" transform="rotate(-14 100 84)"/>
    <path d="M40 160h120l-10 12H50zM60 160l40-70 10 6-30 64z" fill="${c}"/>
    <path d="M40 160h120" stroke="#000" stroke-opacity=".18" stroke-width="4"/>`,
  dragon: (c) => `
    <path d="M30 140c20-10 30 4 46-6s18-26 36-26 24 18 40 16 18-22 24-28" fill="none" stroke="${c}" stroke-width="20" stroke-linecap="round"/>
    <path d="M30 140c20-10 30 4 46-6s18-26 36-26 24 18 40 16 18-22 24-28" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="20" stroke-dasharray="3 9"/>
    <path d="M96 106 70 50l44 40zM120 110l30-60 6 56z" fill="${c}" opacity=".8"/>
    <circle cx="176" cy="96" r="16" fill="${c}"/><circle cx="182" cy="92" r="3.5" fill="#111"/>
    <path d="M168 82l-6-14M178 80l2-14" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  tower: (c) => `
    <path d="M60 50h80v120H60z" fill="${c}"/>
    <path d="M54 34h14v16h12V34h12v16h16V34h12v16h12V34h14v22H54z" fill="${c}"/>
    <path d="M86 130a14 14 0 0 1 28 0v40H86z" fill="#000" fill-opacity=".3"/>
    <rect x="74" y="72" width="12" height="20" rx="6" fill="#000" fill-opacity=".25"/><rect x="114" y="72" width="12" height="20" rx="6" fill="#000" fill-opacity=".25"/>
    <path d="M30 170h140v10H30z" fill="${c}" opacity=".7"/>
    <rect x="132" y="146" width="18" height="18" rx="4" fill="#fff" transform="rotate(14 141 155)"/><circle cx="141" cy="155" r="2.5" fill="#222"/>`,
  hook: (c) => `
    <rect x="20" y="30" width="160" height="16" rx="3" fill="#a9825a"/>
    <path d="M70 46v30h60V46" fill="none" stroke="${c}" stroke-width="12"/>
    <path d="M100 76v40c0 24 30 24 30 4" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>
    <path d="M60 150a40 40 0 0 1 80 0" fill="none" stroke="#444" stroke-width="10"/>
    <rect x="48" y="140" width="24" height="34" rx="10" fill="#444"/><rect x="128" y="140" width="24" height="34" rx="10" fill="#444"/>`,
  moon: (c) => `
    <circle cx="100" cy="88" r="62" fill="#fff4cf"/>
    <circle cx="100" cy="88" r="62" fill="${c}" opacity=".35"/>
    <circle cx="80" cy="70" r="12" fill="#d9c98f" opacity=".7"/><circle cx="120" cy="100" r="16" fill="#d9c98f" opacity=".6"/><circle cx="90" cy="118" r="8" fill="#d9c98f" opacity=".7"/><circle cx="126" cy="62" r="6" fill="#d9c98f" opacity=".7"/>
    <path d="M70 150h60l8 24H62z" fill="#a9825a"/>
    <circle cx="100" cy="88" r="80" fill="#ffd970" opacity=".12"/>`,
  keychain: (c) => `
    <circle cx="46" cy="64" r="22" fill="none" stroke="#999" stroke-width="6"/>
    <rect x="58" y="76" width="122" height="56" rx="14" fill="${c}"/>
    <text x="119" y="115" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="30" fill="#fff" text-anchor="middle">ALEX</text>
    <circle cx="72" cy="104" r="6" fill="#fff"/>`,
  hex: (c) => `
    <path d="M100 22 156 54v64l-56 32-56-32V54z" fill="none" stroke="${c}" stroke-width="12" stroke-linejoin="round"/>
    <path d="M50 100h100" stroke="${c}" stroke-width="10"/>
    <rect x="66" y="70" width="12" height="30" fill="#e2483d"/><rect x="80" y="64" width="12" height="36" fill="#2f7de1"/><rect x="94" y="74" width="10" height="26" fill="#3a9a5b"/>
    <path d="M120 100c0-14 6-22 12-22s12 8 12 22z" fill="#4fb36e"/>
    <path d="M152 140 180 156v32l-28 16" fill="none" stroke="${c}" stroke-width="8" opacity=".5"/>`,
  pot: (c) => `
    <path d="M100 20c-8 20-32 26-32 46h64c0-20-24-26-32-46z" fill="#3a9a5b"/>
    <path d="M100 66V40" stroke="#2b7a46" stroke-width="4"/>
    <path d="M56 66h88l-6 50H62z" fill="${c}"/>
    <path d="M60 116h80l-6 56H66z" fill="${c}" opacity=".75"/>
    <rect x="92" y="130" width="16" height="30" rx="6" fill="#8fc6ff"/>
    <rect x="92" y="146" width="16" height="14" rx="4" fill="#2f7de1"/>`,
  cube: (c) => `
    <path d="M100 26 162 60v72l-62 36-62-36V60z" fill="${c}"/>
    <path d="M100 98 162 60M100 98 38 60M100 98v70" stroke="#fff" stroke-opacity=".7" stroke-width="5"/>
    <path d="M100 98 162 60v72l-62 36z" fill="#000" fill-opacity=".18"/>
    <path d="M100 98 38 60v72l62 36z" fill="#000" fill-opacity=".06"/>
    <path d="M69 43l62 36M131 43 69 79M69 79v68M131 79v68M38 96l62 36 62-36" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none"/>`,
};

function productArt(product, colorKey) {
  const hex = (COLORS[colorKey] || COLORS[product.colors[0]]).hex;
  if (product.image) {
    return `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
  }
  const draw = ART[product.art] || ART.cube;
  return `<svg viewBox="0 0 200 200" role="img" aria-label="${product.name}">${draw(hex)}</svg>`;
}
