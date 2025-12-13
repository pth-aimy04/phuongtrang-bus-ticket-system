import express from "express";
import { createMomoPayment, momoIPN } from "../controllers/paymentMomoController.js";

const router = express.Router();

router.post("/create", createMomoPayment);   // tạo QR
router.post("/ipn", momoIPN);                // IPN callback

export default router;
