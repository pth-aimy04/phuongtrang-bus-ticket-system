  import React, { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

  export default function Register() {
    const API_URL = BASE_API;
    const navigate = useNavigate();
    const [form, setForm] = useState({
      full_name: "",
      email: "",
      phone: "",
      password: "",
    });

    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Cập nhật input
    const handleChange = (e) => {
      setForm({ ...form, [e.target.id]: e.target.value });
    };

    // Submit form đăng ký
    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!form.full_name || !form.email || !form.phone || !form.password) {
        alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
        return;
      }

      // Validate số điện thoại
      if (!/^(0|\+84)[0-9]{9}$/.test(form.phone)) {
        alert("⚠️ Số điện thoại không hợp lệ!");
        return;
      }

      // Kiểm tra mật khẩu nhập lại
      if (form.password !== confirmPassword) {
        alert("❌ Mật khẩu nhập lại không khớp!");
        return;
      }

      setLoading(true);
      // gọi API đăng ký
      try {
        const res = await fetch(`${API_URL}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Đăng ký thất bại!");

        alert("✅ Đăng ký thành công! Hãy đăng nhập để tiếp tục.");
        navigate("/customer/login");
      } catch (err) {
        alert("❌ " + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="auth-page">
        <div className="register-box shadow-sm">
          <h3 className="text-center mb-4" style={{ color: "#BD1E2D", fontWeight: 700 }}>
            Đăng ký tài khoản
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Họ tên */}
            <div className="mb-3">
              <label>Họ & Tên:</label>
              <input
                type="text"
                id="full_name"
                className="form-control"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label>Email:</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Số điện thoại */}
            <div className="mb-3">
              <label>Số điện thoại:</label>
              <input
                type="text"
                id="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            {/* Mật khẩu */}
            <div className="mb-3">
              <label>Mật khẩu:</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Nhập lại mật khẩu */}
            <div className="mb-3">
              <label>Nhập lại mật khẩu:</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-custom w-100"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>

          <div className="extra-links mt-3 text-center">
            <p>
              Đã có tài khoản?{" "}
              <span
                onClick={() => navigate("/customer/login")}
                style={{ color: "#BD1E2D", cursor: "pointer", fontWeight: 600 }}
              >
                Đăng nhập
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }



 