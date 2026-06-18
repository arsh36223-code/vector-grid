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
const nodemailer = require("nodemailer");

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

// ---- Email (orders are sent to you) ----
const mailer = (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;
if (!mailer) console.warn("⚠️  Email not configured — orders will be logged to server logs only.");
const ORDER_TO = process.env.ORDER_EMAIL_TO || process.env.SMTP_USER || "vectorgridsupport@gmail.com";
const SUPPLIER_TO = process.env.ORDER_EMAIL_SUPPLIER || "";

/* ============================================================
   YOUR PRODUCTS — the source of truth. Customers NEVER see
   `cost`, `supplier`, or `supplierUrl` (stripped before sending).
   For dropshipping (Option A): set supplier + where to order +
   your cost, so the order email tells you exactly what to do.
   ============================================================ */
const PRODUCTS = [
  { id: "p1", name: "Minimalist Steel Water Bottle", price: 549, mrp: 899, stock: 42,
    img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    desc: "Insulated 750ml bottle. Keeps cold 24h, hot 12h.",
    cost: 320, supplier: "BaapStore", supplierUrl: "https://supplier.example.com/steel-bottle" },
  { id: "p2", name: "Linen Cushion Cover (Set of 2)", price: 699, mrp: 1199, stock: 30,
    img: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80",
    desc: "16x16 inch, washed linen, hidden zip.",
    cost: 410, supplier: "vFulfill", supplierUrl: "https://supplier.example.com/linen-cushion" },
  { id: "p3", name: "Wireless Earbuds — Bass Edition", price: 1299, mrp: 2499, stock: 12,
    img: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80",
    desc: "ENC mic, 40h playback, IPX5.",
    cost: 740, supplier: "Ekomn", supplierUrl: "https://supplier.example.com/earbuds" },
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
  if (!mailer || !ORDER_TO) return;
  const to = [ORDER_TO, SUPPLIER_TO].filter(Boolean).join(",");
  await mailer.sendMail({
    from: process.env.SMTP_USER, to,
    subject: `New order ${order.id} — ${order.paid ? "PAID" : "COD"} — ${rupee(order.total)}`,
    text: body,
  });
}

// Public catalogue (cost/supplier stripped out)
app.get("/api/products", (req, res) =>
  res.json(PRODUCTS.map(({ id, name, price, mrp, stock, img, desc }) => ({ id, name, price, mrp, stock, img, desc })))
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
    try { await notifyOrder(order); } catch (e) { console.error("notify failed:", e && e.message); }
    res.json({ ok: true, orderId: order.id, total: order.total });
  } catch (e) {
    console.error("place-order failed:", e && e.message);
    res.status(500).json({ error: "Could not place order" });
  }
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Vector Grid running on port " + PORT));
