/* ============================================================
   Vector Grid — hardened backend (dropshipping-ready)
   - Verified Razorpay payments (signature checked server-side)
   - Captures EVERY order and emails you the shipping details
   - Per-product supplier + cost (kept private from customers)
   Secret keys + email creds live ONLY in environment variables.
   ============================================================ */

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const path = require("path");
const Razorpay = require("razorpay");
const { Pool } = require("pg");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://*.razorpay.com", "https://lumberjack.razorpay.com"],
    frameSrc: ["https://*.razorpay.com", "https://checkout.razorpay.com", "https://api.razorpay.com"],
    objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], frameAncestors: ["'self'"],
    upgradeInsecureRequests: [],
  }},
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: "10kb" }));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!KEY_ID || !KEY_SECRET) console.warn("⚠️  Razorpay keys not set — online payments disabled until set.");
const razorpay = (KEY_ID && KEY_SECRET) ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET }) : null;

// ---- Email (orders are sent to you, via Resend over HTTPS — works on Render) ----
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Sender: defaults to Resend's shared test address so it works before you own a domain.
const ORDER_FROM = process.env.ORDER_EMAIL_FROM || "Vector Grid <onboarding@resend.dev>";
if (!RESEND_API_KEY) console.warn("⚠️  No RESEND_API_KEY — orders will be logged to server logs only (no email).");
const ORDER_TO = process.env.ORDER_EMAIL_TO || "vectorgridsupport@gmail.com";
const SUPPLIER_TO = process.env.ORDER_EMAIL_SUPPLIER || "";

// ---- Database (stores orders so customers can track them) ----
const DB_URL = process.env.DATABASE_URL;
const DB_SSL = DB_URL && !/localhost|127\.0\.0\.1/.test(DB_URL);
const pool = DB_URL
  ? new Pool({ connectionString: DB_URL, ssl: DB_SSL ? { rejectUnauthorized: false } : false, max: 5 })
  : null;
if (!pool) console.warn("⚠️  No DATABASE_URL — order tracking is off until a database is connected.");

