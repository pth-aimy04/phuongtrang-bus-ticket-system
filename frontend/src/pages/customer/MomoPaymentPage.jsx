import React from "react";
import { useLocation } from "react-router-dom";

const MomoPaymentPage = () => {
  const location = useLocation();
  const { qrCodeUrl, amount, orderId } = location.state || {};

  return (
    <div style={styles.container}>
      <div style={styles.box}>

        {/* LEFT */}
        <div style={styles.left}>
          <h2 style={styles.title}>Thông tin đơn hàng</h2>

          <div style={styles.info}>
            <p><strong>Nhà cung cấp:</strong> MoMo Payment</p>
            <p><strong>Mã đơn hàng:</strong> {orderId}</p>
            <p><strong>Mô tả:</strong> Thanh toán vé xe Phương Trang</p>
            <p><strong>Số tiền:</strong> {Number(amount).toLocaleString()}đ</p>
          </div>

          <div style={styles.expireBox}>
            <p>Đơn hàng sẽ hết hạn sau:</p>
            <h3 style={{ color: "#d6336c", fontSize: 26 }}>15:00</h3>
          </div>
        </div>

        {/* RIGHT */}
        <div style={styles.right}>
          <h2 style={styles.title}>Quét mã QR để thanh toán</h2>

          {/* ⭐ HÌNH QR BASE64 */}
          <img 
            src={qrCodeUrl} 
            alt="QR MoMo" 
            style={styles.qr}
          />

          <p style={styles.note}>
            Dùng ứng dụng MoMo UAT Developer để quét mã này
          </p>
        </div>

      </div>
    </div>
  );
};

export default MomoPaymentPage;


// =======================
// CSS INLINE
// =======================
const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    background: "#fafafa",
    padding: "40px 0",
    display: "flex",
    justifyContent: "center",
  },

  box: {
    width: "90%",
    maxWidth: "1100px",
    background: "#fff",
    borderRadius: "12px",
    padding: "25px",
    display: "flex",
    gap: "30px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  },

  left: {
    flex: 1,
  },

  right: {
    flex: 1,
    textAlign: "center",
  },

  title: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "15px",
    color: "#d81b60",
  },

  info: {
    background: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    lineHeight: "30px",
  },

  expireBox: {
    background: "#fff4f8",
    padding: "18px",
    borderRadius: "8px",
    border: "1px solid #ffd6e3",
    marginTop: "15px",
    textAlign: "center",
  },

  qr: {
    width: "260px",
    height: "260px",
    padding: "10px",
    background: "#fff",
    borderRadius: "15px",
    margin: "20px auto",
    border: "2px solid #ff80ab",
    objectFit: "contain",     // ⭐ giữ đúng ảnh QR
    display: "block",
  },

  note: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#555",
  },
};
