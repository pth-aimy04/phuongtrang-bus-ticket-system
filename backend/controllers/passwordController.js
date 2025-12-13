import dotenv from "dotenv";
import nodemailer from "nodemailer";
import sql from "mssql";
import bcrypt from "bcrypt";
import { poolPromise } from "../config/db.js";

dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
};

// Cấu hình gửi Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Gửi OTP
export const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (user.recordset.length === 0)
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });

    // Sinh OTP ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await pool
      .request()
      .input("otp", sql.VarChar, otp)
      .input("expiry", sql.DateTime, expiry)
      .input("email", sql.VarChar, email)
      .query("UPDATE Users SET reset_token = @otp, reset_expiry = @expiry WHERE email = @email");

    const mailOptions = {
      from: `"MyTrip Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã OTP khôi phục mật khẩu MyTrip",
      html: `
        <h3>Xin chào ${user.recordset[0].full_name},</h3>
        <p>Mã OTP khôi phục mật khẩu của bạn là:</p>
        <h2 style="color:#BD1E2D;letter-spacing:3px">${otp}</h2>
        <p>OTP có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "✅ Mã OTP đã được gửi đến email của bạn!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Lỗi hệ thống", error });
  }
};
//  Xác thực OTP & cập nhật mật khẩu
export const verifyOTPAndReset = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ message: "Thiếu email, OTP hoặc mật khẩu mới" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .input("otp", sql.VarChar, otp)
      .query("SELECT * FROM Users WHERE email = @email AND reset_token = @otp");

    if (result.recordset.length === 0)
      return res.status(400).json({ message: "OTP không hợp lệ hoặc sai email" });

    const user = result.recordset[0];
    if (user.reset_expiry && new Date() > new Date(user.reset_expiry))
      return res.status(400).json({ message: "OTP đã hết hạn, vui lòng yêu cầu lại." });

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool
      .request()
      .input("hashed", sql.VarChar, hashed)
      .input("email", sql.VarChar, email)
      .query(`
        UPDATE Users
        SET password_hash = @hashed, reset_token = NULL, reset_expiry = NULL
        WHERE email = @email
      `);

    res.json({ message: "✅ Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại." });
  } catch (err) {
    console.error("📛 Lỗi khi đặt lại mật khẩu:", err);
    res.status(500).json({ message: "❌ Lỗi hệ thống", error: err.message });
  }
};
//  Đổi mật khẩu (khi đã đăng nhập)
export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { oldPass, newPass } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("user_id", sql.Int, id)
      .query("SELECT password_hash FROM Users WHERE user_id = @user_id");

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    //  Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(oldPass, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    //  Hash mật khẩu mới
    const hashed = await bcrypt.hash(newPass, 10);
    await pool.request()
      .input("user_id", sql.Int, id)
      .input("hashed", sql.VarChar, hashed)
      .query("UPDATE Users SET password_hash = @hashed WHERE user_id = @user_id");

    return res.json({ message: "✅ Đổi mật khẩu thành công!" });
  } catch (err) {
    console.error("Lỗi đổi mật khẩu:", err);
    return res.status(500).json({ message: "❌ Lỗi server", error: err.message });
  }
};








