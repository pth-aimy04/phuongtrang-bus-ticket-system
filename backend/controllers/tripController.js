import { poolPromise } from "../config/db.js";
import sql from "mssql";

//    LẤY DANH SÁCH CHUYẾN   
export const getAllTrips = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        t.trip_id, 
        r.start_point, 
        r.end_point, 
        v.license_plate, 
        vt.type_name AS vehicle_type,
        vt.total_seats,
        t.departure_time, 
        t.price, 
        t.available_seats, 
        t.status
      FROM Trips t
      LEFT JOIN Routes r ON t.route_id = r.route_id
      LEFT JOIN Vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN VehicleTypes vt ON v.type_id = vt.type_id
      ORDER BY t.trip_id DESC
    `);

    const trips = result.recordset;
    const now = new Date();

    for (const t of trips) {
      const depTime = new Date(t.departure_time);
      let newStatus = t.status;

if (t.status !== "Đã huỷ") {
  if (depTime < now) newStatus = "Đã khởi hành";
  else if (t.available_seats <= 0) newStatus = "Đã đóng";
  else newStatus = "Đang mở";
}


      if (newStatus !== t.status) {
        await pool.request()
          .input("id", sql.Int, t.trip_id)
          .input("status", sql.NVarChar, newStatus)
          .query("UPDATE Trips SET status = @status WHERE trip_id = @id");
        t.status = newStatus;
      }
    }

    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//    LẤY 1 CHUYẾN   
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          t.*, 
          v.license_plate, 
          vt.type_name, 
          vt.total_seats
        FROM Trips t
        LEFT JOIN Vehicles v ON t.vehicle_id = v.vehicle_id
        LEFT JOIN VehicleTypes vt ON v.type_id = vt.type_id
        WHERE t.trip_id = @id
      `);
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//    THÊM CHUYẾN   
export const addTrip = async (req, res) => {
  const { route_id, vehicle_id, departure_time, price } = req.body;

  try {
    const pool = await poolPromise;

    // Kiểm tra xe trùng tuyến & thời gian
    const overlapCheck = await pool.request()
      .input("vehicle_id", sql.Int, vehicle_id)
      .input("route_id", sql.Int, route_id)
      .input("departure_time", sql.DateTime, departure_time)
      .query(`
        SELECT COUNT(*) AS count
        FROM Trips
        WHERE vehicle_id = @vehicle_id
          AND route_id = @route_id
          AND ABS(DATEDIFF(MINUTE, departure_time, @departure_time)) < 120
      `);

    if (overlapCheck.recordset[0].count > 0)
      return res.status(400).json({ error: "🚫 Xe này đã có chuyến cùng tuyến và trùng thời gian khởi hành!" });

    // Lấy tổng số ghế từ VehicleTypes
    const vehicleInfo = await pool.request()
      .input("vehicle_id", sql.Int, vehicle_id)
      .query(`
        SELECT vt.total_seats 
        FROM Vehicles v
        JOIN VehicleTypes vt ON v.type_id = vt.type_id
        WHERE v.vehicle_id = @vehicle_id
      `);

    if (vehicleInfo.recordset.length === 0)
      return res.status(400).json({ error: "❌ Xe không tồn tại hoặc chưa có loại xe!" });

    const maxSeats = vehicleInfo.recordset[0].total_seats;
    const now = new Date();
    const depDate = new Date(departure_time);

    if (depDate < now)
      return res.status(400).json({ error: "⚠️ Ngày đi phải từ hiện tại trở đi!" });

    // Thêm chuyến
    const result = await pool.request()
      .input("route_id", sql.Int, route_id)
      .input("vehicle_id", sql.Int, vehicle_id)
      .input("departure_time", sql.DateTime, departure_time)
      .input("price", sql.Decimal(10, 2), price)
      .input("available_seats", sql.Int, maxSeats)
      .input("status", sql.NVarChar, "Đang mở")
      .query(`
        INSERT INTO Trips (route_id, vehicle_id, departure_time, price, available_seats, status)
        OUTPUT INSERTED.trip_id
        VALUES (@route_id, @vehicle_id, @departure_time, @price, @available_seats, @status)
      `);

    const tripId = result.recordset[0].trip_id;

    // Tạo ghế tự động
//  Kiểm tra nếu đã tồn tại ghế thì không tạo lại
const checkSeats = await pool.request()
  .input("trip_id", sql.Int, tripId)
  .query("SELECT COUNT(*) AS count FROM Seats WHERE trip_id = @trip_id");

if (checkSeats.recordset[0].count === 0) {
  for (let i = 1; i <= maxSeats; i++) {
    await pool.request()
      .input("trip_id", sql.Int, tripId)
      .input("seat_number", sql.NVarChar, i.toString())
      .input("is_booked", sql.Bit, 0)
      .query(`
        INSERT INTO Seats (trip_id, seat_number, is_booked)
        VALUES (@trip_id, @seat_number, @is_booked)
      `);
  }
}


    res.json({ message: `✅ Thêm chuyến và tạo ${maxSeats} ghế tự động thành công!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//    CẬP NHẬT CHUYẾN   
export const updateTrip = async (req, res) => {
  const { id } = req.params;
  const { route_id, vehicle_id, departure_time, price, available_seats } = req.body;

  try {
    const pool = await poolPromise;

    //  Kiểm tra trùng chuyến
    const overlapCheck = await pool.request()
      .input("trip_id", sql.Int, id)
      .input("vehicle_id", sql.Int, vehicle_id)
      .input("route_id", sql.Int, route_id)
      .input("departure_time", sql.DateTime, departure_time)
      .query(`
        SELECT COUNT(*) AS count
        FROM Trips
        WHERE vehicle_id = @vehicle_id
          AND route_id = @route_id
          AND trip_id != @trip_id
          AND ABS(DATEDIFF(MINUTE, departure_time, @departure_time)) < 120
      `);

    if (overlapCheck.recordset[0].count > 0)
      return res.status(400).json({ error: "🚫 Xe này đã có chuyến cùng tuyến và trùng thời gian khởi hành!" });

    //  Lấy tổng ghế
    const vehicleInfo = await pool.request()
      .input("vehicle_id", sql.Int, vehicle_id)
      .query(`
        SELECT vt.total_seats 
        FROM Vehicles v
        JOIN VehicleTypes vt ON v.type_id = vt.type_id
        WHERE v.vehicle_id = @vehicle_id
      `);

    const maxSeats = vehicleInfo.recordset[0].total_seats;
    if (available_seats > maxSeats)
      return res.status(400).json({ error: "⚠️ Số ghế trống không được lớn hơn số ghế xe!" });

    const finalStatus = available_seats === 0 ? "Đã đóng" : "Đang mở";

    await pool.request()
      .input("id", sql.Int, id)
      .input("route_id", sql.Int, route_id)
      .input("vehicle_id", sql.Int, vehicle_id)
      .input("departure_time", sql.DateTime, departure_time)
      .input("price", sql.Decimal(10, 2), price)
      .input("available_seats", sql.Int, available_seats)
      .input("status", sql.NVarChar, finalStatus)
      .query(`
        UPDATE Trips
        SET route_id = @route_id,
            vehicle_id = @vehicle_id,
            departure_time = @departure_time,
            price = @price,
            available_seats = @available_seats,
            status = @status
        WHERE trip_id = @id
      `);

    res.json({ message: "✏️ Cập nhật chuyến thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//    XÓA CHUYẾN   
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request().input("id", sql.Int, id).query("DELETE FROM Seats WHERE trip_id = @id");
    await pool.request().input("id", sql.Int, id).query("DELETE FROM Trips WHERE trip_id = @id");

    res.json({ message: "🗑️ Đã xóa chuyến và toàn bộ ghế!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//    LẤY CHUYẾN PUBLIC (HOME)   
export const getPublicTrips = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { from, to, date, type } = req.query; 

    // Cập nhật trạng thái
    await pool.request().query(`
      UPDATE Trips SET status = N'Đã khởi hành' WHERE departure_time <= GETDATE() AND status = N'Đang mở';
      UPDATE Trips SET status = N'Đã đóng' WHERE available_seats <= 0 AND status = N'Đang mở';
    `);

    // Lấy chiều đi 
    const goTrips = await pool.request()
      .input("from", sql.NVarChar, from)
      .input("to", sql.NVarChar, to)
      .input("date", sql.Date, date)
      .query(`
        SELECT 
          t.trip_id, r.start_point, r.end_point,
          CONCAT(r.start_point, N' → ', r.end_point) AS route_name,
          v.license_plate, vt.type_name AS vehicle_type,
          t.departure_time, t.price, t.available_seats, t.status
        FROM Trips t
        JOIN Routes r ON t.route_id = r.route_id
        JOIN Vehicles v ON t.vehicle_id = v.vehicle_id
        JOIN VehicleTypes vt ON v.type_id = vt.type_id
WHERE r.start_point = @from 
  AND r.end_point = @to
  AND CONVERT(date, t.departure_time) = @date
  AND t.available_seats > 0
  AND t.status IN (N'Đang mở', N'Đã đóng')  -- vẫn cho hiển thị chuyến có ghế
ORDER BY t.departure_time ASC

      `);

    let returnTrips = [];

    // Nếu là khứ hồi thì lấy chiều ngược lại 
    if (type === "roundtrip") {
      const resReturn = await pool.request()
        .input("from", sql.NVarChar, to)
        .input("to", sql.NVarChar, from)
        .input("date", sql.Date, date)
        .query(`
          SELECT 
            t.trip_id, r.start_point, r.end_point,
            CONCAT(r.start_point, N' → ', r.end_point) AS route_name,
            v.license_plate, vt.type_name AS vehicle_type,
            t.departure_time, t.price, t.available_seats, t.status
          FROM Trips t
          JOIN Routes r ON t.route_id = r.route_id
          JOIN Vehicles v ON t.vehicle_id = v.vehicle_id
          JOIN VehicleTypes vt ON v.type_id = vt.type_id
WHERE r.start_point = @from 
  AND r.end_point = @to
  AND CONVERT(date, t.departure_time) = @date
  AND t.available_seats > 0
  AND t.status IN (N'Đang mở', N'Đã đóng')  -- vẫn cho hiển thị chuyến có ghế
ORDER BY t.departure_time ASC

        `);
      returnTrips = resReturn.recordset;
    }

    res.json({
      goTrips: goTrips.recordset,
      returnTrips,
    });
  } catch (err) {
    console.error("❌ Lỗi getPublicTrips:", err);
    res.status(500).json({ error: err.message });
  }
};


//    TÌM KIẾM CHUYẾN (BOOKING)   
export const searchTrips = async (req, res) => {
  const pool = await poolPromise;
  const { go_id, from, to, date } = req.query;

  try {
    if (go_id) {
      const goTrip = await pool.request().input("id", sql.Int, go_id).query(`SELECT * FROM Trips WHERE trip_id = @id`);
      const goSeats = await pool.request().input("trip_id", sql.Int, go_id).query(`SELECT * FROM Seats WHERE trip_id = @trip_id`);

      return res.json({
        goTrip: goTrip.recordset[0],
        goSeats: goSeats.recordset
      });
    }

    if (from && to && date) {
      const result = await pool.request()
        .input("from", sql.NVarChar, from)
        .input("to", sql.NVarChar, to)
        .input("date", sql.Date, date)
        .query(`
          SELECT 
            t.trip_id, r.start_point, r.end_point,
            CONCAT(r.start_point, N' → ', r.end_point) AS route_name,
            v.license_plate, vt.type_name AS vehicle_type,
            t.departure_time, t.price, t.available_seats, t.status
          FROM Trips t
          JOIN Routes r ON t.route_id = r.route_id
          JOIN Vehicles v ON t.vehicle_id = v.vehicle_id
          JOIN VehicleTypes vt ON v.type_id = vt.type_id
WHERE r.start_point = @from 
  AND r.end_point = @to
  AND CONVERT(date, t.departure_time) = @date
  AND t.available_seats > 0
  AND t.status IN (N'Đang mở', N'Đã đóng')  -- vẫn cho hiển thị chuyến có ghế
ORDER BY t.departure_time ASC

        `);

      return res.json(result.recordset);
    }

    return res.status(400).json({ message: "Thiếu tham số chuyến!" });
  } catch (err) {
    console.error("❌ Lỗi searchTrips:", err);
    res.status(500).json({ message: "Lỗi khi tìm chuyến xe." });
  }
};


//  BỘ LỌC (Giờ + Loại xe)   
export const getFilters = async (req, res) => {
  try {
    const pool = await poolPromise;

    const vehicleTypes = await pool.request().query(`
      SELECT DISTINCT vt.type_name AS vehicle_type
      FROM VehicleTypes vt
      JOIN Vehicles v ON vt.type_id = v.type_id
      JOIN Trips t ON v.vehicle_id = t.vehicle_id
      WHERE t.status = N'Đang mở'
    `);

    const hours = [
      "Sáng sớm 00:00 - 06:00",
      "Buổi sáng 06:00 - 12:00",
      "Buổi chiều 12:00 - 18:00",
      "Buổi tối 18:00 - 24:00",
    ];

    res.json({ hours, types: vehicleTypes.recordset.map(t => t.vehicle_type) });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy dữ liệu bộ lọc." });
  }
};

//    LẤY GIÁ VÉ THEO MÃ CHUYẾN   
export const getTripPrice = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("trip_id", sql.Int, trip_id)
      .query("SELECT price FROM Trips WHERE trip_id = @trip_id");

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy chuyến xe!" });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//HỦY CHUYẾN
export const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    //  Cập nhật trạng thái chuyến -> luôn làm đầu tiên
    await pool.request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE Trips
        SET status = N'Đã huỷ'
        WHERE trip_id = @id;
      `);

    //  Cập nhật trạng thái vé chưa khởi hành
   await pool.request()
  .input("trip_id", sql.Int, id)
  .query(`
    UPDATE Tickets
    SET status = N'Chờ hoàn tiền'
    WHERE booking_code IN (
      SELECT booking_code FROM Tickets WHERE trip_id = @trip_id
    )
    AND payment_status = N'Đã thanh toán';
  `);

await pool.request()
  .input("trip_id", sql.Int, id)
  .query(`
    INSERT INTO Notifications (user_id, booking_code, message, created_at)
    SELECT DISTINCT t.user_id, t.booking_code,
      N'Vé của bạn (mã: ' + t.booking_code + N') có một chuyến đã bị hủy. Hệ thống đang xử lý hoàn tiền.',
      GETDATE()
    FROM Tickets t
    WHERE t.trip_id = @trip_id
      AND NOT EXISTS (
        SELECT 1 FROM Notifications n WHERE n.booking_code = t.booking_code
      );
  `);


    //  Trả phản hồi
    res.json({ message: "🚫 Đã huỷ chuyến, cập nhật vé và gửi thông báo hoàn tiền!" });

  } catch (err) {
    console.error("❌ Lỗi huỷ chuyến:", err);
    res.status(500).json({ error: err.message });
  }
};





