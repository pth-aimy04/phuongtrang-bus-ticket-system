import React, { useEffect, useState } from "react";
import BASE_API from "../../config/api";
import "../../assets/customer/css/style.css";

export default function TicketDetail() {
  const API_URL = BASE_API;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const bookingCode = params.get("booking_code");

  useEffect(() => {
  async function loadTicket() {
    try {
      const res = await fetch(
        `${API_URL}/tickets/detail?booking_code=${encodeURIComponent(
          bookingCode
        )}`
      );

      if (!res.ok) throw new Error("Không tìm thấy vé!");

      const data = await res.json();

      //  Nếu backend trả về mảng chỉ có 1 phần tử, ta lấy phần tử đầu
      if (Array.isArray(data) && data.length === 1) {
        setTicket(data[0]);
      } else {
        setTicket(data);
      }

    } catch (err) {
      console.error("❌ Lỗi tải vé:", err);
      alert("Không thể tải vé. Vui lòng thử lại!");
    }
    setLoading(false);
  }

  loadTicket();
}, [bookingCode]);


  if (loading) {
    return (
      <div className="container text-center mt-5">
        ⏳ Đang tải thông tin vé...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container text-center mt-5 text-danger">
        ❌ Không tìm thấy vé!
      </div>
    );
  }

  return (
  <div className="ticket-detail-page container mt-4">
    <div className="ticket-card shadow p-4 mx-auto" style={{ maxWidth: 600 }}>
      <h2 className="text-center mb-4">🎫 Chi tiết vé của bạn</h2>

      {/* Nếu API trả về MẢNG (vé khứ hồi) */}
      {Array.isArray(ticket) ? (
        <>
          {/* Mã vé chung */}
          <div className="info-item mb-3">
            <span>🔖 <b>Mã đặt vé:</b> {ticket[0].booking_code}</span>
          </div>

          {/* Thông tin hành khách */}
          <div className="info-item">
            <span>👤 <b>Hành khách:</b> {ticket[0].customer_name}</span>
          </div>
          <div className="info-item mb-3">
            <span>📞 <b>SĐT:</b> {ticket[0].customer_phone || "Không có"}</span>
          </div>

          {/* Danh sách lượt */}
          {ticket.map((t) => (
            <div key={t.direction} className="border rounded p-3 mb-3 bg-light">
              <h5>🚌 Lượt {t.direction}</h5>
              <p>🚏 <b>Tuyến:</b> {t.start_point} → {t.end_point}</p>
              <p>🕒 <b>Giờ khởi hành:</b> {new Date(t.departure_time).toLocaleString("vi-VN")}</p>
              <p>🚐 <b>Loại xe:</b> {t.vehicle_type}</p>
              <p>💺 <b>Ghế:</b> {t.seat_numbers}</p>
              <p>💰 <b>Giá:</b> {Number(t.price).toLocaleString("vi-VN")} × {t.seat_count} = <b>{Number(t.total_price).toLocaleString("vi-VN")} VNĐ</b></p>
            </div>
          ))}

          {/* Thanh toán */}
          <div
            id="status"
            className={`status ${ticket[0].payment_status === "Đã thanh toán" ? "paid" : "unpaid"}`}
          >
            {ticket[0].payment_status === "Đã thanh toán"
              ? "✅ Đã thanh toán"
              : "⏳ Chưa thanh toán"}
          </div>

          {/* QR */}
          {ticket[0].qr_code && (
            <div className="qr-box text-center mt-4">
              <p>📱 Mã QR của bạn:</p>
              <img
                src={ticket[0].qr_code}
                alt="QR Code"
                style={{ width: 180, height: 180 }}
              />
            </div>
          )}
        </>
      ) : (
        // Nếu chỉ có 1 vé (một chiều)
        <>
          <div className="info-item">
            <span>🔖 Mã đặt vé:</span>
            <span>{ticket.booking_code}</span>
          </div>
          <div className="info-item">
            <span>👤 Hành khách:</span>
            <span>{ticket.customer_name}</span>
          </div>
          <div className="info-item">
            <span>📞 Số điện thoại:</span>
            <span>{ticket.customer_phone || "Không có"}</span>
          </div>
          <div className="info-item">
            <span>🗓️ Ngày đặt:</span>
            <span>{new Date(ticket.booking_date).toLocaleString("vi-VN")}</span>
          </div>
          <div className="info-item">
            <span>🚌 Tuyến đường:</span>
            <span>{ticket.start_point} → {ticket.end_point}</span>
          </div>
          <div className="info-item">
            <span>🕒 Giờ khởi hành:</span>
            <span>{new Date(ticket.departure_time).toLocaleString("vi-VN")}</span>
          </div>
          <div className="info-item">
            <span>💺 Ghế:</span>
            <span>{ticket.seat_numbers}</span>
          </div>
          <div className="info-item">
            <span>💰 Tổng tiền:</span>
            <span>
              {Number(ticket.price).toLocaleString("vi-VN")} × {ticket.seat_count} ={" "}
              <b>{Number(ticket.total_price).toLocaleString("vi-VN")} VNĐ</b>
            </span>
          </div>
<div
  id="status"
  className={`status ${
    ticket.payment_status &&
    ticket.payment_status.trim().normalize("NFC") === "Đã thanh toán"
      ? "paid"
      : "unpaid"
  }`}
>
  {ticket.payment_status &&
  ticket.payment_status.trim().normalize("NFC") === "Đã thanh toán"
    ? "✅ Đã thanh toán"
    : "⏳ Chưa thanh toán"}
</div>



          {ticket.qr_code && (
            <div className="qr-box text-center mt-3">
              <p>📱 Mã QR của bạn:</p>
              <img
                src={ticket.qr_code}
                alt="QR Code"
                style={{ width: 180, height: 180 }}
              />
            </div>
          )}
        </>
      )}

      {/* Nút quay lại */}
      <button
        className="btn btn-outline-danger mt-3 w-100"
        onClick={() => {
          const src = localStorage.getItem("ticket_source");
          if (src === "profile") {
            window.location.href = "/customer/profile#mytickets";
          } else {
            window.location.href = "/customer/home";
          }
        }}
      >
        ← Quay lại
      </button>
    </div>
  </div>
);

}
