import React, { useEffect, useState, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import "../../assets/customer/css/style.css";

export default function CustomerLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
const [showLogoutModal, setShowLogoutModal] = useState(false);

useEffect(() => {
  const storedUser = localStorage.getItem("customer_user");
  const token = localStorage.getItem("customer_token");

  // Nếu không có token hợp lệ thì coi như chưa đăng nhập
  if (!storedUser || !token) {
    setUser(null);
    localStorage.removeItem("customer_user");
    localStorage.removeItem("customer_token");
  } else {
    setUser(JSON.parse(storedUser));
  }
}, []);
useEffect(() => {
  const handleStorage = () => {
    const stored = localStorage.getItem("customer_user");
    if (stored) {
      const updated = JSON.parse(stored);
      setUser(prev => {
        if (!prev) return updated;
        if (
          prev.full_name !== updated.full_name ||
          prev.avatar !== updated.avatar
        ) {
          return updated;
        }
        return prev;
      });
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}, []);


  //  Xử lý đăng xuất
  const handleLogout = (e) => {
    e.stopPropagation(); // chặn toggle menu
    localStorage.clear();
    setUser(null);
    navigate("/customer/login");
  };

  return (
    <div>
      {/* ====================== 🔹 NAVBAR 🔹 ====================== */}
      <header
        className="navbar shadow-sm"
        style={{
          backgroundColor: "#BD1E2D",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 60px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {/*  Logo */}
        <div
          className="logo"
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => navigate("/customer/home")}
        >
          <img
            src="/assets/customer/img/logo-white.png"
            alt="MyTrip Logo"
            style={{ height: "45px" }}
          />
        </div>

        {/*  Menu */}
        <nav>
          <ul
            className="nav-links"
            style={{
              listStyle: "none",
              display: "flex",
              gap: "25px",
              margin: 0,
              padding: 0,
            }}
          >
            <li>
              <Link to="/customer/home" className="text-white text-decoration-none fw-bold">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link to="/customer/booking" className="text-white text-decoration-none fw-bold">
                Đặt vé
              </Link>
            </li>
            <li>
              <Link to="/customer/lookup" className="text-white text-decoration-none fw-bold">
                Tra cứu vé
              </Link>
            </li>
            <li>
              <Link to="/customer/news" className="text-white text-decoration-none fw-bold">
                Tin tức
              </Link>
            </li>
            <li>
              <Link to="/customer/contact" className="text-white text-decoration-none fw-bold">
                Liên hệ
              </Link>
            </li>
          </ul>
        </nav>

        {/* Người dùng */}
        <div id="user-area" style={{ position: "relative" }} ref={menuRef}>
          {!user ? (
            <div id="guest-buttons">
              <Link
                to="/customer/login"
                style={{ color: "white", textDecoration: "none", marginRight: "15px" }}
              >
                Đăng nhập
              </Link>
              <Link
                to="/customer/register"
                style={{
                  background: "white",
                  color: "#BD1E2D",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <div
              id="user-info"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <img
                src={
                  user.avatar
                         ? `http://localhost:5000/uploads/avatars/${user.avatar}`
      : "/assets/customer/img/default.jpg"
                }
                alt="Avatar"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "2px solid white",
                }}
              />
              <span style={{ fontWeight: "600" }}>{user.full_name || "Khách"}</span>
              <i
                className="bi bi-caret-down-fill"
                style={{
                  fontSize: "0.9rem",
                  transition: "0.3s",
                  transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              ></i>

              {/*  Dropdown menu */}
              {menuOpen && (
                <div
                  id="user-menu"
                  className="shadow-lg"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "48px",
                    background: "white",
                    borderRadius: "10px",
                    minWidth: "220px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    zIndex: 999,
                    overflow: "hidden",
                  }}
                >
                  <Link
                    to="/customer/profile"
                    className="menu-item"
                    style={{
                      display: "block",
                      padding: "10px 20px",
                      color: "#333",
                      textDecoration: "none",
                    }}
                  >
                    👤 Thông tin tài khoản
                  </Link>
                  <Link
                    to="/customer/profile#mytickets"
                    className="menu-item"
                    style={{
                      display: "block",
                      padding: "10px 20px",
                      color: "#333",
                      textDecoration: "none",
                    }}
                  >
                    🎟️ Vé của tôi
                  </Link>
                  <Link
                    to="/customer/profile#history"
                    className="menu-item"
                    style={{
                      display: "block",
                      padding: "10px 20px",
                      color: "#333",
                      textDecoration: "none",
                    }}
                  >
                    ⏱️ Lịch sử mua vé
                  </Link>
                  <Link
                    to="/customer/profile#reset"
                    className="menu-item"
                    style={{
                      display: "block",
                      padding: "10px 20px",
                      color: "#333",
                      textDecoration: "none",
                    }}
                  >
                    🔐 Đổi mật khẩu
                  </Link>
                  <hr style={{ margin: "8px 0", borderColor: "#eee" }} />
<button
  onClick={() => setShowLogoutModal(true)}
  className="menu-item text-danger fw-semibold w-100 border-0 bg-white"
  style={{
    display: "block",
    padding: "10px 20px",
    textAlign: "left",
    cursor: "pointer",
  }}
>
  🚪 Đăng xuất
</button>

                </div>
              )}
            </div>
          )}


        </div>
      </header>

      {/*  CONTENT  */}
      <main style={{ minHeight: "80vh" }}>
        <Outlet />
      </main>

      {/* FOOTER */}
<footer
  style={{
    background: "#bd1e2d",
    fontFamily: "'Be Vietnam Pro', sans-serif",
    color: "#fff",
    padding: "20px 0",
    marginTop: "40px",
    textAlign: "center",
    lineHeight: "1.6",
  }}
>
  <div className="footer-container">
    <p style={{ margin: 0, fontWeight: 500 }}>© 2025 MyTrip - Chất lượng là danh dự</p>
    <p style={{ margin: 0, fontWeight: 400 }}>
      Hotline: 1900 6067 | Email: hotro@mytripbus.vn
    </p>
  </div>
</footer>
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
            setUser(null);
            setShowLogoutModal(false);
            navigate("/customer/home"); // ✅ Điều hướng về Home
          }}
        >
          Đồng ý
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
