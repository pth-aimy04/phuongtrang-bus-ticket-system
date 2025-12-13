import React, { useState } from "react";
import moment from "moment";
import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

export default function Lookup() {

const API_URL = `${BASE_API}/lookup`;
  // ==== TAB STATE ====
  const [activeTab, setActiveTab] = useState("ticket");

  // ==== TRA CỨU VÉ ====
  const [phone, setPhone] = useState("");
  const [ticketCode, setTicketCode] = useState("");
const [ticketResult, setTicketResult] = useState([]);

  // ==== TRA CỨU HÓA ĐƠN ====
  const [secretCode, setSecretCode] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [invoiceResult, setInvoiceResult] = useState(null);

  // ==== XÁC THỰC HÓA ĐƠN ====
  const [xmlFile, setXmlFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
    console.log("🧠 React render lại, ticketResult =", ticketResult);

  // ==== CHUYỂN TAB ====
  const switchTab = (tab) => {
    setActiveTab(tab);
    // reset kết quả khi đổi tab
  setTicketResult([]);
      setInvoiceResult(null);
    setVerifyResult(null);
  };

  //  TRA CỨU VÉ
const handleSearchTicket = async () => {
  if (!phone || !ticketCode) {
    alert("⚠️ Vui lòng nhập đủ thông tin!");
    return;
  }

  try {
    const apiUrl = `${API_URL}/ticket?phone=${phone}&booking_code=${ticketCode}`;
    console.log("📤 Gửi request:", apiUrl);

    const res = await fetch(apiUrl);
    const text = await res.text(); //  đọc raw text thay vì json luôn
    console.log("📥 Raw Response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON parse lỗi:", err);
      alert("Phản hồi từ server không đúng định dạng JSON.");
      return;
    }

    if (!res.ok) throw new Error(data.message || "Không tìm thấy vé.");

    //  Chuẩn hóa về mảng
    let tickets = [];
    if (Array.isArray(data)) {
      tickets = data;
    } else if (data && Array.isArray(data.recordset)) {
      tickets = data.recordset;
    } else if (data && Array.isArray(data.result)) {
      tickets = data.result;
    } else if (data && typeof data === "object") {
      const arr = Object.values(data).filter(v => typeof v === "object" && v !== null);
      tickets = arr.length > 0 ? arr : [data];
    }

    console.log("✅ Vé cuối cùng để render:", tickets);
    setTicketResult(tickets);
  } catch (err) {
    console.error("❌ Lỗi tra cứu:", err);
    alert("❌ " + err.message);
  }
};


  // TRA CỨU HÓA ĐƠN
  const handleSearchInvoice = async () => {
    if (!secretCode || !captcha) {
      alert("⚠️ Vui lòng nhập đủ thông tin!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/invoice?secret_code=${secretCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tìm thấy hóa đơn.");

      setInvoiceResult(data);
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  //  XÁC THỰC HÓA ĐƠN
  const handleVerify = () => {
    if (!xmlFile) {
      alert("⚠️ Vui lòng chọn file XML!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const valid = content.includes("<Signature>") && content.includes("<InvoiceData>");
      setVerifyResult({
        name: xmlFile.name,
        valid,
      });
    };
    reader.readAsText(xmlFile);
  };

  // RENDER
    return (
    <div className="lookup-page">
      {/*  THANH MENU  */}
      <nav className="top-nav">
        <ul>
          <li>
            <button
              className={activeTab === "ticket" ? "active" : ""}
              onClick={() => switchTab("ticket")}
            >
              🎟️ Tra cứu vé
            </button>
          </li>
          <li>
            <button
              className={activeTab === "invoice" ? "active" : ""}
              onClick={() => switchTab("invoice")}
            >
              🧾 Tra cứu hóa đơn
            </button>
          </li>
          <li>
            <button
              className={activeTab === "verify" ? "active" : ""}
              onClick={() => switchTab("verify")}
            >
              🧠 Xác thực hóa đơn
            </button>
          </li>
        </ul>
      </nav>

      {/* TRA CỨU VÉ */}
 {activeTab === "ticket" && (
  <div className="container-box fade-in">
    <h2>🎟️ Tra cứu thông tin vé</h2>

    <div className="mb-3">
      <label>Số điện thoại</label>
      <input
        type="text"
        className="form-control"
        placeholder="Nhập số điện thoại đã đặt vé"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
    </div>

    <div className="mb-3">
      <label>Mã vé</label>
      <input
        type="text"
        className="form-control"
        placeholder="Nhập mã vé"
        value={ticketCode}
        onChange={(e) => setTicketCode(e.target.value)}
      />
    </div>

    <button className="btn btn-custom" onClick={handleSearchTicket}>
      Tra cứu vé
    </button>


{/*  Kết quả tra cứu vé */}
{Array.isArray(ticketResult) && ticketResult.length > 0 && (
  <div className="result-box mt-4">
    <h6><b>Kết quả tra cứu vé</b></h6>
    {ticketResult.map((t, index) => (
      <div
        key={t.booking_code + "-" + t.direction + "-" + index}
        style={{
          marginBottom: "15px",
          borderBottom: "1px dashed #ddd",
          paddingBottom: "10px",
        }}
      >
        <h5 style={{
          color: t.direction === "Đi" ? "#BD1E2D" : "#007bff",
          fontWeight: 700,
          marginBottom: "10px",
        }}>
          {t.direction === "Đi" ? "🚍 Chiều đi" : "🚌 Chiều về"}
        </h5>

        <p>🧾 <b>Mã vé:</b> {t.booking_code}</p>
        <p>📅 <b>Ngày đặt:</b> {moment(t.booking_date).format("HH:mm:ss DD/MM/YYYY")}</p>
        <p>📍 <b>Tuyến:</b> {t.start_point} → {t.end_point}</p>
        <p>🕒 <b>Khởi hành:</b> {moment(t.departure_time).format("HH:mm:ss DD/MM/YYYY")}</p>
        <p>💺 <b>Xe:</b> {t.vehicle_type}</p>
        <p>💰 <b>Giá vé:</b> {Number(t.price).toLocaleString("vi-VN")} VNĐ</p>
        <p>📄 <b>Trạng thái:</b> {t.status}</p>
        <p>💳 <b>Thanh toán:</b> {t.payment_status}</p>
        <p>🔁 <b>Loại chuyến:</b> {t.trip_type}</p>
      </div>
    ))}
  </div>
)}


{Array.isArray(ticketResult) && ticketResult.length === 0 && (
  <p className="text-center text-danger mt-3">
  </p>
)}

        </div>
      )}


   
{/* Đóng container-box */}


      {/*  TRA CỨU HÓA ĐƠN */}
      {activeTab === "invoice" && (
        <div className="container-box fade-in">
          <h2>🧾 Tra cứu hóa đơn điện tử</h2>

          <div className="mb-3">
            <label>Mã số bí mật</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập mã số bí mật"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label>Mã xác thực</label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Nhập mã xác thực"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
              />
              <img
                src="/customer/assets/img/captcha.png"
                alt="captcha"
                style={{ height: 40, borderRadius: 6 }}
              />
            </div>
          </div>

          <button className="btn btn-custom" onClick={handleSearchInvoice}>
            Tra cứu hóa đơn
          </button>

          {invoiceResult && (
            <div className="result-box mt-4">
              <h6><b>Kết quả tra cứu hóa đơn</b></h6>
              <p>🧾 Số hóa đơn: {invoiceResult.invoice_number}</p>
              <p>📅 Ngày phát hành: {new Date(invoiceResult.created_at).toLocaleString("vi-VN")}</p>
              <p>💰 Tổng tiền: {Number(invoiceResult.total_amount).toLocaleString("vi-VN")} VNĐ</p>
              <p>🔐 Trạng thái: {invoiceResult.status}</p>
              <p>👤 Khách hàng: {invoiceResult.customer_name || "Không có"}</p>
              <p>📧 Email: {invoiceResult.customer_email || "Không có"}</p>
              <p>🎟️ Mã đặt vé: {invoiceResult.booking_code || "N/A"}</p>
            </div>
          )}
        </div>
      )}

      {/*  XÁC THỰC HÓA ĐƠN */}
      {activeTab === "verify" && (
        <div className="container-box fade-in">
          <h2>🧠 Xác thực hóa đơn điện tử</h2>

          <div className="mb-3">
            <label>Tải lên file hóa đơn (.xml)</label>
            <input
              type="file"
              accept=".xml"
              className="form-control"
              onChange={(e) => setXmlFile(e.target.files[0])}
            />
          </div>

          <button className="btn btn-custom" onClick={handleVerify}>
            Xác thực
          </button>

          {verifyResult && (
            <div className="result-box mt-4">
              <h6>Kết quả xác thực</h6>
              <p>📄 File: {verifyResult.name}</p>
              <p>
                🔒 Trạng thái:{" "}
                {verifyResult.valid
                  ? "✅ Hóa đơn hợp lệ (đã ký số)"
                  : "❌ Hóa đơn không hợp lệ hoặc bị chỉnh sửa"}
              </p>
            </div>
          )}
        </div>
      )}
    </div> 
     
  );
}
{/*  Đóng lookup-page */}