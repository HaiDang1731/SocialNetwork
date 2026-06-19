import React, { useState, useEffect } from "react";
import UserManagement from "./UserManagement";
import PostManagement from "./PostManagement";
import "../css/admin.css";

const API_BASE = "http://localhost:8080";

export default function AdminDashboard() {
      const [activeTab, setActiveTab] = useState("users");
      const [currentUser, setCurrentUser] = useState(null);

      useEffect(() => {
            // Kiểm tra user hiện tại có phải admin không
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = localStorage.getItem("userId");

            if (!user || !userId) {
                  window.location.href = "/";
                  return;
            }

            // Lấy thông tin user để kiểm tra role
            fetch(`${API_BASE}/api/users/${userId}`)
                  .then(res => res.json())
                  .then(data => {
                        if (data.role !== "ADMIN") {
                              alert("Bạn không có quyền truy cập trang admin!");
                              window.location.href = "/Home";
                              return;
                        }
                        setCurrentUser(data);
                  })
                  .catch(err => {
                        console.error("Error checking admin role:", err);
                        alert("Lỗi kiểm tra quyền admin!");
                        window.location.href = "/Home";
                  });
      }, []);

      const handleLogout = () => {
            localStorage.removeItem("jwt");
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            window.location.href = "/";
      };

      if (!currentUser) {
            return <div className="admin-loading">Đang kiểm tra quyền admin...</div>;
      }

      return (
            <div className="admin-container">
                  {/* Sidebar */}
                  <aside className="admin-sidebar">
                        <h2 className="admin-logo">👑 Admin Panel</h2>
                        <nav className="admin-menu">
                              <button
                                    className={`admin-menu-item ${activeTab === "users" ? "active" : ""}`}
                                    onClick={() => setActiveTab("users")}
                              >
                                    👥 Quản lý Users
                              </button>
                              <button
                                    className={`admin-menu-item ${activeTab === "posts" ? "active" : ""}`}
                                    onClick={() => setActiveTab("posts")}
                              >
                                    📝 Quản lý Posts
                              </button>
                              <button
                                    className="admin-menu-item"
                                    onClick={() => window.location.href = "/Home"}
                              >
                                    🏠 Về trang chủ
                              </button>
                              <button
                                    className="admin-menu-item admin-logout"
                                    onClick={handleLogout}
                              >
                                    🚪 Đăng xuất
                              </button>
                        </nav>
                  </aside>
                  

                  {/* Main Content */}
                  <main className="admin-main">
                        <div className="admin-header">
                              <h1>
                                    {activeTab === "users" ? "Quản lý Users" : "Quản lý Posts"}
                              </h1>
                              <div className="admin-user-info">
                                    <span>Xin chào, {currentUser.username}</span>
                                    <img
                                          src={currentUser.avatarUrl ? `${API_BASE}${currentUser.avatarUrl}` : "/img/a1.jpeg"}
                                          alt="Admin Avatar"
                                          className="admin-avatar"
                                    />
                              </div>
                        </div>

                        <div className="admin-content">
                              {activeTab === "users" && <UserManagement />}
                              {activeTab === "posts" && <PostManagement />}
                        </div>
                  </main>
            </div>
      );
} 