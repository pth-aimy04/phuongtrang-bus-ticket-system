import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Form } from "react-bootstrap";
import BASE_API from "../../config/api";

const API_BASE = `${BASE_API}/routes`;

const Routes = () => {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    route_id: "",
    start_point: "",
    end_point: "",
    distance_km: "",
    travel_time: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  //  Load danh sách tuyến
  const loadRoutes = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setRoutes(data);
      setFilteredRoutes(data);
    } catch (err) {
      console.error("Lỗi tải tuyến:", err);
    }
  };

  //  Tìm kiếm tuyến
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = routes.filter(
      (r) =>
        r.start_point.toLowerCase().includes(term) ||
        r.end_point.toLowerCase().includes(term)
    );
    setFilteredRoutes(filtered);
  };

  //  Thêm tuyến
  const handleAdd = () => {
    setFormData({
      route_id: "",
      start_point: "",
      end_point: "",
      distance_km: "",
      travel_time: "",
    });
    setShowModal(true);
  };

  //  Sửa tuyến
  const handleEdit = (route) => {
    setFormData(route);
    setShowModal(true);
  };

  //  Xóa tuyến
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tuyến này?")) return;
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      loadRoutes();
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
    }
  };

  //  Lưu tuyến (POST/PUT)
  const handleSave = async () => {
    const { route_id, start_point, end_point, distance_km, travel_time } =
      formData;

    const method = route_id ? "PUT" : "POST";
    const url = route_id ? `${API_BASE}/${route_id}` : API_BASE;

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_point,
          end_point,
          distance_km,
          travel_time,
        }),
      });
      setShowModal(false);
      loadRoutes();
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow">
        <div className="card-body">
          <h4 className="card-title d-flex justify-content-between align-items-center mb-3">
            <span>Danh sách tuyến xe</span>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="🔍 Tìm kiếm theo điểm đi / đến..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: "250px" }}
              />
              <Button variant="primary" size="sm" onClick={handleAdd}>
                + Thêm tuyến
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
                  <th>Điểm đi</th>
                  <th>Điểm đến</th>
                  <th>Khoảng cách (km)</th>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((r, index) => (
                    <tr key={r.route_id}>
                      <td>{index + 1}</td>
                      <td>{r.start_point}</td>
                      <td>{r.end_point}</td>
                      <td>{r.distance_km}</td>
                      <td>{r.travel_time}</td>
                      <td>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(r)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(r.route_id)}
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted">
                      Không có tuyến nào khớp với tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal thêm/sửa */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm / Cập nhật tuyến</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Điểm đi</Form.Label>
              <Form.Control
                type="text"
                value={formData.start_point}
                onChange={(e) =>
                  setFormData({ ...formData, start_point: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Điểm đến</Form.Label>
              <Form.Control
                type="text"
                value={formData.end_point}
                onChange={(e) =>
                  setFormData({ ...formData, end_point: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Khoảng cách (km)</Form.Label>
              <Form.Control
                type="number"
                value={formData.distance_km}
                onChange={(e) =>
                  setFormData({ ...formData, distance_km: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Thời gian dự kiến</Form.Label>
              <Form.Control
                type="text"
                value={formData.travel_time}
                onChange={(e) =>
                  setFormData({ ...formData, travel_time: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>


    </div>
  );
};

export default Routes;
