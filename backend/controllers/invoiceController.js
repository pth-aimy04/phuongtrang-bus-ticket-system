import { poolPromise } from "../config/db.js";
import sql from "mssql";

// API tra cứu vé
export const getTicketByPhoneAndCode = async (req, res) => {
  try {
    const { phone, booking_code } = req.query;
    console.log("📩 Nhận request tra cứu vé:", { phone, booking_code });

    if (!phone || !booking_code)
      return res.status(400).json({ message: "Thiếu thông tin tra cứu" });

    const pool = await poolPromise;
    const result = await pool.request()
      .input("phone", sql.VarChar, phone)
      .input("booking_code", sql.VarChar, booking_code)
      .query(`
  SELECT 
    t.booking_code, 
    t.booking_date, 
    t.status, 
    t.payment_status,
    t.trip_type, 
    t.direction,
    tr.price, 
    tr.departure_time,
    r.start_point, 
    r.end_point, 
    v.license_plate,
    vt.type_name AS vehicle_type   --  lấy loại xe (Limousine 11 chỗ, Giường nằm,...)
  FROM Tickets t
  JOIN Trips tr ON t.trip_id = tr.trip_id
  JOIN Routes r ON tr.route_id = r.route_id
  JOIN Vehicles v ON tr.vehicle_id = v.vehicle_id
  JOIN VehicleTypes vt ON vt.type_id = v.type_id   
  JOIN Users u ON t.user_id = u.user_id
  WHERE u.phone = @phone AND t.booking_code = @booking_code
  ORDER BY tr.departure_time;
`);


    console.log("✅ SQL kết quả:", result.recordset);

    if (!result.recordset.length)
      return res.status(404).json({ message: "Không tìm thấy vé." });

res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi BE tra cứu vé:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};


//  API tra cứu hóa đơn
export const getInvoiceBySecret = async (req, res) => {
  try {
    const { secret_code } = req.query;
    if (!secret_code) {
      return res.status(400).json({ message: "Thiếu mã bí mật hóa đơn." });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input("secret_code", sql.VarChar, secret_code)
      .query(`
        SELECT i.invoice_number, i.created_at, i.total_amount, i.status, 
               t.booking_code, u.full_name, u.email
        FROM Invoices i
        JOIN Tickets t ON i.ticket_id = t.ticket_id
        JOIN Users u ON t.user_id = u.user_id
        WHERE i.secret_code = @secret_code
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn." });
    }

    //  Format dữ liệu trả về đẹp hơn (bổ sung trường để hiện lên frontend)
    const invoice = result.recordset[0];
    res.json({
      invoice_number: invoice.invoice_number,
      secret_code,
      created_at: invoice.created_at,
      total_amount: invoice.total_amount,
      status: invoice.status,
      customer_name: invoice.full_name,
      customer_email: invoice.email,
      booking_code: invoice.booking_code
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server." });
  }
};









// lookupController.js

const handleSearchInvoice = async () => {
  if (!secretCode) {
    alert("Vui lòng nhập mã bí mật!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/invoice?secret_code=${secretCode}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);
    setInvoiceResult(data);
  } catch (err) {
    alert("❌ " + err.message);
  }
};
