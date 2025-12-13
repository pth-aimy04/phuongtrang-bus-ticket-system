// routes/tripRoutes.js
import { Router } from "express";
import {
  getAllTrips,
  getTripById,
  addTrip,
  updateTrip,
  deleteTrip,
  getPublicTrips,
  searchTrips,
  getFilters,
  getTripPrice,  
  cancelTrip
} from "../controllers/tripController.js";

const router = Router();

// /api/trips/...
router.get("/", getAllTrips);
router.get("/public", getPublicTrips);
router.get("/filters", getFilters);            // FE gọi /api/trips/filters
router.get("/search/public", searchTrips);     // FE gọi /api/trips/search/public
router.get("/:id", getTripById);
router.get("/:trip_id/price", getTripPrice);   // /api/trips/123/price
router.post("/", addTrip);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);
router.put("/:id/cancel", cancelTrip);



export default router;
