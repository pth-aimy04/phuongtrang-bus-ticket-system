import express from "express";
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getPopularRoutes,
} from "../controllers/routeController.js";

const router = express.Router();

router.get("/", getAllRoutes);
router.get("/popular", getPopularRoutes);
router.get("/:id", getRouteById);
router.post("/", createRoute);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);


export default router;
