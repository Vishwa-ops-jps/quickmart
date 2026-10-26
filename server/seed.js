import "dotenv/config";
import mongoose from "mongoose";
import Product from "./models/Product.js";

const rows = [
  ["Banana (6 pcs)", "Fruits & Veg", "🍌", "6 pcs", 39, 49], ["Tomato", "Fruits & Veg", "🍅", "500 g", 28, 35],
  ["Apple, Shimla", "Fruits & Veg", "🍎", "4 pcs", 99, 120], ["Onion", "Fruits & Veg", "🧅", "1 kg", 42, 50],
  ["Carrot", "Fruits & Veg", "🥕", "500 g", 32, 40],
  ["Full cream milk", "Dairy & Bread", "🥛", "500 ml", 34, 34], ["Brown bread", "Dairy & Bread", "🍞", "400 g", 45, 50],
  ["Farm eggs", "Dairy & Bread", "🥚", "12 pcs", 84, 96], ["Cheese slices", "Dairy & Bread", "🧀", "200 g", 125, 140],
  ["Salted butter", "Dairy & Bread", "🧈", "100 g", 58, 60],
  ["Potato chips", "Snacks", "🥔", "90 g", 20, 20], ["Chocolate bar", "Snacks", "🍫", "50 g", 40, 45],
  ["Cookies", "Snacks", "🍪", "150 g", 30, 35], ["Popcorn", "Snacks", "🍿", "80 g", 35, 40],
  ["Cola", "Drinks", "🥤", "750 ml", 40, 45], ["Orange juice", "Drinks", "🧃", "1 L", 110, 125],
  ["Packaged water", "Drinks", "💧", "1 L", 20, 20], ["Cold coffee", "Drinks", "☕", "200 ml", 55, 60],
  ["Instant noodles", "Instant Food", "🍜", "4 pack", 56, 60], ["Pasta", "Instant Food", "🍝", "500 g", 75, 90],
  ["Ready rice", "Instant Food", "🍚", "250 g", 65, 70],
  ["Shampoo", "Personal Care", "🧴", "340 ml", 199, 240], ["Toothpaste", "Personal Care", "🪥", "150 g", 89, 99],
  ["Bath soap", "Personal Care", "🧼", "3 pack", 120, 140],
  ["Dish wash gel", "Cleaning", "🫧", "500 ml", 99, 115], ["Floor cleaner", "Cleaning", "🧹", "1 L", 169, 190],
];

await mongoose.connect(process.env.MONGO_URI);
await Product.deleteMany({});
await Product.insertMany(rows.map(([name, category, emoji, unit, price, mrp]) => ({ name, category, emoji, unit, price, mrp })));
console.log(`Seeded ${rows.length} products`);
await mongoose.disconnect();
