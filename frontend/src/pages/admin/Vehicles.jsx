import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Form, Badge } from "react-bootstrap";
import BASE_API from "../../config/api";

const API_BASE = `${BASE_API}/vehicles`;
const TYPE_API = `${BASE_API}/vehicles/types/all`;

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    license_plate: "",
    type_id: "",
    total_seats: "",
    status: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Load loại xe
  const loadVehicleTypes = async () => {
    try {
      const res = await fetch(TYPE_API);
      const data = await res.json();
      setVehicleTypes(data);
    } catch (err) {
      console.error("Lỗi tải loại xe:", err);
    }
  };

  // Load danh sách xe
  const loadVehicles = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setVehicles(data);
      setFilteredVehicles(data);
    } catch (err) {
      console.error("Lỗi tải danh sách xe:", err);
    }
  };

  //  Tìm kiếm xe
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = vehicles.filter(
      (v) =>
        v.license_plate.toLowerCase().includes(term) ||
        v.vehicle_type.toLowerCase().includes(term)
    );
    setFilteredVehicles(filtered);
  };

  //  Thêm xe
  const handleAdd = () => {
    setFormData({
      vehicle_id: "",
      license_plate: "",
      type_id: "",
      total_seats: "",
      status: "",
    });
    setShowModal(true);
  };

  //  Sửa xe
  const handleEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const v = await res.json();
      setFormData({
        vehicle_id: v.vehicle_id,
        license_plate: v.license_plate,
        type_id: v.type_id,
        total_seats: v.total_seats,
        status: v.status,
      });
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin xe:", err);
    }
  };

  //  Xóa xe
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa xe này không?")) return;
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      alert("🗑️ Xóa xe thành công!");
      loadVehicles();
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
    }
  };

  //  Lưu xe (POST / PUT)
  const handleSave = async () => {
    const { vehicle_id, license_plate, type_id, status } = formData;
    if (!license_plate || !type_id || !status) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const method = vehicle_id ? "PUT" : "POST";
    const url = vehicle_id ? `${API_BASE}/${vehicle_id}` : API_BASE;
    const body = {
      license_plate,
      type_id: parseInt(type_id),
      status,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        alert("❌ " + (result.error || "Lỗi không xác định!"));
        return;
      }

      alert(result.message || "✅ Lưu xe thành công!");
      setShowModal(false);
      loadVehicles();
    } catch (err) {
      alert("⚠️ Không thể kết nối đến máy chủ!");
      console.error(err);
    }
  };

  //  Cập nhật số ghế khi chọn loại xe
  const handleTypeChange = (e) => {
    const selectedType = vehicleTypes.find(
      (t) => t.type_id === parseInt(e.target.value)
    );
    setFormData({
      ...formData,
      type_id: e.target.value,
      total_seats: selectedType ? selectedType.total_seats : "",
    });
  };

  useEffect(() => {
    loadVehicleTypes();
    loadVehicles();
  }, []);

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow">
        <div className="card-body">
          <h4 className="card-title d-flex justify-content-between align-items-center mb-3">
            <span>Danh sách xe</span>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="🔍 Tìm kiếm theo biển số / loại xe..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: "250px" }}
              />
              <Button variant="primary" size="sm" onClick={handleAdd}>
                + Thêm xe
              </Button>
            </div>
          </h4>

          {/* Bảng có thanh cuộn và tiêu đề cố định */}
          <div
            className="table-responsive"
            style={{
              maxHeight: "500px",
              overflowY: "auto",
              border: "1px solid #ddd",
            }}
          >
            <Table striped bordered hover className="align-middle text-center mb-0">
              <thead
                className="table-dark"
                style={{ position: "sticky", top: 0, zIndex: 2 }}
              >
                <tr>
                  <th>STT</th>
                  <th>Biển số</th>
                  <th>Loại xe</th>
                  <th>Số ghế</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((v, i) => (
                    <tr key={v.vehicle_id}>
                      <td>{i + 1}</td>
                      <td>{v.license_plate}</td>
                      <td>{v.vehicle_type}</td>
                      <td>{v.total_seats}</td>
                      <td>
                        {v.status === "Hoạt động" ? (
                          <Badge bg="success">Hoạt động</Badge>
                        ) : v.status === "Bảo trì" ? (
                          <Badge bg="warning" text="dark">
                            Bảo trì
                          </Badge>
                        ) : (
                          <Badge bg="danger">Ngưng chạy</Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(v.vehicle_id)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(v.vehicle_id)}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted">
                      Không có xe nào khớp với tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Thêm / Cập nhật Xe */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm / Cập nhật xe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Biển số</Form.Label>
              <Form.Control
                type="text"
                placeholder="VD: 51B-12345"
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData({ ...formData, license_plate: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Loại xe</Form.Label>
              <Form.Select
                value={formData.type_id}
                onChange={handleTypeChange}
              >
                <option value="">-- Chọn loại xe --</option>
                {vehicleTypes.map((t) => (
                  <option key={t.type_id} value={t.type_id}>
                    {t.type_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Số ghế</Form.Label>
              <Form.Control
                type="number"
                value={formData.total_seats}
                readOnly
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="">-- Chọn trạng thái --</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Ngưng chạy">Ngưng chạy</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleSave}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>


    </div>
  );
};

export default Vehicles;
