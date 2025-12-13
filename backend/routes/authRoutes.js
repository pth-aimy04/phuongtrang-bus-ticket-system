import express from "express";
import { sendOTP, verifyOTPAndReset, changePassword} from "../controllers/passwordController.js";
const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/reset-with-otp", verifyOTPAndReset);
router.put("/change-password/:id", changePassword);
export default router;
