import React, { useEffect, useState } from "react";
import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

export default function Home() {
  const API_URL = BASE_API;

  const [fromList, setFromList] = useState([]);
  const [toList, setToList] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [tripType, setTripType] = useState("Một chiều"); // FE vẫn giữ để hiển thị
  const [ticketCount, setTicketCount] = useState(1);
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [returnDate, setReturnDate] = useState("");


  //  Khi load trang
  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    fetchRoutes();
    fetchPopular();
  }, []);

  //  Nạp danh sách tuyến
  async function fetchRoutes() {
    try {
      const res = await fetch(`${API_URL}/routes`);
      const data = await res.json();
      setFromList([...new Set(data.map((r) => r.start_point))]);
      setToList([...new Set(data.map((r) => r.end_point))]);
    } catch (e) {
      console.error("❌ Lỗi tải danh sách tuyến:", e);
    }
  }

  //  Tìm chuyến
async function searchTrips() {
  if (!from || !to || !date) {
    alert("⚠️ Vui lòng chọn đủ điểm đi, điểm đến và ngày đi!");
    return;
  }

  setLoading(true);

  try {
    //  Gọi chiều đi 
    const resGo = await fetch(`${API_URL}/trips/public?from=${from}&to=${to}&date=${date}`);
    const goData = await resGo.json();

    if (!goData.goTrips?.length) {
      alert("❌ Không tìm thấy chuyến xe phù hợp!");
      setResults([]);
      return;
    }

    setResults(goData.goTrips);

    //2Nếu là khứ hồi thì gọi thêm chiều về 
    if (tripType === "Khứ hồi") {
      const resReturn = await fetch(`${API_URL}/trips/public?from=${to}&to=${from}&date=${date}`);
      const returnData = await resReturn.json();

      // Lưu tạm vào localStorage để trang booking dùng
      localStorage.setItem("returnTrips", JSON.stringify(returnData.goTrips || []));
    } else {
      localStorage.removeItem("returnTrips");
    }

  } catch (e) {
    console.error("❌ Lỗi khi tìm chuyến:", e);
    alert("Không thể tải dữ liệu chuyến xe!");
  } finally {
    setLoading(false);
  }
}


  //  Đổi chiều
  const swapPlaces = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  //  Slug ảnh
