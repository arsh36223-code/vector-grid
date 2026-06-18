/* ============================================================
   Vector Grid — hardened payment backend
   Security: Helmet headers + CSP, rate limiting, strict input
   validation, server-trusted prices, signature-verified payments.
   The KEY SECRET lives ONLY in environment variables (never in code
   or in any file a visitor can load).
   ============================================================ */

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const path = require("path");
const Razorpay = require("razorpay");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // needed for correct client IP behind Render's proxy

// ---- Security headers + Content-Security-Policy (tuned for Razorpay) ----
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.razorpay.com", "https://lumberjack.razorpay.com"],
      frameSrc: ["https://*.razorpay.com", "https://checkout.razorpay.com", "https://api.razorpay.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // allow Razorpay's cross-origin assets
}));

app.use(express.json({ limit: "10kb" })); // small body limit blocks payload-flood attacks

// ---- Rate limiting: blunt protection against abuse / brute force ----
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use("/api/", apiLimiter);

app.use(express.static(path.join(__dirname, "public")));

// ---- Keys from environment only ----
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!KEY_ID || !KEY_SECRET) console.warn("⚠️  Razorpay keys not set — payments disabled until you set them.");
const razorpay = (KEY_ID && KEY_SECRET) ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET }) : null;

/* ============================================================
   YOUR PRODUCTS — the ONLY prices trusted for payment.
   Edit this list to manage your store, then redeploy.
   ============================================================ */
const PRODUCTS = [
  { id: "p1", name: "Minimalist Steel Water Bottle", price: 549, mrp: 899, stock: 42,
    img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    desc: "Insulated 750ml bottle. Keeps cold 24h, hot 12h. Powder-coat finish." },
  { id: "p2", name: "Linen Cushion Cover (Set of 2)", price: 699, mrp: 1199, stock: 30,
    img: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80",
    desc: "16x16 inch, washed linen, hidden zip. Earthy tones." },
  { id: "p3", name: "Wireless Earbuds — Bass Edition", price: 1299, mrp: 2499, stock: 12,
    img: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80",
    desc: "ENC mic, 40h playback with case, IPX5 sweat resistant." },
];
const shippingFor = (subtotal) => subtotal === 0 ? 0 : (subtotal >= 999 ? 0 : 49);

app.get("/api/products", (req, res) => res.json(PRODUCTS));

app.post("/api/create-order", async (req, res) => {
  if (!razorpay) return res.status(503).json({ error: "Payments are not set up yet." });
  try {
    // ---- strict input validation ----
    const items = Array.isArray(req.body && req.body.items) ? req.body.items : null;
    if (!items || items.length === 0 || items.length > 50) {
      return res.status(400).json({ error: "Invalid cart" });
    }
    let subtotal = 0;
    for (const it of items) {
      if (!it || typeof it.id !== "string") return res.status(400).json({ error: "Invalid item" });
      const qty = Number.isInteger(it.qty) ? it.qty : parseInt(it.qty, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) return res.status(400).json({ error: "Invalid quantity" });
      const p = PRODUCTS.find(pp => pp.id === it.id);
      if (!p) return res.status(400).json({ error: "Unknown product" });
      subtotal += p.price * qty;
    }
    const total = subtotal + shippingFor(subtotal);
    const order = await razorpay.orders.create({
      amount: total * 100, currency: "INR", receipt: "rcpt_" + Date.now(),
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID });
  } catch (e) {
    console.error("create-order failed:", e && e.message);
    res.status(500).json({ error: "Could not create order" }); // never leak internals
  }
});

app.post("/api/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false });
    }
    const expected = crypto.createHmac("sha256", KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    // timing-safe compare
    const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature));
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    res.json({ verified: ok });
  } catch (e) {
    res.status(500).json({ verified: false });
  }
});

// JSON 404 for unknown API routes; everything else serves the app
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Vector Grid running on port " + PORT));
