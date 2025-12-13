import sql from "mssql";
import { poolPromise } from "../config/db.js";


// Lấy toàn bộ danh sách vé (cho admin)
export const getAllTickets = async (req, res) => {
  try {
    const pool = await poolPromise;

    // Các vé thuộc chuyến đã khởi hành sẽ chuyển sang "Đã hết hạn"
    await pool.request().query(`
      UPDATE Tickets
      SET status = N'Hoàn tất'
      WHERE status = N'Đã đặt'
      AND trip_id IN (
        SELECT trip_id FROM Trips WHERE departure_time < GETDATE()
      );
    `);

    //  2Lấy danh sách vé sau khi cập nhật trạng thái
    const result = await pool.request().query(`
      SELECT 
        MIN(t.booking_date) AS booking_date,
        t.booking_code,
        u.full_name AS customer_name,
        r.start_point, 
        r.end_point,
        tr.departure_time,
        tr.price,
        STRING_AGG(s.seat_number, ', ') AS seat_numbers,
        COUNT(s.seat_id) * tr.price AS total_price,
        t.payment_status,
        MAX(t.status) AS status
      FROM Tickets t
      JOIN Users u ON u.user_id = t.user_id
      JOIN Trips tr ON tr.trip_id = t.trip_id
      JOIN Routes r ON r.route_id = tr.route_id
      JOIN Seats s ON s.seat_id = t.seat_id
      GROUP BY 
        t.booking_code, 
        u.full_name, 
        r.start_point, 
        r.end_point, 
        tr.departure_time, 
        tr.price, 
        t.payment_status
      ORDER BY MIN(t.booking_date) DESC;
    `);

    // 3Trả dữ liệu về frontend
    res.json(result.recordset);

  } catch (err) {
    console.error("❌ Lỗi getAllTickets:", err);
    res.status(500).json({ error: err.message });
  }
};


//  Lấy danh sách vé của người dùng
export const getTicketsByUser = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = parseInt(req.params.user_id);

    const result = await pool.request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT 
          t.booking_code,
          MIN(t.booking_date) AS booking_date,
          MIN(t.status) AS status,
          MIN(t.payment_status) AS payment_status,
          r.start_point,
          r.end_point,
          tr.departure_time,
          tr.price,
          STRING_AGG(s.seat_number, ', ') AS seat_numbers
        FROM Tickets t
        LEFT JOIN Trips tr ON t.trip_id = tr.trip_id
        LEFT JOIN Routes r ON tr.route_id = r.route_id
        LEFT JOIN Seats s ON t.seat_id = s.seat_id
        WHERE t.user_id = @user_id
        GROUP BY 
          t.booking_code, r.start_point, r.end_point, tr.departure_time, tr.price
        ORDER BY MIN(t.booking_date) DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi getTicketsByUser:", err);
    res.status(500).json({ error: err.message });
  }
};


