import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Customer} from '../models/Customer.model.js';

// ✅ Create Customer
const createCustomer = asyncHandler(async (req, res) => {
  const {  name, email, phone, address } = req.body;


  if ([ name, email, phone, address].some((f) => !f?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const exists = await Customer.findOne({ $or: [{ name }, { email }] });
  if (exists) throw new ApiError(409, "Customer already exists");

  const customer = await Customer.create(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, customer, "Customer created successfully"));
});

// ✅ Get All Customers
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find();
  return res
    .status(200)
    .json(new ApiResponse(200, customers, "Customers fetched successfully"));
});

// ✅ Get Customer By ID
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id });
  if (!customer) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(new ApiResponse(200, customer, "Customer fetched successfully"));
});

// ✅ Update Customer
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { customerId: req.params.id },
    req.body,
    { new: true }
  );
  if (!customer) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(new ApiResponse(200, customer, "Customer updated successfully"));
});

// ✅ Delete Customer
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndDelete({ customerId: req.params.id });
  if (!customer) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Customer deleted successfully"));
});

export { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer };
