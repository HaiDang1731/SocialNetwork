import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

export default function UserManagement() {
      const [users, setUsers] = useState([]);
      const [loading, setLoading] = useState(true);
      const [filterRole, setFilterRole] = useState("");

      useEffect(() => {
            fetchUsers();
      }, [filterRole]);

      const fetchUsers = async () => {
            try {
                  const url = filterRole
                        ? `${API_BASE}/api/admin/users?role=${filterRole}`
                        : `${API_BASE}/api/admin/users`;

                  const response = await fetch(url);
                  if (response.ok) {
                        const data = await response.json();
                        setUsers(data);
                  } else {
                        console.error("Failed to fetch users");
                  }
            } catch (error) {
                  console.error("Error fetching users:", error);
            } finally {
                  setLoading(false);
            }
      };

      const handleRoleChange = async (userId, newRole) => {
            try {
                  const response = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
                        method: "PUT",
                        headers: {
                              "Content-Type": "application/json"
                        },
                        body: `"${newRole}"`
                  });

                  if (response.ok) {
                        const updatedUser = await response.json();
                        setUsers(users.map(user =>
                              user.id === userId ? updatedUser : user
                        ));
                        alert("Cập nhật role thành công!");
                  } else {
                        alert("Lỗi cập nhật role!");
                  }
            } catch (error) {
                  console.error("Error updating role:", error);
                  alert("Lỗi cập nhật role!");
            }
      };

      const handleDeleteUser = async (userId) => {
            if (!window.confirm("Bạn có chắc chắn muốn xóa user này?")) {
                  return;
            }

            try {
                  const response = await fetch(`${API_BASE}/api/users/${userId}`, {
                        method: "DELETE"
                  });

                  if (response.ok) {
                        setUsers(users.filter(user => user.id !== userId));
                        alert("Xóa user thành công!");
                  } else {
                        alert("Lỗi xóa user!");
                  }
            } catch (error) {
                  console.error("Error deleting user:", error);
                  alert("Lỗi xóa user!");
            }
      };

      if (loading) {
            return <div className="admin-loading">Đang tải danh sách users...</div>;
      }

      return (
            <div className="user-management">
                  <div className="user-management-header">
                        <div className="user-filters">
                              <label>Lọc theo role:</label>
                              <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="filter-select"
                              >
                                    <option value="">Tất cả</option>
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                              </select>
                        </div>
                        <div className="user-stats">
                              <span>Tổng số users: {users.length}</span>
                        </div>
                  </div>

                  <div className="users-table">
                        <table>
                              <thead>
                                    <tr>
                                          <th>ID</th>
                                          <th>Avatar</th>
                                          <th>Username</th>
                                          <th>Email</th>
                                          <th>Role</th>
                                          <th>Verified</th>
                                          <th>Ngày tạo</th>
                                          <th>Thao tác</th>
                                    </tr>
                              </thead>
                              <tbody>
                                    {users.map(user => (
                                          <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td>
                                                      <img
                                                            src={user.avatarUrl ? `${API_BASE}${user.avatarUrl}` : "/img/a1.jpeg"}
                                                            alt={user.username}
                                                            className="user-avatar-small"
                                                      />
                                                </td>
                                                <td>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                      <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                            className="role-select"
                                                      >
                                                            <option value="USER">USER</option>
                                                            <option value="ADMIN">ADMIN</option>
                                                      </select>
                                                </td>
                                                <td>
                                                      <span className={`status ${user.verified ? 'verified' : 'unverified'}`}>
                                                            {user.verified ? '✅' : '❌'}
                                                      </span>
                                                </td>
                                                <td>
                                                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td>
                                                      <button
                                                            className="btn-delete"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                      >
                                                            🗑️ Xóa
                                                      </button>
                                                </td>
                                          </tr>
                                    ))}
                              </tbody>
                        </table>
                  </div>

                  {users.length === 0 && (
                        <div className="no-data">
                              Không có users nào
                        </div>
                  )}
            </div>
      );
} 