//đặt vé
export const bookTicket = async (req, res) => {
  const {
    user_id,
    trip_id,
    seat_ids = [],
    return_trip_id = null,
    return_seat_ids = [],
  } = req.body;

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const bookingCode =
      "MYTRIP-" + Math.floor(10000 + Math.random() * 90000);
    const now = new Date();

    //  Gộp cả hai chiều (nếu có)
    const allTrips = [
      { trip_id, seats: seat_ids },
      ...(return_trip_id ? [{ trip_id: return_trip_id, seats: return_seat_ids }] : []),
    ];

    for (const trip of allTrips) {
      for (const seat_id of trip.seats) {
        const seatReq = new sql.Request(transaction);
        const seatCheck = await seatReq
          .input("seat_id", sql.Int, seat_id)
          .query("SELECT is_booked FROM Seats WHERE seat_id = @seat_id");

        if (!seatCheck.recordset[0])
          throw new Error(`Không tìm thấy ghế ${seat_id}`);
        if (seatCheck.recordset[0].is_booked)
          throw new Error(`Ghế ${seat_id} đã được đặt.`);

        // Thêm vé
       await new sql.Request(transaction)
  .input("user_id", sql.Int, user_id)
  .input("trip_id", sql.Int, trip.trip_id)
  .input("seat_id", sql.Int, seat_id)
  .input("booking_code", sql.VarChar, bookingCode)
  .input("booking_date", sql.DateTime, now)
  .input("trip_type", sql.NVarChar, return_trip_id ? "Khứ hồi" : "Một chiều")
  .input("direction", sql.NVarChar, trip.trip_id === trip_id ? "Đi" : "Về")
  .input("status", sql.NVarChar, "Đã đặt")
  .input("payment_status", sql.VarChar, "UNPAID")
  .query(`
    INSERT INTO Tickets (
      user_id, trip_id, seat_id, booking_code, booking_date, status, payment_status, trip_type, direction
    )
    VALUES (
      @user_id, @trip_id, @seat_id, @booking_code, @booking_date, @status, @payment_status, @trip_type, @direction
    );
  `);

        //  Cập nhật ghế đã đặt
        await new sql.Request(transaction)
          .input("seat_id", sql.Int, seat_id)
          .query("UPDATE Seats SET is_booked = 1 WHERE seat_id = @seat_id");
      }

      //  Cập nhật số ghế trống
      await new sql.Request(transaction)
        .input("trip_id", sql.Int, trip.trip_id)
        .input("count", sql.Int, trip.seats.length)
        .query(`
          UPDATE Trips 
          SET available_seats = available_seats - @count 
          WHERE trip_id = @trip_id
        `);

      //  Kiểm tra trạng thái chuyến
      const tripInfo = await new sql.Request(transaction)
        .input("trip_id", sql.Int, trip.trip_id)
        .query(`
          SELECT available_seats, departure_time 
          FROM Trips 
          WHERE trip_id = @trip_id
        `);

      if (tripInfo.recordset.length > 0) {
        const { available_seats, departure_time } = tripInfo.recordset[0];
        let newStatus = "Đang mở";
        if (available_seats <= 0) {
          newStatus = "Đã đóng";
        } else if (new Date(departure_time) < new Date()) {
          newStatus = "Đã khởi hành";
        }

        await new sql.Request(transaction)
          .input("trip_id", sql.Int, trip.trip_id)
          .input("status", sql.NVarChar, newStatus)
          .query("UPDATE Trips SET status = @status WHERE trip_id = @trip_id");
      }
    }

    await transaction.commit();

    // TỰ ĐỘNG TẠO HÓA ĐƠN SAU KHI ĐẶT VÉ
    try {
      const invoicePool = await poolPromise;
      const ticketResult = await invoicePool.request()
        .input("booking_code", sql.VarChar, bookingCode)
        .query(`SELECT TOP 1 ticket_id FROM Tickets WHERE booking_code = @booking_code`);

      if (ticketResult.recordset.length > 0) {
        const ticketId = ticketResult.recordset[0].ticket_id;
        await invoicePool.request()
          .input("ticket_id", sql.Int, ticketId)
          .execute("sp_CreateInvoice");
        console.log(`✅ Hóa đơn tự động tạo cho booking_code: ${bookingCode}`);
      }
    } catch (invoiceErr) {
      console.error("⚠️ Không thể tạo hóa đơn tự động:", invoiceErr);
    }

    //  Phản hồi cho FE
    res.json({
      message: "🎟️ Đặt vé thành công!",
      booking_code: bookingCode,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi bookTicket:", err);
    res.status(500).json({ message: err.message });
  }
};

// lấy chi tiết vé (dựa theo booking_code)
export const getTicketDetailById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const ticketId = req.params.ticket_id;

    // Lấy booking_code từ ticket_id
    const bookingCodeResult = await pool.request()
      .input("ticket_id", sql.Int, ticketId)
      .query("SELECT booking_code FROM Tickets WHERE ticket_id = @ticket_id");

    if (bookingCodeResult.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy vé" });

    const bookingCode = bookingCodeResult.recordset[0].booking_code;

    // Lấy toàn bộ vé trong cùng booking_code
    const result = await pool.request()
      .input("booking_code", sql.VarChar, bookingCode)
      .query(`
        SELECT 
          t.booking_code,
          t.booking_date,
          t.status,
          t.payment_status,
          t.qr_code,
          u.full_name AS customer_name,
          r.start_point,
          r.end_point,
          tr.departure_time,
          tr.price,
          STRING_AGG(CAST(s.seat_number AS NVARCHAR(MAX)), ', ') AS seat_numbers,
          COUNT(s.seat_id) AS seat_count,
          (COUNT(s.seat_id) * tr.price) AS total_price
        FROM Tickets t
        JOIN Users u ON t.user_id = u.user_id
        JOIN Trips tr ON t.trip_id = tr.trip_id
        JOIN Routes r ON tr.route_id = r.route_id
        JOIN Seats s ON t.seat_id = s.seat_id
        WHERE t.booking_code = @booking_code
        GROUP BY 
          t.booking_code, t.booking_date, t.status, 
          t.payment_status, t.qr_code,
          u.full_name, r.start_point, r.end_point, tr.departure_time, tr.price
      `);

    if (!result.recordset.length)
      return res.status(404).json({ message: "Không tìm thấy dữ liệu vé theo mã" });

    res.json(result.recordset[0]);

  } catch (err) {
    console.error("❌ Lỗi getTicketDetailById:", err);
    res.status(500).json({ error: err.message });
  }
};

