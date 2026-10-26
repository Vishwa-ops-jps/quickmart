import mongoose from "mongoose";
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        emoji: String,
        price: Number,
        qty: Number,
      },
    ],
    address: { name: String, phone: String, line: String, pincode: String },
    paymentMethod: { type: String, default: "Cash on delivery" },
    subtotal: Number,
    deliveryFee: Number,
    handlingFee: Number,
    total: Number,
    status: { type: String, default: "Confirmed" },
  },
  { timestamps: true }
);
export default mongoose.model("Order", orderSchema);
