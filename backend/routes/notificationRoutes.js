import { Router } from "express";
import { getByUser, markAsRead, deleteNotification } from "../controllers/notificationController.js";

const router = Router();

// 📩 Lấy tất cả thông báo của người dùng
router.get("/user/:user_id", getByUser);

// ✅ Đánh dấu đã đọc
router.put("/:noti_id/read", markAsRead);

// 🗑️ Xoá thông báo
router.delete("/:noti_id", deleteNotification);

export default router;
