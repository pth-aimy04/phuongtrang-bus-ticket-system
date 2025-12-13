import React, { useEffect, useState } from "react";
import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

export default function Profile() {
  const API_URL = BASE_API;
  const STATIC_URL = "http://localhost:5000"; // để build URL ảnh
  const user_id = localStorage.getItem("customer_id");

  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState({});
  const [avatarPreview, setAvatarPreview] = useState("");
  const [myTickets, setMyTickets] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ---- RESET PASS WITH OTP ----
const [step, setStep] = useState("normal"); // normal | sendOtp | verifyOtp
const [oldPassError, setOldPassError] = useState("");
const [emailReset, setEmailReset] = useState("");
const [otpCode, setOtpCode] = useState("");
const [newPassOtp, setNewPassOtp] = useState("");
const [confirmPassOtp, setConfirmPassOtp] = useState("");
const [showLogoutModal, setShowLogoutModal] = useState(false);


  // =========================
  // Load user lần đầu
  // =========================
  const loadUser = async () => {
    try {
      const res = await fetch(`${API_URL}/users/${user_id}`);
      const data = await res.json();
setUser(data);
if (data?.avatar) {
  setAvatarPreview(`http://localhost:5000/uploads/avatars/${data.avatar}`);
}

    } catch (err) {
      console.error("Lỗi load user:", err);
    }
  };

  useEffect(() => {
    loadUser();

    // ưu tiên avatar từ localStorage nếu có
   const stored = localStorage.getItem("customer_user");
if (stored) {
  const u = JSON.parse(stored);
  if (u?.avatar) {
    setAvatarPreview(`http://localhost:5000/uploads/avatars/${u.avatar}`);
  }
}
  }, []);

  
  // =========================
// Upload avatar
// =========================
const uploadAvatar = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 1 * 1024 * 1024) {
    alert("❌ Ảnh vượt quá 1MB!");
    return;
  }

  setAvatarPreview(URL.createObjectURL(file)); // preview tạm

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch(`${API_URL}/users/upload-avatar/${user_id}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "❌ Upload thất bại!");
      return;
    }

    const fileName = data.file;

    // ✅ cập nhật database xong -> cập nhật localStorage
    const stored = localStorage.getItem("customer_user");
    if (stored) {
      const u = JSON.parse(stored);
      u.avatar = fileName;
      localStorage.setItem("customer_user", JSON.stringify(u));
    }

    // ✅ cập nhật preview chính thức
    setAvatarPreview(`http://localhost:5000/uploads/avatars/${fileName}`);

    // ✅ báo cho navbar cập nhật avatar
    window.dispatchEvent(new Event("storage"));

    alert("✅ Avatar đã cập nhật!");
  } catch (err) {
    console.log(err);
    alert("❌ Lỗi upload ảnh");
  }
};


  // =========================
  // Update user
  // =========================
  const updateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users/update/${user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "❌ Cập nhật thất bại!");
        return;
      }

      alert("✅ Cập nhật thành công!");
      const refreshed = await fetch(`${API_URL}/users/${user_id}`).then((r) =>
        r.json()
      );
      localStorage.setItem("customer_user", JSON.stringify(refreshed));
      setUser(refreshed);
      if (refreshed?.avatar) {
        setAvatarPreview(`http://localhost:5000/uploads/avatars/${refreshed.avatar}`);
      }
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi kết nối server!");
    }
  };

  // =========================
  // Vé của tôi & Lịch sử
  // =========================
  const loadMyTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/tickets/user/${user_id}`);
      const data = await res.json();
      const now = new Date();
      setMyTickets(data.filter((t) => new Date(t.departure_time) > now));
    } catch (err) {
      console.error("Lỗi load vé:", err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/tickets/history/${user_id}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Lỗi load lịch sử:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "mytickets") loadMyTickets();
    if (activeTab === "history") loadHistory();
    if (activeTab === "notifications") loadNotifications();
  }, [activeTab]);

  // =========================
  // Đổi mật khẩu
  // =========================
const changePassword = async (e) => {
  e.preventDefault();
  setOldPassError("");

  const oldPass = e.target.oldPass.value;
  const newPass = e.target.newPass.value;
  const confirmPass = e.target.confirmPass.value;

  if (newPass !== confirmPass) {
    setOldPassError("❌ Mật khẩu mới và xác nhận mật khẩu không khớp.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/change-password/${user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPass, newPass }),
    });

    const result = await res.json();

    if (res.status === 400) {
      setOldPassError(result.message);
      return;
    }

    if (res.ok) {
      alert("✅ Đổi mật khẩu thành công!");
      localStorage.clear();
      window.location.href = "/customer/login";
    } else {
      setOldPassError(result.message || "❌ Lỗi hệ thống.");
    }
  } catch (err) {
    console.error(err);
    setOldPassError("❌ Lỗi kết nối server.");
  }
};


const sendOtp = async () => {
  if (!emailReset) {
    alert("Vui lòng nhập email!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailReset }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("✅ Mã OTP đã được gửi đến email của bạn!");
    setStep("verifyOtp");
  } catch (err) {
    console.error(err);
    alert("❌ Lỗi khi gửi OTP");
  }
};
const verifyOtp = async () => {
  if (!otpCode || !newPassOtp || !confirmPassOtp) {
    alert("Vui lòng nhập đầy đủ thông tin!");
    return;
  }

  if (newPassOtp !== confirmPassOtp) {
    alert("❌ Mật khẩu không khớp!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/reset-with-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailReset,
        otp: otpCode,
        newPassword: newPassOtp,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("✅ Đặt lại mật khẩu thành công!");
    setStep("normal");
  } catch (err) {
    console.error(err);
    alert("❌ Lỗi khi đặt lại mật khẩu");
  }
};
//thong bao
const loadNotifications = async () => {
  try {
    const res = await fetch(`${API_URL}/notifications/user/${user_id}`);
    const data = await res.json();
    setNotifications(data);
  } catch (err) {
    console.error("Lỗi load thông báo:", err);
  }
};

  // =========================
  // UI
  // =========================
  return (
    <div className="profile-page">
      <div className="container-account">
        {/* Sidebar */}
        <div className="sidebar">
          <h4>👤 Tài khoản</h4>
          <ul>
            <li className={activeTab === "info" ? "active" : ""} onClick={() => setActiveTab("info")}>Thông tin tài khoản</li>
            <li className={activeTab === "notifications" ? "active" : ""} onClick={() => setActiveTab("notifications")}>Thông báo</li>
            <li className={activeTab === "mytickets" ? "active" : ""} onClick={() => setActiveTab("mytickets")}>Vé của tôi</li>
            <li className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>Lịch sử mua vé</li>
            <li className={activeTab === "reset" ? "active" : ""} onClick={() => setActiveTab("reset")}>Đổi mật khẩu</li>
<li onClick={() => setShowLogoutModal(true)}>Đăng xuất</li>
          </ul>
        </div>

        {/* Content */}
        <div className="content">
          {activeTab === "info" && (
            <>
              <h3>Thông tin tài khoản</h3>

              <div className="avatar-box">
                <img
                  src={avatarPreview || "/assets/customer/img/default.jpg"}
                  alt="avatar"
                />
                <div>
                  <input
                    type="file"
                    id="uploadAvatar"
                    accept=".jpg,.jpeg,.png"
                    onChange={uploadAvatar}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="uploadAvatar">Chọn ảnh</label>
                  <p style={{ fontSize: "13px", color: "gray" }}>
                    Dung lượng tối đa 1MB (.JPG, .PNG)
                  </p>
                </div>
              </div>

              <form onSubmit={updateUser}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Họ tên:</label>
                    <input
                      className="form-control"
                      value={user.full_name || ""}
                      onChange={(e) =>
                        setUser({ ...user, full_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Giới tính:</label>
                    <select
                      className="form-control"
                      value={user.gender || ""}
                      onChange={(e) =>
                        setUser({ ...user, gender: e.target.value })
                      }
                    >
                      <option value="">-- Chọn --</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Ngày sinh:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={user.birthday ? user.birthday.split("T")[0] : ""}
                      onChange={(e) =>
                        setUser({ ...user, birthday: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Email:</label>
                    <input className="form-control" value={user.email || ""} disabled />
                  </div>
                </div>

                <label>Địa chỉ:</label>
                <input
                  className="form-control mb-3"
                  value={user.address || ""}
                  onChange={(e) =>
                    setUser({ ...user, address: e.target.value })
                  }
                />

                <label>Số điện thoại:</label>
                <input
                  className="form-control mb-3"
                  value={user.phone || ""}
                  onChange={(e) =>
                    setUser({ ...user, phone: e.target.value })
                  }
                />

                <button className="btn-save">Cập nhật</button>
              </form>
            </>
          )}
          
 {activeTab === "notifications" && (
  <>
    <h3>🔔 Thông báo</h3>

    <div className="scroll-box">
      {notifications.length === 0 ? (
        <p>📭 Bạn chưa có thông báo nào.</p>
      ) : (
        notifications.map((n, i) => {
          const isRead = n.is_read === true || n.is_read === 1;
          const time = new Date(n.created_at).toLocaleString("vi-VN");

          return (
            <div
              key={i}
              className={`card p-3 mb-2 shadow-sm d-flex flex-column ${
                isRead ? "bg-light" : "bg-warning-subtle"
              }`}
              style={{
                borderLeft: isRead ? "4px solid #ccc" : "4px solid #f39c12",
                cursor: "pointer",
              }}
              onClick={async () => {
                if (!isRead) {
                  // Gọi API đánh dấu đã đọc
                  await fetch(`${API_URL}/notifications/${n.noti_id}/read`, {
                    method: "PUT",
                  });
                  loadNotifications(); // reload danh sách
                }
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-1">
                    <b>
                      {n.message.includes("huỷ") ? "🚫 " : "📢 "}
                      {n.message}
                    </b>
                  </p>
                  {n.booking_code && (
                    <p className="text-muted mb-1">
                      Mã vé: <b>{n.booking_code}</b>
                    </p>
                  )}
                </div>
                {!isRead && (
                  <span
                    className="badge bg-danger"
                    style={{ fontSize: "11px", height: "fit-content" }}
                  >
                    Mới
                  </span>
                )}
              </div>
              <p
                className="text-muted"
                style={{ fontSize: "13px", marginTop: "5px" }}
              >
                {time}
              </p>
            </div>
          );
        })
      )}
    </div>
  </>
)}


{activeTab === "mytickets" && (
  <>
    <h3>🎟 Vé của tôi</h3>
    <div className="scroll-box">
      {myTickets.length === 0 ? (
        <p>Bạn chưa có vé sắp tới.</p>
      ) : (
        Object.values(
          myTickets.reduce((acc, cur) => {
            if (!acc[cur.booking_code]) acc[cur.booking_code] = [];
            acc[cur.booking_code].push(cur);
            return acc;
          }, {})
        ).map((group, idx) => {
          const info = group[0];
          const isRoundTrip = group.length > 1;

          // Nếu khứ hồi → ghép chuỗi điểm đi về
          const routeName = isRoundTrip
            ? `${group[0].start_point} → ${group[0].end_point} → ${group[1].end_point}`
            : `${info.start_point} → ${info.end_point}`;

          return (
            <div
              key={idx}
              className="ticket-card shadow-sm p-3 mb-3 border rounded"
              style={{
                borderLeft: "5px solid #e74c3c",
                backgroundColor: "#fff",
              }}
            >
              <h5 className="text-danger fw-bold mb-2">
                🎫 {routeName}
              </h5>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <p className="mb-1">
                    📅 <b>Ngày đặt:</b>{" "}
                    {new Date(info.booking_date).toLocaleString("vi-VN")}
                  </p>
                  <p className="mb-1">
                    💺 <b>Ghế:</b> {info.seat_numbers || "—"}
                  </p>
                </div>

                <div className="col-6">
                  <p className="mb-1">
                    ⏰ <b>Khởi hành:</b>{" "}
                    {new Date(info.departure_time).toLocaleTimeString("vi-VN")}{" "}
                    {new Date(info.departure_time).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="mb-1">
                    💰 <b>Giá vé:</b>{" "}
                    {Number(info.price).toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <span
                  className="badge px-3 py-2"
                  style={{
                    backgroundColor:
                      info.payment_status === "Đã thanh toán"
                        ? "#f1c40f"
                        : "#ccc",
                    color: "#000",
                    fontWeight: "bold",
                  }}
                >
                  {info.payment_status}
                </span>

                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    localStorage.setItem("ticket_source", "profile");
                    window.location.href = `/customer/ticket-detail?booking_code=${info.booking_code}`;
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  </>
)}

{activeTab === "history" && (
  <>
    <h3>📜 Lịch sử mua vé</h3>
    <div className="scroll-box">
      {history.length === 0 ? (
        <p>Không có lịch sử.</p>
      ) : (
        Object.values(
          history.reduce((acc, cur) => {
            if (!acc[cur.booking_code]) acc[cur.booking_code] = [];
            acc[cur.booking_code].push(cur);
            return acc;
          }, {})
        ).map((group, idx) => {
          const info = group[0];
          const isRoundTrip = group.length > 1;
          const routeName = isRoundTrip
            ? `${group[0].start_point} → ${group[0].end_point} → ${group[1].end_point}`
            : `${info.start_point} → ${info.end_point}`;
          
          const totalPrice = group.reduce((sum, t) => sum + Number(t.price || 0), 0);

          const handleCopy = () => {
            navigator.clipboard.writeText(info.booking_code);
            alert("✅ Đã sao chép mã vé: " + info.booking_code);
          };

          return (
            <div
              key={idx}
              className="card p-3 mb-3 shadow-sm border rounded ticket-history"
              style={{
                borderLeft: "5px solid #d63031",
                backgroundColor: "#fff",
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="text-danger fw-bold m-0">{routeName}</h5>
                <span
                  className="badge px-3 py-2"
                  style={{
                    backgroundColor:
                      info.payment_status === "Đã thanh toán"
                        ? "#f1c40f"
                        : "#ccc",
                    color: "#000",
                    fontWeight: "bold",
                    borderRadius: "8px",
                  }}
                >
                  {info.payment_status}
                </span>
              </div>

              <div className="d-flex align-items-center mb-2">
                <p className="mb-0 me-2">
                  <b>Mã vé:</b> {info.booking_code}
                </p>
                <button
                  onClick={handleCopy}
                  className="btn btn-sm btn-light border copy-btn"
                  title="Sao chép mã vé"
                >
                  📋
                </button>
              </div>

              {group.map((g, i) => (
                <div key={i} className="ms-2 text-muted small">
                  🚌 {g.start_point} → {g.end_point} —{" "}
                  {new Date(g.departure_time).toLocaleString("vi-VN")}
                </div>
              ))}

              <p className="mt-2 mb-0">
                💰 <b>Tổng tiền:</b>{" "}
                {totalPrice.toLocaleString("vi-VN")} VNĐ
              </p>
            </div>
          );
        })
      )}
    </div>
  </>
)}



{activeTab === "reset" && (
  <>
    <h3>🔐 Đổi mật khẩu</h3>

    {/*  NORMAL MODE — ĐỔI PASSWORD */}
    {step === "normal" && (
      <form onSubmit={changePassword} style={{ maxWidth: "380px" }}>
        <label>Mật khẩu hiện tại:</label>
        <input type="password" name="oldPass" className="form-control mb-2" required />

        {oldPassError && (
          <p style={{ color: "#d33" }}>
            ⚠️ {oldPassError} —{" "}
            <span
              style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => setStep("sendOtp")}
            >
              Bạn quên mật khẩu?
            </span>
          </p>
        )}

        <label>Mật khẩu mới:</label>
        <input type="password" name="newPass" className="form-control mb-2" required />

        <label>Nhập lại mật khẩu mới:</label>
        <input type="password" name="confirmPass" className="form-control mb-3" required />

        <button className="btn-save w-100">Đổi mật khẩu</button>
      </form>
    )}

    {/* STEP 1 — NHẬP EMAIL GỬI OTP */}
    {step === "sendOtp" && (
      <div style={{ maxWidth: "380px" }}>
        <label>Nhập email để nhận OTP:</label>
        <input
          type="email"
          className="form-control mb-3"
          value={emailReset}
          onChange={(e) => setEmailReset(e.target.value)}
        />
        <button className="btn-save w-100" onClick={sendOtp}>Gửi OTP</button>
      </div>
    )}

    {/*  STEP 2 — XÁC MINH OTP + MẬT KHẨU MỚI */}
    {step === "verifyOtp" && (
      <div style={{ maxWidth: "380px" }}>
        <label>Nhập mã OTP:</label>
        <input
          type="text"
          className="form-control mb-3"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
        />

        <label>Mật khẩu mới:</label>
        <input
          type="password"
          className="form-control mb-2"
          value={newPassOtp}
          onChange={(e) => setNewPassOtp(e.target.value)}
        />

        <label>Nhập lại mật khẩu mới:</label>
        <input
          type="password"
          className="form-control mb-3"
          value={confirmPassOtp}
          onChange={(e) => setConfirmPassOtp(e.target.value)}
        />

        <button className="btn-save w-100" onClick={verifyOtp}>Xác nhận</button>
      </div>
    )}
  </>
)}

{showLogoutModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h4>Bạn có chắc muốn đăng xuất?</h4>
      <p>Phiên đăng nhập sẽ kết thúc và bạn sẽ quay về trang chủ.</p>

      <div className="modal-actions">
        <button className="btn-cancel" onClick={() => setShowLogoutModal(false)}>
          Hủy
        </button>
        <button
          className="btn-confirm"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/customer/home"; //  điều hướng về Home
          }}
        >
          Đồng ý
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}
