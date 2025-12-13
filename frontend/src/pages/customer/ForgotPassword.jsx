import React, { useState } from "react";
import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

export default function ForgotPassword() {
const API_URL = BASE_API;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);

  // Gửi OTP
  const sendOTP = async () => {
    if (!email) return alert("Vui lòng nhập email!");

    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      //  Chỉ thông báo đơn giản
      alert(data.message);

      if (res.ok) setStep(2);
    } catch (err) {
      alert("❌ Lỗi khi gửi OTP!");
    }
  };

  //  Đặt lại mật khẩu
  const resetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword)
      return alert("Vui lòng nhập đầy đủ thông tin!");

    if (newPassword !== confirmPassword)
      return alert("❌ Mật khẩu nhập lại không khớp!");

    try {
      const res = await fetch(`${API_URL}/auth/reset-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      alert(data.message);

      if (res.ok) window.location.href = "/customer/login";
    } catch {
      alert("❌ Lỗi khi đặt lại mật khẩu!");
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(120deg, #fff, #ffe5e8)",
        height: "100vh",
      }}
      className="d-flex align-items-center justify-content-center"
    >
      <div
        className="p-4 bg-white shadow rounded"
        style={{
          width: "420px",
          borderTop: "6px solid #BD1E2D",
          borderRadius: "15px",
        }}
      >
        <h4 className="text-center mb-4" style={{ color: "#BD1E2D" }}>
          Khôi phục mật khẩu
        </h4>

        {/* Step 1: Nhập email */}
        {step === 1 && (
          <>
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

            <button
              className="btn w-100 text-white"
              style={{ background: "#BD1E2D" }}
              onClick={sendOTP}
            >
              Gửi OTP
            </button>
          </>
        )}

        {/*  Step 2: Nhập OTP + mật khẩu mới */}
        {step === 2 && (
          <>
            <div className="mb-3">
              <label>Mã OTP:</label>
              <input
                type="text"
                className="form-control"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

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
  className="btn w-100 text-white"
  style={{ background: "#BD1E2D" }}
  onClick={resetPassword}
>
  Đặt lại mật khẩu
</button>
          </>
        )}

        <p className="text-center mt-3">
          <a href="/customer/login">Quay lại đăng nhập</a>
        </p>
      </div>
    </div>
  );
}
