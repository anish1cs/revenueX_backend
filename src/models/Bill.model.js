// models/Bill.js
import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    billId: { type: String, required: true, unique: true },
    customerId: {
      type: String,
      required: true,
      ref: "Customer",
    },
    month: { type: String, required: true }, // e.g. Aug-2025
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    generatedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Bill =  mongoose.model("Bill", billSchema);
