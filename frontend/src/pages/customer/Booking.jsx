import React, { useEffect, useState } from "react";
import "../../assets/customer/css/style.css";
import "../../assets/customer/css/layout.css";
import BASE_API from "../../config/api";

export default function Booking() {
  const API_URL = BASE_API;

  // STATE 
  const [routes, setRoutes] = useState([]);
  const [filters, setFilters] = useState({ hours: [], types: [] });
  const [tripType, setTripType] = useState("Một chiều");

  const [form, setForm] = useState({
    from: "",
    to: "",
    date: "",
    returnDate: "",
  });

  const [allTrips, setAllTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [returnTrips, setReturnTrips] = useState([]);

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedReturnTrip, setSelectedReturnTrip] = useState(null);

  const [seats, setSeats] = useState([]);
  const [returnSeats, setReturnSeats] = useState([]);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState([]);

  const [seatPrice, setSeatPrice] = useState(0);
  const [returnSeatPrice, setReturnSeatPrice] = useState(0);
  const [from, setFrom] = useState("");
const [to, setTo] = useState("");
const [trips, setTrips] = useState([]);
 // KHỞI TẠO 
useEffect(() => {
  loadRoutes();
  loadFilters();

  const popularRoute = JSON.parse(localStorage.getItem("popularRoute") || "null");

  if (popularRoute) {
    setFrom(popularRoute.from);
    setTo(popularRoute.to);

    // Gọi API hiển thị danh sách chuyến
    fetch(
      `${API_URL}/trips/public?from=${popularRoute.from}&to=${popularRoute.to}&date=${new Date()
        .toISOString()
        .split("T")[0]}`
    )
      .then((res) => res.json())
      .then((data) => setTrips(data.goTrips || []))
      .catch((err) => console.error("❌ Lỗi khi tải tuyến phổ biến:", err));

    // Xóa sau khi dùng để không tự kích hoạt lại
    localStorage.removeItem("popularRoute");
  }
}, []);
// NHẬN DỮ LIỆU TỪ HOME  
useEffect(() => {
  // 1. Trường hợp bấm từ Home → Chọn chuyến 
  const homeRoute = JSON.parse(localStorage.getItem("homeSelectedRoute") || "null");

  if (homeRoute) {
    // Set vào form
    setForm({
      ...form,
      from: homeRoute.from,
      to: homeRoute.to,
      date: homeRoute.date,
    });

    // Gọi API tìm chuyến để render ngay
    fetch(
      `${API_URL}/trips/public?from=${homeRoute.from}&to=${homeRoute.to}&date=${homeRoute.date}`
    )
      .then((res) => res.json())
      .then((data) => {
        setAllTrips(data.goTrips || []);
        setFilteredTrips(data.goTrips || []);
      })
      .catch((err) => console.error("Lỗi load từ Home:", err));

    localStorage.removeItem("homeSelectedRoute");
  }

  // Trường hợp bấm tuyến phổ biến ---
  const popularRoute = JSON.parse(localStorage.getItem("popularRoute") || "null");

  if (popularRoute) {
    const today = new Date().toISOString().split("T")[0];

    setForm({
      ...form,
      from: popularRoute.from,
      to: popularRoute.to,
      date: today,
    });

    fetch(
      `${API_URL}/trips/public?from=${popularRoute.from}&to=${popularRoute.to}&date=${today}`
    )
      .then((res) => res.json())
      .then((data) => {
        setAllTrips(data.goTrips || []);
        setFilteredTrips(data.goTrips || []);
      })
      .catch((err) => console.error("Lỗi load phổ biến:", err));

    localStorage.removeItem("popularRoute");
  }
}, []);

  async function loadRoutes() {
    try {
      const res = await fetch(`${API_URL}/routes`);
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.error("❌ Lỗi tải tuyến:", err);
    }
  }

  async function loadFilters() {
    try {
      const res = await fetch(`${API_URL}/trips/filters`);
      const data = await res.json();
      setFilters(data);
    } catch (err) {
      console.error("❌ Lỗi tải bộ lọc:", err);
    }
  }

  // TÌM CHUYẾN 
  async function searchTrips() {
  const { from, to, date, returnDate } = form;

  if (!from || !to || !date) {
    alert("⚠️ Vui lòng chọn đầy đủ điểm đi, điểm đến và ngày đi!");
    return;
  }
  // gọi API tìm chuyến
  try {
    const url = `${API_URL}/trips/search/public?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("📦 Kết quả API:", data);

    if (!Array.isArray(data) && data.message) {
      alert("⚠️ " + data.message);
      setAllTrips([]);
      setFilteredTrips([]);
      return;
    }

    const trips = Array.isArray(data)
      ? data
      : data.goTrips || data.trips || [];
    const backTrips = data.returnTrips || [];

    setAllTrips(trips);
    setFilteredTrips(trips);
    setReturnTrips(backTrips);
    resetSelection();
  } catch (err) {
    alert("❌ Lỗi tìm chuyến: " + err.message);
  }
}


  // RESET LỰA CHỌN 
  function resetSelection() {
    setSelectedTrip(null);
    setSelectedReturnTrip(null);
    setSeats([]);
    setReturnSeats([]);
    setSelectedSeats([]);
    setSelectedReturnSeats([]);
  }

  // ÁP DỤNG BỘ LỌC 
  function applyFilters() {
    let list = Array.isArray(allTrips) ? [...allTrips] : [];
    const hours = [
      ...document.querySelectorAll(".filter-hour:checked"),
    ].map((e) => e.value);
    const types = [
      ...document.querySelectorAll(".filter-btn.active"),
    ].map((e) => e.dataset.type);

    if (hours.length) {
      list = list.filter((t) => {
        const h = new Date(t.departure_time).getHours();
        return hours.some((g) => {
          if (g.includes("00:00 - 06:00")) return h >= 0 && h < 6;
          if (g.includes("06:00 - 12:00")) return h >= 6 && h < 12;
          if (g.includes("12:00 - 18:00")) return h >= 12 && h < 18;
          if (g.includes("18:00 - 24:00")) return h >= 18;
        });
      });
    }

    if (types.length) list = list.filter((t) => types.includes(t.vehicle_type));
    setFilteredTrips(list);
  }

  //CHỌN CHUYẾN
  async function selectTrip(trip) {
    setSelectedTrip(trip);
    setSeatPrice(Number(trip.price));
    setSelectedSeats([]);

    try {
      const res = await fetch(`${API_URL}/seats/trip/${trip.trip_id}`);
      const seatsData = await res.json();
      setSeats(seatsData);

      // Nếu là khứ hồi có thể tự động hiển thị chuyến ngược
      if (tripType === "Khứ hồi" && form.returnDate) {
        const reverseTrips = await searchReturnTrips();
        setReturnTrips(reverseTrips);
      }
    } catch (err) {
      alert("❌ Lỗi tải ghế: " + err.message);
    }
  }

  //  TÌM CHUYẾN NGƯỢC LẠI 
  async function searchReturnTrips() {
    const { from, to, returnDate } = form;
    if (!returnDate) return [];
    try {
      const params = new URLSearchParams({
        from: to,
        to: from,
        date: returnDate,
      });
      const res = await fetch(`${API_URL}/trips/search/public?${params}`);
      const data = await res.json();
      return Array.isArray(data) ? data : data.goTrips || [];
    } catch (err) {
      console.error("❌ Lỗi tìm chuyến ngược lại:", err);
      return [];
    }
  }

  // CHỌN CHUYẾN VỀ 
  async function selectReturnTrip(trip) {
    setSelectedReturnTrip(trip);
    setReturnSeatPrice(Number(trip.price));
    setSelectedReturnSeats([]);

    try {
      const res = await fetch(`${API_URL}/seats/trip/${trip.trip_id}`);
      const seatsData = await res.json();
      setReturnSeats(seatsData);
    } catch (err) {
      alert("❌ Lỗi tải ghế về: " + err.message);
    }
  }

  //   CHỌN GHẾ  
  function toggleSeat(seat, type = "go") {
    if (seat.is_booked) return;
    if (type === "go") {
      setSelectedSeats((prev) =>
        prev.some((s) => s.seat_id === seat.seat_id)
          ? prev.filter((s) => s.seat_id !== seat.seat_id)
          : [...prev, seat]
      );
    } else {
      setSelectedReturnSeats((prev) =>
        prev.some((s) => s.seat_id === seat.seat_id)
          ? prev.filter((s) => s.seat_id !== seat.seat_id)
          : [...prev, seat]
      );
    }
  }

  //   ĐẶT VÉ  
  async function handleBooking() {
    if (!selectedTrip) return alert("⚠️ Vui lòng chọn chuyến đi!");
    if (selectedSeats.length === 0)
      return alert("⚠️ Vui lòng chọn ít nhất 1 ghế!");

    const userData = localStorage.getItem("customer_user");
    if (!userData) {
      alert("⚠️ Bạn cần đăng nhập để thanh toán!");
      localStorage.setItem("redirect_after_login", window.location.href);
      return (window.location.href = "/customer/login");
    }

    const user = JSON.parse(userData);
    const seatIds = selectedSeats.map((s) => s.seat_id);
    const returnSeatIds = selectedReturnSeats.map((s) => s.seat_id);

    const payload = {
      user_id: user.user_id,
      trip_id: selectedTrip.trip_id,
      seat_ids: seatIds,
    };

    if (tripType === "Khứ hồi" && selectedReturnTrip) {
      payload.return_trip_id = selectedReturnTrip.trip_id;
      payload.return_seat_ids = returnSeatIds;
    }

    const total =
      selectedSeats.length * seatPrice +
      selectedReturnSeats.length * returnSeatPrice;

    try {
      const res = await fetch(`${API_URL}/tickets/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("🎉 Đặt vé thành công!");
      window.location.href = `/customer/payment?booking_code=${data.booking_code}&amount=${total}`;
    } catch (err) {
      alert("❌ Lỗi đặt vé: " + err.message);
    }
  }

  const total =
    selectedSeats.length * seatPrice +
    selectedReturnSeats.length * returnSeatPrice;

  //   RENDER  
  return (
    <div className="container mt-4 booking-page">
      <h2 className="section-title">🚌 Đặt vé xe</h2>
      <div className="booking-layout">
        {/* LEFT: Bộ lọc */}
        <div>
          <div className="filter-box mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6>📋 Bộ lọc tìm kiếm</h6>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-sm text-danger"
              >
                Bỏ lọc 🗑️
              </button>
            </div>

            <label>🚏 Điểm đi</label>
            <select
              className="form-select mb-2"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            >
              <option value="">-- Chọn điểm đi --</option>
              {[...new Set(routes.map((r) => r.start_point))].map((p, i) => (
                <option key={i}>{p}</option>
              ))}
            </select>

            <label>📍 Điểm đến</label>
            <select
              className="form-select mb-2"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            >
              <option value="">-- Chọn điểm đến --</option>
              {[...new Set(routes.map((r) => r.end_point))].map((p, i) => (
                <option key={i}>{p}</option>
              ))}
            </select>

            <label>📅 Ngày đi</label>
            <input
              type="date"
              className="form-control mb-2"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <label>🔄 Loại tuyến</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="tripType"
                  value="Một chiều"
                  checked={tripType === "Một chiều"}
                  onChange={(e) => setTripType(e.target.value)}
                />{" "}
                Một chiều
              </label>
              <label className="ms-3">
                <input
                  type="radio"
                  name="tripType"
                  value="Khứ hồi"
                  checked={tripType === "Khứ hồi"}
                  onChange={(e) => setTripType(e.target.value)}
                />{" "}
                Khứ hồi
              </label>
            </div>

            {tripType === "Khứ hồi" && (
              <div className="mt-2">
                <label>📅 Ngày về</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.returnDate}
                  onChange={(e) =>
                    setForm({ ...form, returnDate: e.target.value })
                  }
                />
              </div>
            )}

            <button onClick={searchTrips} className="btn btn-primary w-100 mt-3">
              🔍 Tìm chuyến
            </button>

            {/* Bộ lọc nâng cao */}
            <div id="filter-container" className="mt-3">
              <div className="mb-3">
                <label className="fw-bold mb-1">🕒 Giờ đi</label>
                {filters.hours.map((h, i) => (
                  <div key={i} className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input filter-hour"
                      value={h}
                      onChange={applyFilters}
                    />
                    <label className="form-check-label">{h}</label>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <label className="fw-bold mb-1">🚍 Loại xe</label>
                <div className="d-flex flex-wrap gap-2">
                  {filters.types.map((t, i) => (
                    <button
                      key={i}
                      className="filter-btn btn btn-sm btn-outline-secondary"
                      data-type={t}
                      onClick={(e) => {
                        e.target.classList.toggle("active");
                        applyFilters();
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: CHUYẾN */}
        <div>
          <div id="tripResults">
            {filteredTrips.length === 0 ? (
              <p className="text-muted">🔍 Chưa có chuyến nào.</p>
            ) : (
              filteredTrips.map((t) => (
                <div
                  key={t.trip_id}
                  className={`trip-result ${
                    selectedTrip?.trip_id === t.trip_id ? "active" : ""
                  }`}
                  onClick={() => selectTrip(t)}
                >
                  <b>{t.route_name}</b>
                  <br />
                  🕒 {new Date(t.departure_time).toLocaleString("vi-VN")}
                  <br />
                  🚌 {t.vehicle_type || "Không rõ loại xe"} - 💰{" "}
                  {Number(t.price).toLocaleString()} VNĐ
                </div>
              ))
            )}

            {seats.length > 0 && (
              <div id="seat-grid" className="text-center mt-3">
                {seats.map((s) => (
                  <button
                    key={s.seat_id}
                    className={`seat ${
                      s.is_booked
                        ? "booked"
                        : selectedSeats.some(
                            (x) => x.seat_id === s.seat_id
                          )
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => toggleSeat(s, "go")}
                  >
                    {s.seat_number}
                  </button>
                ))}
              </div>
            )}

            {tripType === "Khứ hồi" && selectedTrip && (
              <>
                <hr />
                <h5>↩️ Chuyến về</h5>
                {returnTrips.length > 0 ? (
                  returnTrips.map((t) => (
                    <div
                      key={t.trip_id}
                      className={`trip-result ${
                        selectedReturnTrip?.trip_id === t.trip_id ? "active" : ""
                      }`}
                      onClick={() => selectReturnTrip(t)}
                    >
                      <b>{t.route_name}</b>
                      <br />
                      🕒 {new Date(t.departure_time).toLocaleString("vi-VN")}
                      <br />
                      🚌 {t.vehicle_type || "Không rõ loại xe"} - 💰{" "}
                      {Number(t.price).toLocaleString()} VNĐ
                    </div>
                  ))
                ) : (
                  <p className="text-muted">⏳ Không có chuyến về.</p>
                )}

                {returnSeats.length > 0 && (
                  <div id="seat-grid" className="text-center mt-3">
                    {returnSeats.map((s) => (
                      <button
                        key={s.seat_id}
                        className={`seat ${
                          s.is_booked
                            ? "booked"
                            : selectedReturnSeats.some(
                                (x) => x.seat_id === s.seat_id
                              )
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => toggleSeat(s, "return")}
                      >
                        {s.seat_number}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: THÔNG TIN */}
        <div>
          <div className="filter-box">
            <h6>🧾 Thông tin chuyến đi</h6>
            <p>🚏 <b>Điểm đi:</b> {form.from || "--"}</p>
            <p>📍 <b>Điểm đến:</b> {form.to || "--"}</p>
            <p>📅 <b>Ngày đi:</b> {form.date || "--"}</p>
            {tripType === "Khứ hồi" && (
              <p>📅 <b>Ngày về:</b> {form.returnDate || "--"}</p>
            )}
            <hr />
            <p>💺 <b>Ghế đi:</b> {selectedSeats.map((s) => s.seat_number).join(", ") || "--"}</p>
            {tripType === "Khứ hồi" && (
              <p>💺 <b>Ghế về:</b> {selectedReturnSeats.map((s) => s.seat_number).join(", ") || "--"}</p>
            )}
            <p>💰 <b>Tổng tiền:</b> {total.toLocaleString("vi-VN")} VNĐ</p>
          </div>

          <div className="card mt-3 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-danger mb-3">💵 Thanh toán</h6>
              <button
                id="btn-book"
                onClick={handleBooking}
                className="btn btn-danger w-100"
              >
                Xác nhận & Thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
