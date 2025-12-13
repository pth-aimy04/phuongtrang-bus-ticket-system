import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Form } from "react-bootstrap";
import BASE_API from "../../config/api";

const API_BASE = `${BASE_API}/tickets`;

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // 1 LOAD DANH SÁCH VÉ (theo booking_code)
  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/all`);
      const data = await res.json();

      // Gộp vé theo booking_code (mỗi booking chỉ 1 dòng)
      const grouped = Object.values(
        data.reduce((acc, cur) => {
          if (!acc[cur.booking_code]) acc[cur.booking_code] = cur;
          return acc;
        }, {})
      );

      setTickets(grouped);
      setFilteredTickets(grouped);
    } catch (err) {
      console.error("❌ Lỗi tải danh sách vé:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // 2 TÌM KIẾM (Tên KH + Ngày đặt)
  useEffect(() => {
    const filtered = tickets.filter((t) => {
      const nameMatch = t.customer_name
        ?.toLowerCase()
        .includes(searchName.toLowerCase());

      const dateMatch = searchDate
        ? new Date(t.booking_date).toISOString().split("T")[0] === searchDate
        : true;

      return nameMatch && dateMatch;
    });
    setFilteredTickets(filtered);
  }, [searchName, searchDate, tickets]);

  // 3 XEM CHI TIẾT VÉ (theo booking_code)
  const viewTicket = async (bookingCode) => {
    try {
      const res = await fetch(`${API_BASE}/detail?booking_code=${bookingCode}`);
      const data = await res.json();
      setSelectedTicket(data); // lấy vé đầu tiên trong mảng
      setShowModal(true);
    } catch (err) {
      console.error("❌ Lỗi xem vé:", err);
    }
  };

  // 4 HỦY VÉ
  const cancelTicket = async (bookingCode) => {
    if (!window.confirm(`Bạn có chắc muốn hủy vé ${bookingCode}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/cancel/${bookingCode}`, {
        method: "PUT",
      });
      const data = await res.json();
      alert(data.message || "Đã hủy vé thành công!");
      loadTickets();
    } catch (err) {
      console.error("❌ Lỗi hủy vé:", err);
      alert("Không thể hủy vé.");
    }
  };

  // 5 RENDER GIAO DIỆN
  return (
    <div className="container-fluid mt-4">
      <div className="card shadow">
        <div className="card-body">
          {/*  Tiêu đề + thanh tìm kiếm */}
          <h4 className="card-title d-flex justify-content-between align-items-center mb-3">
            <span>🎫 Danh sách vé khách hàng</span>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="🔍 Tìm theo tên khách hàng..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ width: "230px" }}
              />
              <Form.Control
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                style={{ width: "180px" }}
              />
              {(searchName || searchDate) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchName("");
                    setSearchDate("");
                  }}
                >
                  ✖ Xóa lọc
                </Button>
              )}
            </div>
          </h4>

          {/*  Bảng danh sách vé */}
          <div
            className="table-responsive"
            style={{
              maxHeight: "500px",
              overflowY: "auto",
              border: "1px solid #ddd",
            }}
          >
            <Table
              striped
              bordered
              hover
              className="align-middle text-center mb-0"
            >
              <thead
                className="table-dark"
                style={{ position: "sticky", top: 0, zIndex: 2 }}
              >
                <tr>
                  <th>STT</th>
                  <th>Mã vé</th>
                  <th>Tên khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-muted text-center">
                      Đang tải dữ liệu vé...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-muted text-center">
                      Không có vé nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t, i) => (
                    <tr key={t.booking_code}>
                      <td>{i + 1}</td>
                      <td>{t.booking_code}</td>
                      <td>{t.customer_name}</td>
                      <td>
                        {t.booking_date
                          ? new Date(t.booking_date).toLocaleString("vi-VN")
                          : "-"}
                      </td>
                      <td>
                        <span
                          className={`badge px-3 py-2 ${
                            t.status === "Đã hủy"
                              ? "bg-danger"
                              : t.status === "Hoàn tất"
                              ? "bg-secondary"
                              : t.status === "Đã đặt"
                              ? "bg-success"
                              : "bg-light text-dark"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge px-3 py-2 ${
                            t.payment_status === "Đã thanh toán"
                              ? "bg-info text-dark"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {t.payment_status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            style={{
                              backgroundColor: "#0d6efd",
                              border: "none",
                            }}
                            onClick={() => viewTicket(t.booking_code)}
                          >
                            Xem
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            style={{
                              backgroundColor: "#dc3545",
                              border: "none",
                            }}
                            onClick={() => cancelTicket(t.booking_code)}
                          >
                            Hủy
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      {/*  Modal chi tiết vé */}
<Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
  <Modal.Header closeButton style={{ backgroundColor: "#BD1E2D", color: "white" }}>
    <Modal.Title>Chi tiết vé #{selectedTicket?.[0]?.booking_code || "Không rõ"}</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {selectedTicket && selectedTicket.length > 0 ? (
      <>
        {/* Thông tin chung */}
        <p><b>Khách hàng:</b> {selectedTicket[0].customer_name}</p>
        <p><b>SĐT:</b> {selectedTicket[0].customer_phone}</p>
        <p><b>Loại chuyến:</b> {selectedTicket[0].trip_type}</p>
        <hr />

        {/* Danh sách chiều đi / về */}
        {selectedTicket.map((trip, idx) => (
          <div key={idx} className="mb-4 border-start border-4 border-danger ps-3">
            <h6 className="fw-bold text-danger">
              🚌 {trip.direction === "Đi" ? "Chiều đi" : "Chiều về"}
            </h6>
            <p><b>Ngày đặt:</b> {new Date(trip.booking_date).toLocaleString("vi-VN")}</p>
            <p><b>Tuyến:</b> {trip.start_point} → {trip.end_point}</p>
            <p><b>Khởi hành:</b> {new Date(trip.departure_time).toLocaleString("vi-VN")}</p>
            <p><b>Xe:</b> {trip.vehicle_type}</p>           
            <p><b>Ghế:</b> {trip.seat_numbers}</p>
            <p><b>Giá vé:</b> {trip.price.toLocaleString("vi-VN")} VND</p>
            <p><b>Trạng thái:</b> {trip.status}</p>
            <p><b>Thanh toán:</b> {trip.payment_status}</p>
          </div>
        ))}
      </>
    ) : (
      <p>Đang tải chi tiết vé...</p>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Đóng
    </Button>
  </Modal.Footer>
</Modal>

    </div>
  );
}






