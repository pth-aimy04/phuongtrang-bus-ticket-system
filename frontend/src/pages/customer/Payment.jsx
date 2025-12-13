import React, { useState, useEffect } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

  const API_URL = BASE_API;

const Payment = () => {
  const navigate = useNavigate();   

  const [method, setMethod] = useState("MOMO");
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [bookingCode, setBookingCode] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBookingCode(params.get("booking_code") || "");
    setAmount(params.get("amount") || "");

    const userData = localStorage.getItem("customer_user");
    setUser(userData ? JSON.parse(userData) : null);
  }, []);

  //  Xử lý thanh toán MoMo UAT
 const handlePaymentMomo = async () => {
  if (!user) {
    alert("⚠️ Bạn cần đăng nhập để thanh toán!");
    window.location.href = "/customer/login";
    return;
  }

  setProcessing(true);

  try {
    const res = await fetch(`${API_URL}/momo/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_code: bookingCode,
        amount,
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    // ĐÚNG CHUẨN MOMO: redirect thẳng sang payUrl
    window.location.href = data.payUrl;

  } catch (err) {
    alert("❌ Lỗi MoMo: " + err.message);
    setProcessing(false);
  }
};

  //  Thanh toán nội bộ 
  const handlePaymentNormal = async () => {
    if (!user) {
      alert("⚠️ Bạn cần đăng nhập để thanh toán!");
      window.location.href = "/customer/login";
      return;
    }

    setProcessing(true);
   //gọi Api thanh toán mock
    try {
      const res = await fetch(`${API_URL}/payment/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: bookingCode,
          user_id: user.user_id,
          amount,
          method,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
     //sau 2s thông báo thành công
      setTimeout(() => {
        window.location.href = `/customer/payment-success?booking_code=${bookingCode}&status=SUCCESS`;
      }, 2000);

    } catch (err) {
      alert("❌ Lỗi khi thanh toán: " + err.message);
      setProcessing(false);
    }
  };

  //  Nút thanh toán chính
  const handleClick = () => {
    if (method === "MOMO") handlePaymentMomo();
    else handlePaymentNormal();
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-lg p-4" style={{ maxWidth: "420px", width: "100%" }}>
        <h3 className="text-center mb-3">💳 Thanh toán vé xe</h3>

        <Form.Group className="mb-3">
          <Form.Label>Phương thức thanh toán:</Form.Label>
          <Form.Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="MOMO">MoMo</option>
            <option value="VNPAY">VNPay</option>
            <option value="ZALOPAY">ZaloPay</option>
            <option value="CARD">Thẻ quốc tế</option>
          </Form.Select>
        </Form.Group>

        {processing && (
          <div className="text-center text-muted mb-3">
            🔐 Cổng thanh toán đang xác nhận...<br />
            <Spinner animation="border" size="sm" className="me-2" />
            Vui lòng đợi trong giây lát ⏳
          </div>
        )}

        <Button
          variant="primary"
          className="w-100 btn-pay"
          disabled={processing}
          onClick={handleClick}   // ✅ Nút gọi đúng hàm
        >
          {processing ? "Đang xử lý..." : "Thanh toán"}
        </Button>
      </div>
    </div>
  );
};

export default Payment;
