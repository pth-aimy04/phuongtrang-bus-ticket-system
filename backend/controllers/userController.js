import sql from "mssql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { poolPromise } from "../config/db.js";


//  1. Lấy toàn bộ user 
export const getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT user_id, full_name, email, phone, address, birthday, gender, avatar, role, is_verified, created_at
      FROM Users
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  2. Đăng ký
export const register = async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  try {
    const pool = await poolPromise;
    //Kiểm tra tồn tại
    const check = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (check.recordset.length > 0)
      return res.status(400).json({ message: "❌ Email đã được đăng ký!" });
    //mã hoá mật khẩu
    const hashed = await bcrypt.hash(password, 10);
    //thêm người dùng mới
    await pool
      .request()
      .input("full_name", sql.NVarChar, full_name)
      .input("email", sql.VarChar, email)
      .input("phone", sql.VarChar, phone)
      .input("password_hash", sql.VarChar, hashed)
      .input("role", sql.VarChar, "user")
      .input("is_verified", sql.Bit, 0)
      .input("avatar", sql.NVarChar, null)
      .input("gender", sql.NVarChar, null)
      .query(`
        INSERT INTO Users (full_name, email, phone, password_hash, role, is_verified, avatar, gender, created_at)
        VALUES (@full_name, @email, @phone, @password_hash, @role, @is_verified, @avatar, @gender, GETDATE())
      `);

    res.json({ message: "✅ Đăng ký thành công!" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 3. Đăng nhập
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
    // Lấy thông tin user theo email
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");
    // Kiểm tra mật khẩu
    const user = result.recordset[0];
    if (!user) return res.status(400).json({ message: "❌ Sai email hoặc mật khẩu!" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: "❌ Sai email hoặc mật khẩu!" });
   // Tạo token JWT
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "✅ Đăng nhập thành công!",
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        gender: user.gender,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  4. Cập nhật vai trò (admin/user)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const pool = await poolPromise;
    // Kiểm tra tồn tại
    const check = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Users WHERE user_id = @id");

    if (check.recordset.length === 0)
      return res.status(404).json({ message: "❌ Không tìm thấy người dùng!" });
    // cập nhật
    await pool.request()
      .input("id", sql.Int, id)
      .input("role", sql.VarChar, role)
      .query("UPDATE Users SET role = @role WHERE user_id = @id");

    res.json({ message: "✅ Cập nhật vai trò thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Xóa người dùng
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    // Kiểm tra tồn tại
    const check = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Users WHERE user_id = @id");

    if (check.recordset.length === 0)
      return res.status(404).json({ message: "❌ Không tìm thấy người dùng!" });
    // Xoá
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Users WHERE user_id = @id");

    res.json({ message: " Đã xóa người dùng thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  6. Lấy thông tin người dùng theo ID (kèm avatar + gender)
export const getUserById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT user_id, full_name, email, phone, address, birthday, gender, avatar
        FROM Users WHERE user_id=@id
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ message: "❌ Không tìm thấy người dùng!" });

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Cập nhật thông tin người dùng (trừ avatar)
export const updateUserInfo = async (req, res) => {
  const { full_name, phone, address, birthday, gender } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("full_name", sql.NVarChar, full_name)
      .input("phone", sql.VarChar, phone)
      .input("address", sql.NVarChar, address)
      .input("birthday", sql.Date, birthday)
      .input("gender", sql.NVarChar, gender)
      .query(`
        UPDATE Users SET
          full_name = @full_name,
          phone = @phone,
          address = @address,
          birthday = @birthday,
          gender = @gender
        WHERE user_id = @id
      `);
    res.json({ message: "✅ Cập nhật thông tin thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  8. Upload Avatar (multer)
const uploadPath = "uploads/avatars";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("❌ Chỉ chấp nhận file JPG hoặc PNG!"));
    }
    cb(null, true);
  },
});

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "❌ Vui lòng chọn ảnh!" });
    }

    const userId = req.params.id;
    const fileName = req.file.filename;

    const pool = await poolPromise;
    await pool.request()
      .input("avatar", sql.NVarChar, fileName)
      .input("user_id", sql.Int, userId)
      .query("UPDATE Users SET avatar = @avatar WHERE user_id = @user_id");

    res.json({
      message: "✅ Upload ảnh thành công!",
      file: fileName,
      path: `/uploads/avatars/${fileName}`,
    });
  } catch (err) {
    res.status(500).json({
      message: "❌ Lỗi khi upload ảnh!",
      error: err.message,
    });
  }
};











