import { Router } from "express";
import { 
    createBill, 
    getBills, 
    getBillById, 
    updateBill, 
    deleteBill 
} from "../controllers/bill.controller.js";


const router = Router();

// secured routes (only logged-in users can access)
router.route("/create").post( createBill);

router.route("/").get( getBills);

router.route("/:id").get( getBillById);

router.route("/:id").put( updateBill);

router.route("/:id").delete( deleteBill);

export default router
