import React, { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  //  Kiểm tra đăng nhập
  useEffect(() => {
    const adminData = localStorage.getItem("admin_user");
    const role = localStorage.getItem("admin_role");

    if (!adminData || role !== "admin") {
      alert("❌ Bạn không có quyền truy cập trang này!");
      navigate("/customer/login");
    }
  }, [navigate]);

  //  Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("token");
    navigate("/customer/login");
  };

  // Link đang active
  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "d-flex align-items-center px-3 py-2 rounded bg-primary text-white fw-semibold no-underline"
      : "d-flex align-items-center px-3 py-2 rounded text-dark text-decoration-none hover-bg-light";

  return (
    <div className="d-flex flex-column flex-md-row">
      {/*  SIDEBAR */}
      <aside
        className={`bg-white border-end ${sidebarOpen ? "d-block" : "d-none d-md-block"}`}
        style={{
          width: "260px",
          minHeight: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1000,
        }}
      >
        {/*  Logo */}
        <div className="text-center py-3 border-bottom">
          <Link to="/admin/dashboard" className="text-decoration-none">
            <img
              src="/assets/admin/images/logos/logo.png"
              alt="Logo"
              style={{
                width: "60px",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </Link>
        </div>

        {/* Menu */}
        <nav className="mt-3 px-2">
          <p className="text-uppercase fw-bold text-muted small px-3 mb-2">
            Tổng quan
          </p>
          <ul className="list-unstyled">
            <li>
              <Link to="/admin/dashboard" className={isActive("/admin/dashboard")}>
                <i className="ti ti-dashboard me-2"></i> Bảng tổng quan
              </Link>
            </li>
            <li>
              <a
                href="/customer/home"
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center px-3 py-2 rounded text-dark text-decoration-none hover-bg-light"
                style={{ transition: "0.3s" }}
              >
                <i className="ti ti-home me-2"></i> Trang khách hàng
              </a>
            </li>
          </ul>

          <p className="text-uppercase fw-bold text-muted small px-3 mt-4 mb-2">
            Danh sách
          </p>
          <ul className="list-unstyled">
            <li>
              <Link to="/admin/users" className={isActive("/admin/users")}>
                <i className="ti ti-user me-2"></i> Khách hàng
              </Link>
            </li>
            <li>
              <Link to="/admin/routes" className={isActive("/admin/routes")}>
                <i className="ti ti-map me-2"></i> Tuyến xe
              </Link>
            </li>
            <li>
              <Link to="/admin/vehicles" className={isActive("/admin/vehicles")}>
                <i className="ti ti-car me-2"></i> Loại xe
              </Link>
            </li>
            <li>
              <Link to="/admin/trips" className={isActive("/admin/trips")}>
                <i className="ti ti-bus me-2"></i> Chuyến đi
              </Link>
            </li>
            <li>
              <Link to="/admin/tickets" className={isActive("/admin/tickets")}>
                <i className="ti ti-ticket me-2"></i> Vé
              </Link>
            </li>
          </ul>

          <p className="text-uppercase fw-bold text-muted small px-3 mt-4 mb-2">
            Khác
          </p>
          <ul className="list-unstyled">
            <li>
              <a
                href="#"
                className="d-flex align-items-center px-3 py-2 text-dark text-decoration-none hover-bg-light"
              >
                <i className="ti ti-message me-2"></i> Phản hồi
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/*  PHẦN CHÍNH */}
      <div
        className="flex-grow-1"
        style={{
          marginLeft: "260px",
          background: "#f8f9fa",
          minHeight: "100vh",
        }}
      >
        {/* HEADER */}
        <header
          className="d-flex justify-content-between align-items-center px-4 py-3 shadow-sm"
          style={{
            backgroundColor: "#c62828", //  đỏ nhạt tươi hơn
            color: "white",
            position: "sticky",
            top: 0,
            zIndex: 999,
            height: "74px", //  chỉnh cao bằng sidebar logo
          }}
        >
          <div className="d-flex align-items-center gap-3">
            {/* Nút menu (hiện khi mobile) */}
            <button
              className="btn btn-light d-md-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="ti ti-menu-2"></i>
            </button>
            <h5 className="mb-0 fw-semibold">Trang Quản Trị</h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <a
              href="/customer/home"
              className="btn d-flex align-items-center gap-1 fw-semibold"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#fff",
                color: "#c62828",
                border: "1px solid #fff",
                borderRadius: "6px",
                padding: "6px 12px",
                textDecoration: "none",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#e53935";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#fff";
                e.target.style.color = "#c62828";
              }}
            >
              <i className="ti ti-home"></i> Trang khách hàng
            </a>

            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
            >
              <i className="ti ti-logout"></i> Đăng xuất
            </button>
          </div>
        </header>

        {/* NỘI DUNG */}
        <main className="p-4">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="text-center py-3 border-top small text-muted bg-white">
          © 2025 MyTrip Admin Panel —{" "}
          <span className="text-danger fw-semibold">MyTrip Bus</span>
        </footer>
      </div>
    </div>
  );
}



