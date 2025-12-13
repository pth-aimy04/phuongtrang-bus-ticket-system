import express from "express";
import { getTicketByPhoneAndCode, getInvoiceBySecret } from "../controllers/invoiceController.js";
const router = express.Router();

router.get("/ticket", getTicketByPhoneAndCode);
router.get("/invoice", getInvoiceBySecret);

export default router;
