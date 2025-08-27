// routes/customerRoutes.js
import { Router } from "express";
import {
 createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer
} from "../controllers/customer.controller.js";

const router = Router();

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 */

router.route("/create").post(createCustomer)

/**
 * @route   GET /api/customers
 * @desc    Get all customers
 */

router.route("/list").get(getCustomers)


/**
 * @route   GET /api/customers/:id
 * @desc    Get single customer by ID
 */

router.route("/get/:id").get(getCustomerById)

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer details
 */
router.put("/update/:id", updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer
 */
router.delete("/delete/:id", deleteCustomer);

export default router;
