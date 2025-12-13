import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Form } from "react-bootstrap";
import BASE_API from "../../config/api";

const API_BASE = BASE_API;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState("user");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  //  Lấy danh sách người dùng
  const getUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("❌ Lỗi tải người dùng:", err);
    }
  };

  //  Tìm kiếm theo tên hoặc email
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  //  Xóa người dùng
  const deleteUser = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("🗑️ Đã xóa thành công!");
      getUsers();
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
    }
  };

  // Cập nhật vai trò
  const updateRole = async () => {
    try {
      await fetch(`${API_BASE}/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      alert("✅ Cập nhật thành công!");
      setShowModal(false);
      getUsers();
    } catch (err) {
      console.error("❌ Lỗi cập nhật vai trò:", err);
    }
  };

  //  Khi mở modal sửa
  const handleEdit = (user) => {
    setSelectedUser(user);
    setRole(user.role);
    setShowModal(true);
  };

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="card-title m-0">
              👤 Danh sách người dùng
            </h4>
            <Form.Control
              type="text"
              placeholder="🔍 Tìm theo tên hoặc email..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ width: "280px" }}
            />
          </div>

          {/* Bảng có thanh cuộn */}
          <div
            className="table-responsive"
            style={{
              maxHeight: "550px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
 <Table striped bordered hover className="align-middle text-center"> 
  <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Xác minh</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-muted text-center">
                      Không có người dùng phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.user_id}>
                      <td>{u.user_id}</td>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === "admin"
                              ? "bg-danger"
                              : "bg-secondary"
                          } px-3 py-2`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>{u.is_verified ? "✅" : "❌"}</td>
                      <td>{new Date(u.created_at).toLocaleString("vi-VN")}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleEdit(u)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteUser(u.user_id)}
                          >
                            Xóa
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

      {/* Modal chỉnh vai trò */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header
          closeButton
          style={{ backgroundColor: "#BD1E2D", color: "white" }}
        >
          <Modal.Title>Cập nhật vai trò</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mb-3"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={updateRole}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>


    </div>
  );
};

export default Users;
