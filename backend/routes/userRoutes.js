import express from "express";
import {
  getAllUsers,
  register,
  login,
  getUserById,
  updateUserInfo,
  updateUserRole,
  deleteUser,
  upload,
  uploadAvatar,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/", getAllUsers);

router.put("/update/:id", updateUserInfo);
router.get("/:id", getUserById);
router.put("/role/:id", updateUserRole);
router.delete("/:id", deleteUser);

// ✅ API Upload avatar
router.post("/upload-avatar/:id", upload.single("avatar"), uploadAvatar);

export default router;
