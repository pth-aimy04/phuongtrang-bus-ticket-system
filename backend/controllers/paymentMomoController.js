import crypto from "crypto";
import axios from "axios";
import QRCode from "qrcode";
import sql from "mssql";
import { poolPromise } from "../config/db.js";

//  1.Tạo thanh toán MoMo 
export const createMomoPayment = async (req, res) => {
  try {
    const { booking_code, amount } = req.body;

    if (!booking_code || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu!" });
    }

    const base = process.env.NGROK_URL;
    if (!base) {
      return res.status(500).json({ success: false, message: "Thiếu NGROK_URL trong .env!" });
    }

    // ===== MoMo Credentials =====
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    const orderId = partnerCode + Date.now();
    const requestId = orderId;
    const orderInfo = "Thanh toán vé xe";

    const redirectUrl = `${base}/customer/payment-success?booking_code=${booking_code}`;
    const ipnUrl = `${base}/api/momo/ipn`;

    const extraData = Buffer.from(JSON.stringify({ booking_code })).toString("base64");

    // Signature
    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=captureWallet`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      orderId,
      amount: String(amount),
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType: "captureWallet",
      signature,
      lang: "vi"
    };

    // CALL MOMO
    const momoRes = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("💬 MoMo trả về:", momoRes.data);

    if (!momoRes.data.payUrl) {
      return res.status(500).json({ success: false, message: "MoMo không trả về payUrl!" });
    }

    // Tạo QR base64 (nếu bạn muốn hiển thị riêng)
    const qrCodeBase64 = await QRCode.toDataURL(momoRes.data.payUrl);

    return res.json({
      success: true,
      orderId,
      amount,
      payUrl: momoRes.data.payUrl,
      qrCodeUrl: qrCodeBase64
    });

  } catch (err) {
    console.error("❌ MoMo Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


//  2. IPN Callback
export const momoIPN = async (req, res) => {
  try {
    console.log("📥 IPN MoMo gửi về:", req.body);

    const { resultCode, extraData, amount } = req.body;

    if (resultCode !== 0) {
      return res.json({ success: false, message: "Thanh toán thất bại!" });
    }

    const decoded = JSON.parse(Buffer.from(extraData, "base64").toString("utf8"));
    const booking_code = decoded.booking_code;

    const pool = await poolPromise;

    const ticketRow = await pool.request()
      .input("booking_code", sql.VarChar, booking_code)
      .query("SELECT ticket_id FROM Tickets WHERE booking_code = @booking_code");

    if (!ticketRow.recordset.length) {
      return res.json({ success: false, message: "Không tìm thấy vé!" });
    }

    const ticketId = ticketRow.recordset[0].ticket_id;

    await pool.request()
      .input("booking_code", sql.VarChar, booking_code)
      .query(`
        UPDATE Tickets
        SET payment_status = N'Đã thanh toán'
        WHERE booking_code = @booking_code
      `);

    await pool.request()
      .input("ticket_id", sql.Int, ticketId)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("method", sql.NVarChar, "MOMO")
      .input("status", sql.NVarChar, "SUCCESS")
      .query(`
        INSERT INTO Payments (ticket_id, amount, method, status, transaction_time)
        VALUES (@ticket_id, @amount, @method, @status, GETDATE())
      `);

    return res.json({ success: true });

  } catch (err) {
    console.log("❌ Lỗi IPN:", err.message);
    return res.json({ success: false, message: "IPN ERROR" });
  }
};








