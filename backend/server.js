import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { poolPromise } from "./config/db.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentMomoRoutes from "./routes/paymentMomoRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Đường dẫn
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------- API ROUTES ---------------------
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", dashboardRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/lookup", invoiceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/momo", paymentMomoRoutes);

// ------------------ PHỤC VỤ REACT BUILD ------------------
// ⚠️ TẮT CACHE ĐỂ LUÔN TẢI FILE MỚI
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ⚠️ STATIC KHÔNG CACHE
app.use(
  express.static(path.join(__dirname, "../frontend/build"), {
    etag: false,
    lastModified: false,
    maxAge: 0,
  })
);

// ⚠️ BẮT MỌI REQUEST KHÁC TRẢ VỀ index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// ------------------ KIỂM TRA SQL ----------------------
(async () => {
  try {
    await poolPromise;
    console.log("✅ Kết nối SQL Server thành công!");
  } catch (err) {
    console.error("❌ Lỗi kết nối SQL:", err.message);
  }
})();

// --------------------- SERVER -------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
});
