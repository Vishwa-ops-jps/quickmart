import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const r = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
const pub = (u) => ({ id: u._id, name: u.name, phone: u.phone });

r.post("/register", async (req, res) => {
  const { name, phone, password } = req.body || {};
  if (!name?.trim() || !/^\d{10}$/.test(phone || "") || (password || "").length < 6)
    return res.status(400).json({ message: "Enter your name, a 10-digit phone number and a password of 6+ characters." });
  if (await User.findOne({ phone })) return res.status(409).json({ message: "This phone number is already registered. Log in instead." });
  const u = await User.create({ name: name.trim(), phone, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
});

r.post("/login", async (req, res) => {
  const { phone, password } = req.body || {};
  const u = await User.findOne({ phone: String(phone || "") });
  if (!u || !(await bcrypt.compare(password || "", u.password)))
    return res.status(401).json({ message: "Wrong phone number or password." });
  res.json({ token: sign(u), user: pub(u) });
});

export default r;
