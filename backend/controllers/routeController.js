import sql from "mssql";
import { poolPromise } from "../config/db.js";

//  Lấy tất cả tuyến
export const getAllRoutes = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT route_id, start_point, end_point, distance_km, travel_time 
      FROM Routes
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Thêm tuyến mới
export const createRoute = async (req, res) => {
  const { start_point, end_point, distance_km, travel_time } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("start_point", sql.NVarChar, start_point)
      .input("end_point", sql.NVarChar, end_point)
      .input("distance_km", sql.Int, distance_km)
      .input("travel_time", sql.NVarChar, travel_time)
      .query(`
        INSERT INTO Routes (start_point, end_point, distance_km, travel_time)
        VALUES (@start_point, @end_point, @distance_km, @travel_time)
      `);
    res.json({ message: "✅ Thêm tuyến thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sửa tuyến
export const updateRoute = async (req, res) => {
  const { id } = req.params;
  const { start_point, end_point, distance_km, travel_time } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("start_point", sql.NVarChar, start_point)
      .input("end_point", sql.NVarChar, end_point)
      .input("distance_km", sql.Int, distance_km)
      .input("travel_time", sql.NVarChar, travel_time)
      .query(`
        UPDATE Routes 
        SET start_point = @start_point,
            end_point = @end_point,
            distance_km = @distance_km,
            travel_time = @travel_time
        WHERE route_id = @id
      `);
    res.json({ message: "✅ Cập nhật tuyến thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Xóa tuyến
export const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Routes WHERE route_id = @id");
    res.json({ message: "🗑️ Đã xóa tuyến!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getRouteById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Routes WHERE route_id = @id");

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy tuyến!" });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//  Lấy các tuyến phổ biến nhất + 1 chuyến đại diện (một chiều)
export const getPopularRoutes = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT TOP 6
        r.route_id,
        r.start_point,
        r.end_point,
        r.distance_km,
        r.travel_time,
        MIN(t.price) AS price
      FROM Routes r
      INNER JOIN Trips t ON r.route_id = t.route_id
      WHERE t.status = N'Đang mở'
      GROUP BY r.route_id, r.start_point, r.end_point, r.distance_km, r.travel_time
      ORDER BY COUNT(t.trip_id) DESC;
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Lỗi getPopularRoutes:", error);
    res.status(500).json({ error: "Lỗi khi lấy tuyến phổ biến." });
  }
};
