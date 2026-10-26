import { Router } from "express";
import Product from "../models/Product.js";

const r = Router();

// GET /api/products?category=Snacks&q=chips
r.get("/", async (req, res) => {
  const { category, q } = req.query;
  const filter = {};
  if (category && category !== "All") filter.category = String(category);
  if (q) filter.name = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  res.json(await Product.find(filter).sort({ category: 1, name: 1 }));
});

export default r;
