import sql from "mssql";
import { poolPromise } from "../config/db.js";

// LẤY DANH SÁCH XE 
export const getAllVehicles = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        v.vehicle_id,
        v.license_plate,
        vt.type_name AS vehicle_type,
        vt.total_seats,
        v.status
      FROM Vehicles v
      LEFT JOIN VehicleTypes vt ON v.type_id = vt.type_id
      ORDER BY v.vehicle_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  THÊM XE MỚI 
export const createVehicle = async (req, res) => {
  const { license_plate, type_id, status } = req.body;
  try {
    const pool = await poolPromise;

    // Kiểm tra loại xe có tồn tại không
    const checkType = await pool.request()
      .input("type_id", sql.Int, type_id)
      .query("SELECT * FROM VehicleTypes WHERE type_id = @type_id");

    if (checkType.recordset.length === 0) {
      return res.status(400).json({ error: "❌ Loại xe không tồn tại!" });
    }

    //  Thêm xe mới
    await pool.request()
      .input("license_plate", sql.NVarChar, license_plate)
      .input("type_id", sql.Int, type_id)
      .input("status", sql.NVarChar, status)
      .query(`
        INSERT INTO Vehicles (license_plate, type_id, status)
        VALUES (@license_plate, @type_id, @status)
      `);

    res.json({ message: "✅ Thêm xe thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CẬP NHẬT XE 
export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { license_plate, type_id, status } = req.body;

  try {
    const pool = await poolPromise;

    //  Kiểm tra loại xe có tồn tại không
    const checkType = await pool.request()
      .input("type_id", sql.Int, type_id)
      .query("SELECT * FROM VehicleTypes WHERE type_id = @type_id");

    if (checkType.recordset.length === 0) {
      return res.status(400).json({ error: "❌ Loại xe không hợp lệ!" });
    }

    await pool.request()
      .input("id", sql.Int, id)
      .input("license_plate", sql.NVarChar, license_plate)
      .input("type_id", sql.Int, type_id)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE Vehicles
        SET license_plate = @license_plate,
            type_id = @type_id,
            status = @status
        WHERE vehicle_id = @id
      `);

    res.json({ message: "✏️ Cập nhật xe thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// XÓA XE
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;

    //  Kiểm tra nếu xe đang được dùng trong chuyến
    const checkTrip = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT COUNT(*) AS count FROM Trips WHERE vehicle_id = @id");

    if (checkTrip.recordset[0].count > 0) {
      return res.status(400).json({
        error: "🚫 Không thể xóa xe này vì đang được sử dụng trong chuyến!",
      });
    }

    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Vehicles WHERE vehicle_id = @id");

    res.json({ message: "🗑️ Xóa xe thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  LẤY 1 XE 
export const getVehicleById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          v.*, 
          vt.type_name, 
          vt.total_seats
        FROM Vehicles v
        LEFT JOIN VehicleTypes vt ON v.type_id = vt.type_id
        WHERE v.vehicle_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy xe!" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//  LẤY DANH SÁCH LOẠI XE (CHO DROPDOWN) 
export const getVehicleTypes = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT type_id, type_name, total_seats FROM VehicleTypes ORDER BY type_name ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
