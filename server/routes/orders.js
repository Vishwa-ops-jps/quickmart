import { Router } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import auth from "../middleware/auth.js";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, HANDLING_FEE, STAGES, STAGE_SECONDS } from "../config.js";

const r = Router();
r.use(auth);

// Demo delivery simulation: status advances with time since the order was placed.
async function refreshStatus(o) {
  const step = Math.min(STAGES.length - 1, Math.floor((Date.now() - o.createdAt) / 1000 / STAGE_SECONDS));
  if (o.status !== STAGES[step]) {
    o.status = STAGES[step];
    await o.save();
  }
  return o;
}

r.post("/", async (req, res) => {
  const { items, address, paymentMethod } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Your cart is empty." });
  const a = address || {};
  if (!a.name?.trim() || !/^\d{10}$/.test(a.phone || "") || (a.line || "").trim().length < 5 || !/^\d{6}$/.test(a.pincode || ""))
    return res.status(400).json({ message: "Enter your name, a 10-digit phone number, a full address and a 6-digit pincode." });

  const valid = items.filter((i) => /^[0-9a-f]{24}$/i.test(String(i.productId)));
  const found = await Product.find({ _id: { $in: valid.map((i) => i.productId) }, inStock: true });
  const map = new Map(found.map((p) => [String(p._id), p]));
  const lines = [];
  for (const i of items) {
    const p = map.get(String(i.productId));
    const qty = Number(i.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 20)
      return res.status(400).json({ message: "One of the items is unavailable. Refresh and try again." });
    lines.push({ product: p._id, name: p.name, emoji: p.emoji, price: p.price, qty });
  }
  // Prices are always calculated on the server, never trusted from the client.
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const order = await Order.create({
    user: req.userId,
    items: lines,
    address: { name: a.name.trim(), phone: a.phone, line: a.line.trim(), pincode: a.pincode },
    paymentMethod: ["Cash on delivery", "UPI (demo)", "Card (demo)"].includes(paymentMethod) ? paymentMethod : "Cash on delivery",
    subtotal,
    deliveryFee,
    handlingFee: HANDLING_FEE,
    total: subtotal + deliveryFee + HANDLING_FEE,
  });
  res.status(201).json(order);
});

r.get("/", async (req, res) => {
  const list = await Order.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50);
  res.json(await Promise.all(list.map(refreshStatus)));
});

r.get("/:id", async (req, res) => {
  if (!/^[0-9a-f]{24}$/i.test(req.params.id)) return res.status(404).json({ message: "Order not found." });
  const o = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!o) return res.status(404).json({ message: "Order not found." });
  res.json(await refreshStatus(o));
});

export default r;
