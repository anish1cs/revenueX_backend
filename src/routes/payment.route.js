import { Router } from "express";
import {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentByBillId,
  deletePayment,

} from "../controllers/payment.controller.js";


const router = Router();

// 🔹 Create a new payment (secured route)
router.route("/create").post( createPayment);

// 🔹 Get all payments (secured route - for admin)
router.route("/all").get( getPayments);

// 🔹 Get single payment by ID
router.route("/:id").get( getPaymentById);
// 🔹 Get single payment by billID
router.route("/bills/:id").get( getPaymentByBillId);

// 🔹 Delete a payment by ID
router.route("/:id").delete( deletePayment);

export default router;
