import express from "express";
import { poolPromise } from "../config/db.js";
import sql from "mssql";

const router = express.Router();

// Doanh thu hôm nay
router.get("/dash/today", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().execute("sp_DoanhThuHomNay");
  res.json(result.recordset[0]);
});

// Tổng doanh thu
router.get("/dash/total", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().execute("sp_TongDoanhThu");
  res.json(result.recordset[0]);
});

// Doanh thu theo tuyến
router.get("/dash/route", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().execute("sp_DoanhThuTheoTuyen");
  res.json(result.recordset);
});

export default router;