//  Hủy vé
export const cancelTicket = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;

    // 1Kiểm tra vé
    const check = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT trip_id, seat_id, departure_time, booking_code
        FROM Tickets 
        JOIN Trips ON Tickets.trip_id = Trips.trip_id 
        WHERE ticket_id = @id
      `);

    if (check.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy vé." });

    const { seat_id, departure_time, booking_code } = check.recordset[0];

    // 2Chỉ hủy nếu còn > 60 phút
    const diff = new Date(departure_time) - new Date();
    if (diff < 60 * 60 * 1000)
      return res.status(400).json({ message: "⛔ Vé sắp khởi hành, không thể hủy." });

    // 3 Hủy toàn bộ vé cùng booking_code
    await pool.request()
      .input("booking_code", sql.VarChar, booking_code)
      .query("UPDATE Tickets SET status = N'Đã hủy' WHERE booking_code = @booking_code");

    // 4 Mở lại ghế
    await pool.request()
      .input("seat_id", sql.Int, seat_id)
      .query("UPDATE Seats SET is_booked = 0 WHERE seat_id = @seat_id");

    res.json({ message: "✅ Hủy vé thành công (toàn bộ ghế trong đơn hàng)." });
  } catch (err) {
    console.error("❌ Lỗi cancelTicket:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getTicketDetailByBookingCode = async (req, res) => {
  try {
    const { booking_code } = req.query;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("booking_code", sql.NVarChar, booking_code)
      .query(`
SELECT 
  t.direction,
  t.trip_type,
  t.booking_code,
  MIN(t.booking_date) AS booking_date,
  MAX(t.status) AS status,

  CASE 
    WHEN COUNT(CASE WHEN LTRIM(RTRIM(t.payment_status)) COLLATE Vietnamese_CI_AS LIKE N'%Đã thanh toán%' THEN 1 END) > 0
      THEN N'Đã thanh toán'
    ELSE N'Chưa thanh toán'
  END AS payment_status,

  MAX(t.qr_code) AS qr_code,
  u.full_name AS customer_name,
  u.phone AS customer_phone,
  r.start_point, 
  r.end_point,
  tr.departure_time, 
  vt.type_name AS vehicle_type,     -- ✅ THÊM DÒNG NÀY VÀO SELECT
  v.license_plate,                  -- (tuỳ chọn) biển số
  tr.price,
  STRING_AGG(CAST(s.seat_number AS NVARCHAR(10)), ', ') AS seat_numbers,
  COUNT(*) AS seat_count,
  COUNT(*) * tr.price AS total_price
