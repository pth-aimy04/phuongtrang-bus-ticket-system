import express from "express";
import { getSeatsByTrip, updateSeatStatus } from "../controllers/seatController.js";

const router = express.Router();

router.get("/trip/:trip_id", getSeatsByTrip);
router.put("/:seat_id", updateSeatStatus);

export default router;
