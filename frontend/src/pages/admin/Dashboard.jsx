import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import BASE_API from "../../config/api";

  import "../../assets/admin/css/Dashboard.css";

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const API_BASE = BASE_API;

export default function Dashboard() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [routes, setRoutes] = useState([]);
  const [topRoute, setTopRoute] = useState("Đang tải...");

  useEffect(() => {
    loadTodayRevenue();
    loadTotalRevenue();
    loadTotalTickets();
    loadRouteRevenue();
  }, []);

  async function loadTodayRevenue() {
    const res = await fetch(`${API_BASE}/dash/today`);
    setTodayRevenue((await res.json()).TongDoanhThu || 0);
  }

  async function loadTotalRevenue() {
    const res = await fetch(`${API_BASE}/dash/total`);
    setTotalRevenue((await res.json()).TongDoanhThu || 0);
  }

  async function loadTotalTickets() {
    const res = await fetch(`${API_BASE}/dash/route`);
    const data = await res.json();
    setTotalTickets(data.reduce((s, x) => s + x.LuotThanhToan, 0));
  }

  async function loadRouteRevenue() {
    const res = await fetch(`${API_BASE}/dash/route`);
    const data = await res.json();
    setRoutes(data);

    let max = 0;
    let best = "";
    data.forEach((r) => {
      if (r.DoanhThu > max) {
        max = r.DoanhThu;
        best = r.Tuyen;
      }
    });

    setTopRoute(best || "Không có dữ liệu");
  }

  //BIỂU ĐỒ BAR
  const barData = {
    labels: routes.map((r) => r.Tuyen),
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: routes.map((r) => r.DoanhThu),
        backgroundColor: "rgba(189, 30, 45, 0.7)", 
        borderColor: "#BD1E2D",
        borderWidth: 2,
      },
    ],
  };

  // BIỂU ĐỒ PIE 
  const pieData = {
    labels: routes.map((r) => r.Tuyen),
    datasets: [
      {
        data: routes.map((r) => r.DoanhThu),
        backgroundColor: [
          "#ff4d4d",
          "#ff944d",
          "#ffd24d",
          "#8cff66",
          "#66d9ff",
          "#b366ff",
          "#ff66b3",
        ],
      },
    ],
  };

  return (
    <div className="container-fluid mt-3">

      {/* KPI */}
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="dashboard-card">
            <div className="dashboard-icon"></div>
            <div className="kpi-title">Doanh thu hôm nay</div>
            <div className="kpi-value text-success">
              {todayRevenue.toLocaleString()} đ
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="dashboard-card">
            <div className="dashboard-icon"></div>
            <div className="kpi-title">Tổng doanh thu</div>
            <div className="kpi-value text-primary">
              {totalRevenue.toLocaleString()} đ
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="dashboard-card">
            <div className="dashboard-icon"></div>
            <div className="kpi-title">Tổng lượt đặt</div>
            <div className="kpi-value text-warning">{totalTickets}</div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ + HOT ROUTE */}
      <div className="row mt-4 g-3">

        {/* BAR CHART */}
        <div className="col-lg-8">
          <div className="dashboard-card">
            <h4>📊 Biểu đồ doanh thu theo tuyến</h4>
            <Bar data={barData} height={90} />
          </div>
        </div>

        {/* PIE CHART */}
        <div className="col-lg-4">
          <div className="dashboard-card">
            <h4> Tỷ lệ doanh thu</h4>
            <Pie data={pieData} />
          </div>
        </div>
      </div>

      {/* TOP ROUTE */}
      <div className="row mt-4">
        <div className="col-lg-12">
          <div className="hot-route-card">
            <h5>Tuyến Hot Nhất </h5>
            <h2>{topRoute}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
