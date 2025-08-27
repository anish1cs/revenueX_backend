// controllers/billController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Bill } from "../models/Bill.model.js";
import { Customer } from "../models/Customer.model.js";
import cron from "node-cron";

// ✅ Create Bill Manually
const createBill = asyncHandler(async (req, res) => {
  const { billId, customerId, month, amount, generatedDate, dueDate } = req.body;

  if ([billId, customerId, month, amount, generatedDate, dueDate].some((f) => !f)) {
    throw new ApiError(400, "All fields are required");
  }

  const exists = await Bill.findOne({ billId });
  if (exists) throw new ApiError(409, "Bill already exists");

  const bill = await Bill.create(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, bill, "Bill created successfully"));
});

// ✅ Auto-generate Bills for all Active Customers every month
const generateBill =  async () => {
  try {
    console.log("🔄 Auto Bill Generation Started...");

    const customers = await Customer.find({ status: "active" });
const date = new Date();
date.setMonth(date.getMonth() - 1); // shift back one month
const month = date.toLocaleString("default", { month: "short", year: "numeric" });



    const generatedDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10); // due in 10 days

    for (let customer of customers) {
      const billId = `BILL${Date.now()}-${customer._id}`;
      const exists = await Bill.findOne({ customerId: customer._id, month });

      if (!exists) {
        await Bill.create({
          billId,
          customerId: customer._id,
          month,
          amount: 2500, // you can make it dynamic later
          status: "pending",
          generatedDate,
          dueDate,
          paidDate: null,
        });
        console.log(`✅ Bill generated for ${customer.name} (${customer.customerId})`);
      }
    }

    console.log("🎉 Auto Bill Generation Completed!");
  } catch (error) {
    console.error("❌ Error in auto bill generation:", error.message);
  }
}



// ✅ Get All Bills
const getBills = asyncHandler(async (req, res) => {
  const bills = await Bill.find();
  return res.status(200).json(new ApiResponse(200, bills, "Bills fetched successfully"));
});

// ✅ Get Bill By ID
const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ billId: req.params.id });
  if (!bill) throw new ApiError(404, "Bill not found");
  return res.status(200).json(new ApiResponse(200, bill, "Bill fetched successfully"));
});

// ✅ Update Bill
const updateBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOneAndUpdate({ billId: req.params.id }, req.body, { new: true });
  if (!bill) throw new ApiError(404, "Bill not found");
  return res.status(200).json(new ApiResponse(200, bill, "Bill updated successfully"));
});

// ✅ Delete Bill
const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOneAndDelete({ billId: req.params.id });
  if (!bill) throw new ApiError(404, "Bill not found");
  return res.status(200).json(new ApiResponse(200, {}, "Bill deleted successfully"));
});

export { createBill, getBills, getBillById, updateBill, deleteBill ,generateBill};