FROM Tickets t
JOIN Users u ON u.user_id = t.user_id
JOIN Trips tr ON tr.trip_id = t.trip_id
JOIN Routes r ON r.route_id = tr.route_id
JOIN Seats s ON s.seat_id = t.seat_id
JOIN Vehicles v ON v.vehicle_id = tr.vehicle_id
JOIN VehicleTypes vt ON vt.type_id = v.type_id
WHERE t.booking_code = @booking_code
GROUP BY 
  t.direction, t.trip_type, t.booking_code,
  u.full_name, u.phone,
  r.start_point, r.end_point,
  tr.departure_time, tr.price, 
  v.license_plate, vt.type_name     -- vẫn giữ trong GROUP BY
ORDER BY tr.departure_time;


      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy vé nào với mã đặt này!" });
    }

    return res.status(200).json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi getTicketDetailByBookingCode:", err);
    res.status(500).json({ error: err.message });
  }
};





// ==================== LỊCH SỬ MUA VÉ CỦA NGƯỜI DÙNG ====================
export const getTicketHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT 
          t.ticket_id,
          t.booking_date,
          t.status,
          t.payment_status,
          t.booking_code,
          r.start_point,
          r.end_point,
          tr.departure_time,
          tr.price,
          v.license_plate
        FROM Tickets t
        JOIN Trips tr ON t.trip_id = tr.trip_id
        JOIN Vehicles v ON tr.vehicle_id = v.vehicle_id
        JOIN Routes r ON tr.route_id = r.route_id
        WHERE t.user_id = @userId
        ORDER BY t.booking_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi lấy lịch sử vé:", err);
    res.status(500).json({ message: "Lỗi server khi lấy lịch sử vé" });
  }
};

//  Hủy vé theo mã booking_code (admin)
export const cancelTicketByBookingCode = async (req, res) => {
  const { booking_code } = req.params;
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    //  Lấy thông tin chuyến và thời gian khởi hành
    const result = await new sql.Request(transaction)
      .input("booking_code", sql.VarChar, booking_code)
      .query(`
        SELECT t.seat_id, t.trip_id, tr.departure_time, t.status
        FROM Tickets t
        JOIN Trips tr ON t.trip_id = tr.trip_id
        WHERE t.booking_code = @booking_code
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy mã vé." });

    const { departure_time, status } = result.recordset[0];
    const now = new Date();
    const diffMs = new Date(departure_time) - now;

    //  Nếu vé đã qua giờ khởi hành
    if (diffMs < 0) {
      await new sql.Request(transaction)
        .input("booking_code", sql.VarChar, booking_code)
        .query(`UPDATE Tickets SET status = N'Đã hết hạn' WHERE booking_code = @booking_code`);
      await transaction.commit();
      return res.status(400).json({ message: "🚫 Vé đã qua giờ khởi hành, tự động chuyển sang 'Đã hết hạn'." });
    }

    //  Nếu vé còn dưới 60 phút
    if (diffMs < 60 * 60 * 1000)
      return res.status(400).json({ message: "⛔ Vé sắp khởi hành, không thể hủy." });

    //  Nếu vẫn còn thời gian thì cho phép hủy
    await new sql.Request(transaction)
      .input("booking_code", sql.VarChar, booking_code)
      .query(`UPDATE Tickets SET status = N'Đã hủy' WHERE booking_code = @booking_code`);

    // Mở lại ghế
    for (const s of result.recordset) {
      await new sql.Request(transaction)
        .input("seat_id", sql.Int, s.seat_id)
        .query(`UPDATE Seats SET is_booked = 0 WHERE seat_id = @seat_id`);
    }

    await transaction.commit();
    res.json({ message: "✅ Hủy vé thành công (ghế đã mở lại)." });
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Lỗi cancelTicketByBookingCode:", err);
    res.status(500).json({ error: err.message });
  }
};


