import React, { useEffect, useState } from "react";
import BASE_API from "../../config/api";
import "../../assets/customer/css/style.css";

export default function PaymentSuccess() {
    const API_URL = BASE_API;

  const [statusMessage, setStatusMessage] = useState("Đang xác nhận thanh toán...");
  const [bookingCode, setBookingCode] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("booking_code");
    const status = params.get("status"); // chỉ có khi thanh toán nội bộ

    setBookingCode(code);

    if (!code) {
      setStatusMessage("❌ Không tìm thấy mã đặt vé!");
      return;
    }

    // ================================
    // 1️⃣ THANH TOÁN NỘI BỘ (CÓ status)
    // ================================
    if (status) {
      async function verifyPayment() {
        try {
          const res = await fetch(
            `${API_URL}/payment/callback?booking_code=${code}&status=${status}`
          );

          const data = await res.json();
          console.log("CALLBACK DATA:", data);

          if (data.success) {
            setStatusMessage("✅ Thanh toán thành công!");
          } else {
            setStatusMessage("❌ Lỗi xác nhận thanh toán!");
          }
        } catch (err) {
          setStatusMessage("❌ Lỗi xác nhận thanh toán!");
        }
      }

      verifyPayment();
      return;
    }

    // =================================
    // 2️⃣ THANH TOÁN MOMO (KHÔNG status)
    // =================================
    setStatusMessage("✅ Thanh toán MoMo thành công!");

  }, []);

  return (
    <div className="container text-center mt-5">
      <h2>{statusMessage}</h2>

      {bookingCode && (
        <button
          className="btn btn-primary mt-3"
          onClick={() => {
            localStorage.setItem("ticket_source", "booking");
            window.location.href = `/customer/ticket-detail?booking_code=${bookingCode}`;
          }}
        >
          Xem vé đã đặt
        </button>
      )}

      <button
        className="btn btn-secondary mt-3 ms-2"
        onClick={() => (window.location.href = "/customer/home")}
      >
        Về trang chủ
      </button>
    </div>
  );
}