async function initDb() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id text PRIMARY KEY,
    name text, phone text, email text,
    line1 text, line2 text, city text, state text, pincode text,
    items jsonb, subtotal int, shipping int, total int,
    paid boolean, payment_id text,
    status text DEFAULT 'Placed',
    tracking_url text, tracking_carrier text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`);
}
if (pool) initDb().then(() => console.log("Database ready.")).catch((e) => console.error("DB init failed:", e && e.message));

async function saveOrder(o) {
  if (!pool) return;
  const items = o.lineItems.map((li) => ({ name: li.name, qty: li.qty, price: li.price }));
  await pool.query(
    `INSERT INTO orders (id,name,phone,email,line1,line2,city,state,pincode,items,subtotal,shipping,total,paid,payment_id,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'Placed') ON CONFLICT (id) DO NOTHING`,
    [o.id, o.customer.name, o.customer.phone, o.customer.email, o.customer.line1, o.customer.line2,
     o.customer.city, o.customer.state, o.customer.pincode, JSON.stringify(items),
     o.subtotal, o.shipping, o.total, o.paid, o.paymentId]
  );
}

// ---- Seller admin auth (for updating order status) ----
const ADMIN_KEY = process.env.ADMIN_KEY || "";
if (!ADMIN_KEY) console.warn("⚠️  No ADMIN_KEY — the Manage Orders page is disabled until you set one.");
function adminOk(req) {
  const k = String((req.get && req.get("x-admin-key")) || (req.body && req.body.key) || (req.query && req.query.key) || "");
  if (!ADMIN_KEY || !k) return false;
  const a = Buffer.from(k), b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ============================================================
   YOUR PRODUCTS — the source of truth. Customers NEVER see
   `cost`, `supplier`, or `supplierUrl` (stripped before sending).
   For dropshipping (Option A): set supplier + where to order +
   your cost, so the order email tells you exactly what to do.
   ============================================================ */
const PRODUCTS = [
  { id: "p1", name: "Minimalist Steel Water Bottle", price: 549, mrp: 899, stock: 42, category: "Drinkware",
    img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    desc: "Insulated 750ml bottle. Keeps cold 24h, hot 12h.",
    cost: 320, supplier: "BaapStore", supplierUrl: "https://supplier.example.com/steel-bottle" },
  { id: "p2", name: "Linen Cushion Cover (Set of 2)", price: 699, mrp: 1199, stock: 30, category: "Home",
    img: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80",
    desc: "16x16 inch, washed linen, hidden zip.",
    cost: 410, supplier: "vFulfill", supplierUrl: "https://supplier.example.com/linen-cushion" },
  { id: "p3", name: "Wireless Earbuds — Bass Edition", price: 1299, mrp: 2499, stock: 12, category: "Audio",
    img: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80",
    desc: "ENC mic, 40h playback, IPX5.",
    cost: 740, supplier: "Ekomn", supplierUrl: "https://supplier.example.com/earbuds" },
  { id: "p4", name: "Stoneware Coffee Mug (350ml)", price: 399, mrp: 649, stock: 60, category: "Drinkware",
    img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
    desc: "Hand-glazed ceramic mug, microwave safe.",
    cost: 190, supplier: "Qikink", supplierUrl: "https://supplier.example.com/mug" },
  { id: "p5", name: "Woven Seagrass Storage Basket", price: 849, mrp: 1499, stock: 18, category: "Home",
    img: "https://images.unsplash.com/photo-1595408076683-d0d8d5e8e0e9?w=600&q=80",
    desc: "Handwoven basket with handles. 30cm.",
    cost: 520, supplier: "vFulfill", supplierUrl: "https://supplier.example.com/basket" },
  { id: "p6", name: "Portable Bluetooth Speaker", price: 1599, mrp: 2999, stock: 9, category: "Audio",
    img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    desc: "12h playtime, deep bass, IPX6 splash-proof.",
    cost: 980, supplier: "Ekomn", supplierUrl: "https://supplier.example.com/speaker" },
  { id: "p7", name: "Heavy Canvas Tote Bag", price: 449, mrp: 799, stock: 75, category: "Accessories",
    img: "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&q=80",
    desc: "12oz cotton canvas, roomy, everyday carry.",
    cost: 230, supplier: "Qikink", supplierUrl: "https://supplier.example.com/tote" },
  { id: "p8", name: "Adjustable LED Desk Lamp", price: 1099, mrp: 1899, stock: 22, category: "Tech",
    img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    desc: "3 light modes, touch dimmer, USB-powered.",
    cost: 640, supplier: "BaapStore", supplierUrl: "https://supplier.example.com/lamp" },
  { id: "p9", name: "Cotton Bath Towel (Pack of 2)", price: 749, mrp: 1299, stock: 0, category: "Home",
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    desc: "500 GSM, quick-dry, soft combed cotton.",
    cost: 430, supplier: "vFulfill", supplierUrl: "https://supplier.example.com/towel" },
];

const rupee = (n) => "Rs." + Number(n || 0).toLocaleString("en-IN");
const shippingFor = (s) => s === 0 ? 0 : (s >= 999 ? 0 : 49);

// Compute an order from item ids+qty using TRUSTED server prices
function computeOrder(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return { error: "Invalid cart" };
  const lineItems = []; let subtotal = 0, totalCost = 0;
  for (const it of items) {
    if (!it || typeof it.id !== "string") return { error: "Invalid item" };
    const qty = Number.isInteger(it.qty) ? it.qty : parseInt(it.qty, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) return { error: "Invalid quantity" };
    const p = PRODUCTS.find(pp => pp.id === it.id);
    if (!p) return { error: "Unknown product" };
    subtotal += p.price * qty;
    if (typeof p.cost === "number") totalCost += p.cost * qty;
    lineItems.push({ id: p.id, name: p.name, price: p.price, qty, cost: p.cost, supplier: p.supplier, supplierUrl: p.supplierUrl });
  }
  const shipping = shippingFor(subtotal);
  return { lineItems, subtotal, shipping, total: subtotal + shipping, totalCost };
}

function sanitizeCustomer(c) {
  c = c || {};
  const s = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const out = {
    name: s(c.name, 80), phone: s(c.phone, 10), email: s(c.email, 120),
    line1: s(c.line1, 120), line2: s(c.line2, 120), city: s(c.city, 60),
    state: s(c.state, 60), pincode: s(c.pincode, 6),
  };
  if (!out.name) return { error: "Name required" };
  if (!/^[6-9]\d{9}$/.test(out.phone)) return { error: "Invalid phone" };
  if (!out.line1) return { error: "Address required" };
  if (!out.city) return { error: "City required" };
  if (!/^\d{6}$/.test(out.pincode)) return { error: "Invalid pincode" };
  return out;
}

async function notifyOrder(order) {
  const c = order.customer;
  const lines = order.lineItems.map(li =>
    `- ${li.name}  x${li.qty}\n    sell ${rupee(li.price)} | your cost ${li.cost != null ? rupee(li.cost) : "-"} | supplier: ${li.supplier || "-"}${li.supplierUrl ? "\n    order from: " + li.supplierUrl : ""}`
  ).join("\n");
  const margin = (order.totalCost != null && order.totalCost > 0) ? rupee(order.total - order.shipping - order.totalCost) : "n/a";
  const body = [
    `NEW ORDER ${order.id}  —  ${order.paid ? "PAID ONLINE" : "COD (collect on delivery)"}`,
    order.paymentId ? `Razorpay payment id: ${order.paymentId}` : "",
    "",
    "ITEMS TO SOURCE & SHIP:",
    lines,
    "",
    `Revenue ${rupee(order.total)}  |  Your cost ${order.totalCost != null ? rupee(order.totalCost) : "n/a"}  |  Margin ${margin}`,
    "",
    "SHIP TO:",
    c.name,
    c.line1 + (c.line2 ? ", " + c.line2 : ""),
    `${c.city}, ${c.state} - ${c.pincode}`,
    `Phone ${c.phone}` + (c.email ? ` | Email ${c.email}` : ""),
    "",
    "Next step: place this order with the supplier(s) above and have them ship to the address.",
  ].filter(x => x !== "").join("\n");

  console.log("==== ORDER ====\n" + body + "\n===============");  // backup record in server logs
  if (!RESEND_API_KEY || !ORDER_TO) return;
  const to = [ORDER_TO, SUPPLIER_TO].filter(Boolean);
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ORDER_FROM,
      to,
      subject: `New order ${order.id} — ${order.paid ? "PAID" : "COD"} — ${rupee(order.total)}`,
      text: body,
    }),
  });
  if (!resp.ok) throw new Error("Resend " + resp.status + ": " + (await resp.text()).slice(0, 200));
}

// Send the BUYER a friendly confirmation + how to track (to the email they entered)
async function notifyBuyer(order) {
  const c = order.customer;
  if (!RESEND_API_KEY || !c.email) return;
  const site = process.env.SITE_URL || "https://vector-grid.onrender.com";
  const items = order.lineItems.map(li => `- ${li.name} x${li.qty} — ${rupee(li.price * li.qty)}`).join("\n");
  const body = [
    `Hi ${c.name},`,
    "",
    "Thank you for shopping with Vector Grid! Your order is confirmed.",
    "",
    `Order ID: ${order.id}`,
    `Payment: ${order.paid ? "Paid online" : "Cash on Delivery"}`,
    "",
    "Items:",
    items,
    "",
    `Subtotal: ${rupee(order.subtotal)}`,
    `Shipping: ${order.shipping === 0 ? "Free" : rupee(order.shipping)}`,
    `Total: ${rupee(order.total)}`,
    "",
    "Delivering to:",
    c.line1 + (c.line2 ? ", " + c.line2 : ""),
    `${c.city}, ${c.state} - ${c.pincode}`,
    "",
    "TRACK YOUR ORDER anytime:",
    `1. Go to ${site}`,
    `2. Click "Track order" at the top`,
    `3. Enter Order ID ${order.id} and phone ${c.phone}`,
    "",
    "We'll update the status as your order is packed and shipped.",
    "Questions? Just reply to this email.",
    "",
    "— Team Vector Grid",
  ].join("\n");
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ORDER_FROM,
      to: [c.email],
      reply_to: ORDER_TO,
      subject: `Your Vector Grid order ${order.id} is confirmed 🎉`,
      text: body,
    }),
  });
  if (!resp.ok) throw new Error("Resend(buyer) " + resp.status + ": " + (await resp.text()).slice(0, 200));
}

// Public catalogue (cost/supplier stripped out)
app.get("/api/products", (req, res) =>
  res.json(PRODUCTS.map(({ id, name, price, mrp, stock, img, desc, category }) => ({ id, name, price, mrp, stock, img, desc, category })))
);

// Create a Razorpay order (amount computed from trusted prices)
app.post("/api/create-order", async (req, res) => {
  if (!razorpay) return res.status(503).json({ error: "Payments are not set up yet." });
  const calc = computeOrder(req.body && req.body.items);
  if (calc.error) return res.status(400).json({ error: calc.error });
  try {
    const order = await razorpay.orders.create({ amount: calc.total * 100, currency: "INR", receipt: "rcpt_" + Date.now() });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID });
  } catch (e) {
    console.error("create-order failed:", e && e.message);
    res.status(500).json({ error: "Could not create order" });
  }
});

// Place order: verifies payment (online) or records COD, then emails you
app.post("/api/place-order", async (req, res) => {
  try {
    const b = req.body || {};
    const calc = computeOrder(b.items);
    if (calc.error) return res.status(400).json({ error: calc.error });
    const customer = sanitizeCustomer(b.customer);
    if (customer.error) return res.status(400).json({ error: customer.error });

    let paid = false, paymentId = null;
    if (b.cod === true) {
      paid = false;
    } else {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: "Missing payment details" });
      if (!KEY_SECRET) return res.status(503).json({ error: "Payments not configured" });
      const expected = crypto.createHmac("sha256", KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
      const a = Buffer.from(expected), bb = Buffer.from(String(razorpay_signature));
      const ok = a.length === bb.length && crypto.timingSafeEqual(a, bb);
      if (!ok) return res.status(400).json({ error: "Payment verification failed" });
      paid = true; paymentId = razorpay_payment_id;
    }

    const order = { id: "VG" + Date.now().toString().slice(-8), ...calc, customer, paid, paymentId };
    try { await saveOrder(order); } catch (e) { console.error("save failed:", e && e.message); }
    // Respond immediately so the customer isn't kept waiting; email sends in the background.
    res.json({ ok: true, orderId: order.id, total: order.total });
    notifyOrder(order).catch((e) => console.error("notify failed:", e && e.message));
    notifyBuyer(order).catch((e) => console.error("buyer notify failed:", e && e.message));
  } catch (e) {
    console.error("place-order failed:", e && e.message);
    res.status(500).json({ error: "Could not place order" });
  }
});

// ---- Customer order tracking (by order ID + phone, no account) ----
app.post("/api/track", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Order tracking isn't set up yet. Please contact us." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase();
  const phone = String((req.body && req.body.phone) || "").replace(/\D/g, "").slice(-10);
  if (!id || phone.length !== 10) return res.status(400).json({ error: "Enter your order ID and the 10-digit phone number you ordered with." });
  try {
    const r = await pool.query(
      "SELECT id,status,tracking_url,tracking_carrier,total,items,created_at,updated_at FROM orders WHERE id=$1 AND phone=$2",
      [id, phone]
    );
    if (!r.rows.length) return res.status(404).json({ error: "No order found with that ID and phone number." });
    const o = r.rows[0];
    const itemCount = (o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
    res.json({ id: o.id, status: o.status, trackingUrl: o.tracking_url, trackingCarrier: o.tracking_carrier,
      total: o.total, itemCount, items: o.items || [], placedAt: o.created_at, updatedAt: o.updated_at });
  } catch (e) { console.error("track failed:", e && e.message); res.status(500).json({ error: "Couldn't fetch your order. Please try again." }); }
});

// ---- Seller: list orders ----
app.get("/api/admin/orders", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  try {
    const r = await pool.query(
      "SELECT id,name,phone,email,line1,line2,city,state,pincode,items,subtotal,shipping,total,paid,payment_id,status,tracking_url,tracking_carrier,created_at FROM orders ORDER BY created_at DESC LIMIT 100"
    );
    res.json({ orders: r.rows });
  } catch (e) { console.error("admin list failed:", e && e.message); res.status(500).json({ error: "Could not load orders." }); }
});

// ---- Seller: update an order's status / tracking ----
app.post("/api/admin/update", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database not connected." });
  if (!adminOk(req)) return res.status(401).json({ error: "Wrong admin key." });
  const id = String((req.body && req.body.orderId) || "").trim().toUpperCase();
  const status = String((req.body && req.body.status) || "").trim();
  const allowed = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status." });
  const trackingUrl = String((req.body && req.body.trackingUrl) || "").trim().slice(0, 300);
  const trackingCarrier = String((req.body && req.body.trackingCarrier) || "").trim().slice(0, 60);
  try {
    const r = await pool.query(
      "UPDATE orders SET status=$2, tracking_url=$3, tracking_carrier=$4, updated_at=now() WHERE id=$1 RETURNING id",
      [id, status, trackingUrl, trackingCarrier]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Order not found." });
    res.json({ ok: true });
  } catch (e) { console.error("admin update failed:", e && e.message); res.status(500).json({ error: "Update failed." }); }
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Vector Grid running on port " + PORT));
