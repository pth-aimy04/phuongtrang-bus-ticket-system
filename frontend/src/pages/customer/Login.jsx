
import React, { useState, useEffect } from "react";
import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

export default function Login() {
  const API_URL = BASE_API;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
useEffect(() => {
    localStorage.removeItem("customer_user");
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_role");
    localStorage.removeItem("customer_id");
    localStorage.removeItem("customer_name");
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    //gọi API đăng nhập
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Đăng nhập thất bại!");

      // Lưu role riêng biệt
      if (data.user.role === "admin") {
        localStorage.setItem("admin_user", JSON.stringify(data.user));
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_role", data.user.role);
        window.location.href = "/admin/dashboard";
      } else {
        localStorage.setItem("customer_user", JSON.stringify(data.user));
        localStorage.setItem("customer_token", data.token);
        localStorage.setItem("customer_role", data.user.role);
        localStorage.setItem("customer_id", data.user.user_id);
        localStorage.setItem("customer_name", data.user.full_name);
        window.location.href = "/customer/home";
      }
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="login-box">
        <h3 className="text-center mb-4">Đăng nhập hệ thống</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Email:</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label>Mật khẩu:</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-custom w-100">
            Đăng nhập
          </button>
        </form>

        <div className="extra-links mt-3 text-center">
          <a href="/customer/register">Bạn chưa có tài khoản?</a>
          <br />
          <a href="/customer/forgot-password">Quên mật khẩu?</a>
        </div>
      </div>
    </div>
  );
}
