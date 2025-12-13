import express from "express";
import { startPayment, paymentCallback } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/start", startPayment);
router.get("/callback", paymentCallback);

export default router;
