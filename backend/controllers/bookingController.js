import React, { useState, useEffect } from "react";
import "./SeatLayout.css";

const SeatLayout = ({ tripId, pricePerSeat }) => {
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/seats/${tripId}`)
      .then((res) => res.json())
      .then((data) => setSeats(data));
  }, [tripId]);

  const toggleSeat = (seat) => {
    if (seat.is_booked) return;
    if (selected.includes(seat.seat_number)) {
      setSelected(selected.filter((s) => s !== seat.seat_number));
    } else {
      setSelected([...selected, seat.seat_number]);
    }
  };

  const total = selected.length * pricePerSeat;

  return (
    <div className="seat-wrapper">
      <h4>🚍 Sơ đồ ghế</h4>
      <div className="seat-grid">
        {seats.map((seat) => (
          <div
            key={seat.seat_id}
            className={`seat ${
              seat.is_booked
                ? "booked"
                : selected.includes(seat.seat_number)
                ? "selected"
                : "available"
            }`}
            onClick={() => toggleSeat(seat)}
          >
            {seat.seat_number}
          </div>
        ))}
      </div>
      <div className="summary">
        <p>Ghế đã chọn: {selected.join(", ") || "Chưa chọn"}</p>
        <p>Tổng tiền: <strong>{total.toLocaleString()} đ</strong></p>
        <button className="btn-book">Đặt ngay</button>
      </div>
    </div>
  );
};

export default SeatLayout;
