import sql from "mssql";
import QRCode from "qrcode";
import { poolPromise } from "../config/db.js";

//  BẮT ĐẦU THANH TOÁN
export const startPayment = async (req, res) => {
  try {
    const { booking_code, user_id, amount, method } = req.body;
    if (!booking_code || !user_id) {
      return res.status(400).json({ message: "Thiếu thông tin thanh toán!" });
    }

    const pool = await poolPromise;

    // 1. Tìm ticket_id dựa vào booking_code
    const ticketResult = await pool.request()
      .input("booking_code", sql.VarChar, booking_code)
      .query(`SELECT TOP 1 ticket_id FROM Tickets WHERE booking_code = @booking_code`);

    if (!ticketResult.recordset.length) {
      return res.status(404).json({ message: "Không tìm thấy vé tương ứng!" });
    }

    const ticket_id = ticketResult.recordset[0].ticket_id;

    //  2. Gọi stored procedure tạo hóa đơn nếu chưa có
    await pool.request()
      .input("ticket_id", sql.Int, ticket_id)
      .execute("sp_CreateInvoice");

    console.log(`✅ Hóa đơn tự động tạo cho booking_code: ${booking_code}`);

    //  3. Lưu thông tin thanh toán vào bảng Payments
    await pool.request()
      .input("ticket_id", sql.Int, ticket_id)
      .input("user_id", sql.Int, user_id)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("method", sql.NVarChar, method)
      .input("status", sql.NVarChar, "SUCCESS")
      .query(`
        INSERT INTO Payments (ticket_id, user_id, amount, method, status, transaction_time)
        VALUES (@ticket_id, @user_id, @amount, @method, @status, GETDATE());
      `);

    //  4. Cập nhật trạng thái vé
    await pool.request()
      .input("booking_code", sql.VarChar, booking_code)
      .query(`UPDATE Tickets SET payment_status = N'Đã thanh toán' WHERE booking_code = @booking_code;`);

    //  5. Trả JSON hợp lệ về frontend
    res.json({
      message: "✅ Thanh toán thành công!",
      booking_code,
      ticket_id,
      redirect: `/api/payment/callback?booking_code=${booking_code}&status=SUCCESS`
    });

  } catch (err) {
    console.error("❌ Lỗi startPayment:", err);
    res.status(500).json({ message: err.message });
  }
};

//  CALLBACK SAU KHI THANH TOÁN (HIỆN QR)
export const paymentCallback = async (req, res) => {
  const { booking_code, status } = req.query;
  const pool = await poolPromise;

  try {
    // 1. Kiểm tra booking_code
    const ticketResult = await pool.request()
      .input("booking_code", sql.VarChar, booking_code)
      .query(`
        SELECT ticket_id 
        FROM Tickets 
        WHERE booking_code = @booking_code
      `);

    if (!ticketResult.recordset.length) {
      return res.json({
        success: false,
        message: "Không tìm thấy vé!",
      });
    }

    const ticket_id = ticketResult.recordset[0].ticket_id;

    // Nếu thất bại → báo lỗi FE
    if (status !== "SUCCESS") {
      return res.json({
        success: false,
        message: "Thanh toán thất bại!",
        booking_code,
      });
    }

    // 2. Tạo QR Code
    const qrData = `BOOK:${booking_code}`;
    const qrImage = await QRCode.toDataURL(qrData);

    // 3. Cập nhật bảng Payments
    await pool.request()
      .input("ticket_id", sql.Int, ticket_id)
      .query(`
        UPDATE Payments
        SET status = 'SUCCESS', transaction_time = GETDATE()
        WHERE ticket_id = @ticket_id
      `);

    // 4. Cập nhật bảng Tickets
    await pool.request()
      .input("booking_code", sql.VarChar, booking_code)
      .input("qr", sql.NVarChar, qrImage)
      .query(`
        UPDATE Tickets
        SET payment_status = N'Đã thanh toán', qr_code = @qr
        WHERE booking_code = @booking_code
      `);

    console.log("✅ CALLBACK OK:", booking_code);

    // 5. Trả JSON chuẩn về React
    return res.json({
      success: true,
      message: "Thanh toán thành công!",
      booking_code,
      qr_code: qrImage,
    });

  } catch (err) {
    console.error("❌ Callback error:", err);
    return res.json({
      success: false,
      message: "Lỗi xử lý callback!",
    });
  }
};







