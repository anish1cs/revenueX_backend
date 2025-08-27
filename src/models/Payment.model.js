// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    billId: {
      type: String,
      required: true,
      ref: "Bill",
    },
    customerId: {
      type: String,
      required: true,
      ref: "Customer",
    },
    amountPaid: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    mode: { type: String, enum: ["Cash", "UPI", "Card", "NetBanking"], required: true },
  },
  { timestamps: true }
);

export const Payment =  mongoose.model("Payment", paymentSchema);
