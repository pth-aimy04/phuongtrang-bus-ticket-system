import express from "express";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleTypes
} from "../controllers/vehicleController.js";

const router = express.Router();

router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);
router.get("/types/all", getVehicleTypes);
export default router;
