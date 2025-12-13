import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Form, Badge } from "react-bootstrap";
import "../../assets/customer/css/style.css";
import BASE_API from "../../config/api";

const API_BASE = BASE_API;

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    trip_id: "",
    route_id: "",
    vehicle_id: "",
    departure_time: "",
    price: "",
    available_seats: "",
  });

  // Load danh sách chuyến
  const loadTrips = async () => {
    const res = await fetch(`${API_BASE}/trips`);
    const data = await res.json();
    setTrips(data);
    setFilteredTrips(data);
  };

  const loadDropdowns = async () => {
    const [rRes, vRes] = await Promise.all([
      fetch(`${API_BASE}/routes`),
      fetch(`${API_BASE}/vehicles`),
    ]);
    setRoutes(await rRes.json());
    setVehicles(await vRes.json());
  };

  useEffect(() => {
    loadTrips();
    loadDropdowns();
  }, []);

  //  Tìm kiếm
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = trips.filter(
      (t) =>
        t.start_point.toLowerCase().includes(term) ||
        t.end_point.toLowerCase().includes(term) ||
        t.license_plate?.toLowerCase().includes(term)
    );
    setFilteredTrips(filtered);
  };

  //  Thêm chuyến
  const handleAdd = () => {
    setFormData({
      trip_id: "",
      route_id: "",
      vehicle_id: "",
      departure_time: "",
      price: "",
      available_seats: "",
    });
    setShowModal(true);
  };

  //  Sửa chuyến
  const handleEdit = async (id) => {
    const res = await fetch(`${API_BASE}/trips/${id}`);
    const t = await res.json();
    setFormData({
      trip_id: t.trip_id,
      route_id: t.route_id,
      vehicle_id: t.vehicle_id,
      departure_time: t.departure_time?.slice(0, 16),
      price: t.price,
      available_seats: t.available_seats,
    });
    setShowModal(true);
  };

// Huỷ chuyến
const handleCancel = async (id) => {
  if (!window.confirm("Bạn có chắc muốn huỷ chuyến này không?")) return;
  const res = await fetch(`${API_BASE}/trips/${id}/cancel`, { method: "PUT" });
  const data = await res.json();
  alert(data.message);
  loadTrips();
};


  //  Lưu chuyến
  const handleSave = async () => {
    const { trip_id, route_id, vehicle_id, departure_time, price, available_seats } = formData;

    if (!route_id || !vehicle_id || !departure_time || !price) {
      alert(" Vui lòng nhập đủ thông tin!");
      return;
    }

    const method = trip_id ? "PUT" : "POST";
    const url = trip_id ? `${API_BASE}/trips/${trip_id}` : `${API_BASE}/trips`;

    const body = { route_id, vehicle_id, departure_time, price, available_seats };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`❌ ${err.error}`);
      return;
    }

    alert("✅ Lưu chuyến thành công!");
    setShowModal(false);
    loadTrips();
  };

  //  Khi chọn xe → cập nhật số ghế
  const handleVehicleChange = (e) => {
    const selected = vehicles.find((v) => v.vehicle_id == e.target.value);
    setFormData({
      ...formData,
      vehicle_id: e.target.value,
      available_seats: selected ? selected.total_seats : "",
    });
  };

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow">
        <div className="card-body">
          <h4 className="card-title d-flex justify-content-between align-items-center mb-3">
            <span>🚍 Danh sách chuyến đi</span>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="🔍 Tìm kiếm tuyến / xe..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: "250px" }}
              />
              <Button variant="primary" size="sm" onClick={handleAdd}>
                + Thêm chuyến
              </Button>
            </div>
          </h4>

          {/* Bảng danh sách */}
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
              className="align-middle text-center mb-0 trips-table"
            >
              <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                <tr>
                  <th>STT</th>
                  <th>Tuyến</th>
                  <th>Xe</th>
                  <th>Ngày đi</th>
                  <th>Giờ đi</th>
                  <th>Giá vé (VNĐ)</th>
                  <th>Số ghế trống</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length > 0 ? (
                  filteredTrips.map((t, i) => {
                    const dep = new Date(t.departure_time);
                    const dateStr = dep.toLocaleDateString("vi-VN");
                    const timeStr = dep.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <tr key={t.trip_id}>
                        <td>{i + 1}</td>
                        <td>
                          {t.start_point} → {t.end_point}
                        </td>
                        <td>{t.license_plate || "N/A"}</td>
                        <td>{dateStr}</td>
                        <td>{timeStr}</td>
                        <td>{t.price.toLocaleString()} đ</td>
                        <td>{t.available_seats}</td>
<td>
  {t.status === "Đang mở" ? (
    <Badge bg="success">Đang mở</Badge>
  ) : t.status === "Đã đóng" ? (
    <Badge bg="secondary">Đã đóng</Badge>
  ) : t.status === "Đã khởi hành" ? (
    <Badge bg="info">Đã khởi hành</Badge>
  ) : (
    <Badge bg="danger">Đã huỷ</Badge>
  )}
</td>

                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(t.trip_id)}
                          >
                            Sửa
                          </Button>
<Button
  variant="danger"
  size="sm"
  onClick={() => handleCancel(t.trip_id)}
>
  Huỷ
</Button>
              
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-muted">
                      Không có chuyến nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Thêm / Sửa */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>✏️ Thêm / Cập nhật chuyến đi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label>Tuyến xe</Form.Label>
                <Form.Select
                  value={formData.route_id}
                  onChange={(e) =>
                    setFormData({ ...formData, route_id: e.target.value })
                  }
                >
                  <option value="">-- Chọn tuyến --</option>
                  {routes.map((r) => (
                    <option key={r.route_id} value={r.route_id}>
                      {r.start_point} → {r.end_point}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-6">
                <Form.Label>Xe</Form.Label>
                <Form.Select
                  value={formData.vehicle_id}
                  onChange={handleVehicleChange}
                >
                  <option value="">-- Chọn xe --</option>
                  {vehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.license_plate} ({v.vehicle_type})
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-6">
                <Form.Label>Ngày đi</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formData.departure_time}
                  onChange={(e) =>
                    setFormData({ ...formData, departure_time: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <Form.Label>Giá vé (VNĐ)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <Form.Label>Số ghế trống</Form.Label>
                <Form.Control type="number" value={formData.available_seats} readOnly />
              </div>

              <div className="col-md-12">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value="Tự động xác định (Đang mở / Đã đóng)"
                />
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            💾 Lưu
          </Button>
        </Modal.Footer>
      </Modal>


    </div>
  );
};

export default Trips;
