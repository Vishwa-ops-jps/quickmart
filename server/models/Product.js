import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    emoji: { type: String, default: "🛒" },
    image: { type: String, default: "" },
    unit: { type: String, default: "" },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export default mongoose.model("Product", productSchema);
