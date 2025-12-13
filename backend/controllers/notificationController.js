import { poolPromise } from "../config/db.js";
import sql from "mssql";

//  Lấy danh sách thông báo theo user_id
export const getByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("user_id", sql.Int, user_id)
      .query(`
        SELECT noti_id, user_id, booking_code, message, created_at, is_read
        FROM Notifications
        WHERE user_id = @user_id
        ORDER BY created_at DESC;
      `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi lấy thông báo:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

//  Đánh dấu 1 thông báo là "đã đọc"
export const markAsRead = async (req, res) => {
  try {
    const { noti_id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("noti_id", sql.Int, noti_id)
      .query(`
        UPDATE Notifications
        SET is_read = 1
        WHERE noti_id = @noti_id;
      `);

    res.json({ message: "✅ Đã đánh dấu thông báo là đã đọc." });
  } catch (err) {
    console.error("❌ Lỗi cập nhật thông báo:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

//  Xoá 1 thông báo
export const deleteNotification = async (req, res) => {
  try {
    const { noti_id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("noti_id", sql.Int, noti_id)
      .query(`
        DELETE FROM Notifications
        WHERE noti_id = @noti_id;
      `);

    res.json({ message: "🗑️ Đã xoá thông báo." });
  } catch (err) {
    console.error("❌ Lỗi xoá thông báo:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