const makeSlug = (name) => {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  //  Map đặc biệt
  if (normalized.includes("tphochiminh") || normalized.includes("hochiminh")) return "tphcm";
  if (normalized.includes("cantho")) return "cantho";
  if (normalized.includes("dalat")) return "dalat";

  return normalized;
};


  //  Tuyến phổ biến
  async function fetchPopular() {
    try {
      const res = await fetch(`${API_URL}/routes/popular`);
      const data = await res.json();
      setPopular(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("❌ Lỗi tải tuyến phổ biến:", e);
      setPopular([]);
    }
  }

  // Chọn chuyến
const goToBooking = (trip) => {
  localStorage.setItem(
    "homeSelectedRoute",
    JSON.stringify({
      from: trip.start_point,
      to: trip.end_point,
      date: new Date(trip.departure_time).toISOString().split("T")[0],
    })
  );

  window.location.href = "/customer/booking";
};



  return (
    <div className="home-page">
      {/*  Banner */}
      <section className="hero">
        <div className="hero-text">
          <h1>MyTrip Bus Line</h1>
          <p>Vững tin & phát triển – Chất lượng là danh dự</p>
        </div>
        <img src="/assets/customer/img/banner.png" alt="Banner" className="hero-img" />
      </section>

      {/* Booking */}
      <section className="booking-section">
        <h2>Đặt vé xe nhanh chóng</h2>
        <div className="booking-form">
          <div className="trip-type">
            {["Một chiều", "Khứ hồi"].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="tripType"
                  value={type}
                  checked={tripType === type}
                  onChange={(e) => setTripType(e.target.value)}
                />{" "}
                {type}
              </label>
            ))}
          </div>

          <div className="booking-inputs">
            <div className="input-group">
              <label>Điểm đi</label>
              <select value={from} onChange={(e) => setFrom(e.target.value)}>
                <option value="">Chọn điểm đi</option>
                {fromList.map((f, i) => (
                  <option key={i}>{f}</option>
                ))}
              </select>
            </div>

            <button id="swapBtn" onClick={swapPlaces}>
              ⇄
            </button>

            <div className="input-group">
              <label>Điểm đến</label>
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">Chọn điểm đến</option>
                {toList.map((t, i) => (
                  <option key={i}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Ngày đi</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {/* dùng return_dateì */}
            {tripType === "Khứ hồi" && (
  <div className="input-group">
    <label>Ngày về</label>
    <input
      type="date"
      value={returnDate}
      onChange={(e) => setReturnDate(e.target.value)}
      min={date} // không cho chọn ngày về trước ngày đi
    />
  </div>
)}

            <div className="input-group">
              <label>Số vé</label>
              <select value={ticketCount} onChange={(e) => setTicketCount(e.target.value)}>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn-search" onClick={searchTrips} disabled={loading}>
            {loading ? "Đang tìm..." : "Tìm chuyến xe"}
          </button>
        </div>

        {/*  Kết quả chuyến */}
        <div className="results-container">
          {results.length > 0 ? (
            results.map((t) => (
              <div className="trip-card fade-in" key={t.trip_id}>
                <div className="trip-info">
                  <h3>{t.route_name || `${t.start_point} → ${t.end_point}`}</h3>
                  <p>🕒 Khởi hành: {new Date(t.departure_time).toLocaleString("vi-VN")}</p>
                  <p>💰 Giá vé: {Number(t.price).toLocaleString("vi-VN")}đ</p>
                  <p>🚌 Loại xe: {t.vehicle_type || "Chưa xác định"}</p>
                </div>
                <button className="btn-choose" onClick={() => goToBooking(t)}>
                  Chọn chuyến
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted">
              {loading ? "" : "🔍 Chọn điểm đi, điểm đến và ngày đi để tìm chuyến."}
            </p>
          )}
        </div>
      </section>

      {/*  Tuyến phổ biến */}
      <section className="routes-section">
        <h2 className="text-center fw-bold mb-4">Tuyến phổ biến nhất</h2>
        <div id="popularRoutes" className="routes">
      {(showMore ? popular : popular.slice(0, 3)).map((r, i) => {
  const slug = makeSlug(r.start_point);
  const srcPng = `/assets/customer/img/${slug}.png`;
  const srcJpg = `/assets/customer/img/${slug}.jpg`;

  const handleSelectPopular = () => {
    localStorage.setItem("popularRoute", JSON.stringify({ from: r.start_point, to: r.end_point }));
    window.location.href = "/customer/booking";
  };

  return (
    <div
      className="popular-card fade-in"
      key={i}
      onClick={handleSelectPopular}
      style={{ cursor: "pointer" }}
    >
         <img
        src={srcPng}
        alt={slug}
        className="route-img"
        onError={(e) => {
          const el = e.currentTarget;
          // Thử JPG nếu PNG lỗi; nếu JPG cũng lỗi thì dùng default
          if (!el.dataset.fallback) {
            el.dataset.fallback = "jpg";
            el.src = srcJpg;
          } else if (el.dataset.fallback === "jpg") {
            el.dataset.fallback = "default";
            el.src = "/assets/customer/img/default.jpg";
          }
        }}
      />
      <div className="popular-info">
        <h4>{r.start_point} → {r.end_point}</h4>
        <p>💰 {Number(r.price).toLocaleString("vi-VN")}đ</p>
        <p>📏 {r.distance_km} km – 🕒 {r.travel_time}</p>
      </div>
    </div>
  );
})}

        </div>

        {popular.length > 3 && (
          <button className="btn-show-more" onClick={() => setShowMore(!showMore)}>
            {showMore ? "Thu gọn ▲" : "Xem thêm ▼"}
          </button>
        )}
      </section>
    </div>
  );
}
