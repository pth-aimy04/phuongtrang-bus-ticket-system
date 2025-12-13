import { poolPromise } from "../config/db.js";
import sql from "mssql";

//  Lấy danh sách ghế của 1 chuyến
export const getSeatsByTrip = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("trip_id", sql.Int, trip_id)
      .query("SELECT seat_id, seat_number, is_booked FROM Seats WHERE trip_id = @trip_id ORDER BY seat_number ASC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Cập nhật tình trạng ghế (đặt / hủy)
export const updateSeatStatus = async (req, res) => {
  try {
    const { seat_id } = req.params;
    const { is_booked } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input("seat_id", sql.Int, seat_id)
      .input("is_booked", sql.Bit, is_booked)
      .query("UPDATE Seats SET is_booked = @is_booked WHERE seat_id = @seat_id");

    res.json({ message: "✅ Cập nhật tình trạng ghế thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
