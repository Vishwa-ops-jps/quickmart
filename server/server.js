import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";

const { MONGO_URI, JWT_SECRET, PORT = 5000, CLIENT_URL } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET. Copy server/.env.example to server/.env and fill it in.");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CLIENT_URL ? CLIENT_URL.split(",").map((s) => s.trim()) : true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on our side. Try again." });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  });
