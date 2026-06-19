
import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../css/profile.css";
import ShowFormPostUp from "./ShowFormPostUp";
import { FaEnvelope, FaUserEdit } from "react-icons/fa";
import { FaCamera } from "react-icons/fa";


const API_BASE = "http://localhost:8080";

// Lấy user info từ localStorage
const getUserFromLocalStorage = () => {
      try {
            return JSON.parse(localStorage.getItem("user")) || {};
      } catch {
            return {};
      }
};


export default function Profile() {
      const { id: profileId } = useParams();
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [showCreatePost, setShowCreatePost] = useState(false);
      const myId = localStorage.getItem("userId");
      const [friendStatus, setFriendStatus] = useState("none"); // "none", "pending", "accepted", "declined"
      const [isFollowing, setIsFollowing] = useState(false); // Trạng thái theo dõi
      const [posts, setPosts] = useState([]);   // Bài viết của người dùng
      const [activeTab, setActiveTab] = useState("posts"); // Tab hiện tại
      const [openMenuId, setOpenMenuId] = useState(null); // ID của menu đang mở
      const menuRef = useRef(); // Tham chiếu đến menu
      const [friendRelations, setFriendRelations] = useState({}); // Trạng thái bạn bè và theo dõi
      const [toast, setToast] = useState(""); // Thông báo tạm thời
      const location = useLocation();      // Hàm lây URL hệ thống
      const [editingField, setEditingField] = useState(null); // Trường đang chỉnh sửa
      const [editingValue, setEditingValue] = useState(""); // Giá trị đang chỉnh sửa
      const fileInputRef = useRef(); // Hàm bắt đầu chọn file


      const handleAvatarClick = () => {
            if (myId === profileId && fileInputRef.current) {
                  fileInputRef.current.click();
            }
      };

      const handleAvatarChange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append("avatar", file);

            fetch(`${API_BASE}/api/users/${myId}/avatar`, {
                  method: "POST",
                  body: formData,
            })
                  .then(res => {
                        if (!res.ok) throw new Error("Lỗi upload ảnh");
                        // Không cần lấy avatarUrl từ backend nữa
                        setToast("Đổi ảnh đại diện thành công!");
                        // Cập nhật lại avatar bằng cách đổi src (thêm query để tránh cache)
                        setUser(prev => ({
                              ...prev,
                              avatarUrl: `/uploads/avatars/${myId}.jpg`
                        }));
                        setTimeout(() => setToast(""), 2000);
                  })
                  .catch(() => {
                        setToast("Lỗi upload ảnh đại diện!");
                        setTimeout(() => setToast(""), 2000);
                  });
      };
      // Hàm bắt đầu chỉnh sửa
      const handleStartEdit = (field) => {
            setEditingField(field);
            setEditingValue(user[field] || "");
      };


      // Hàm lưu chỉnh sửa
      const handleSaveEdit = (field) => {
            // Đảm bảo luôn gửi cả password cũ
            const updatedUser = { ...user, [field]: editingValue, password: user.password };
            fetch(`${API_BASE}/api/users/${myId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updatedUser)
            })
                  .then(async res => {
                        if (!res.ok) {
                              const err = await res.text();
                              throw new Error(err || "Lỗi lưu thông tin!");
                        }
                        return res.json();
                  })
                  .then(data => {
                        setUser(data);
                        setEditingField(null);
                        setToast("Cập nhật thành công!");
                        setTimeout(() => setToast(""), 2000);
                  })
                  .catch(err => {
                        setToast("Lỗi lưu thông tin: " + err.message);
                        setTimeout(() => setToast(""), 3000);
                  });
      };

      // Hàm hủy chỉnh sửa
      const handleCancelEdit = () => {
            setEditingField(null);
            setEditingValue("");
      };
      useEffect(() => {
            const handleClickOutside = (event) => {
                  if (menuRef.current && !menuRef.current.contains(event.target)) {
                        setOpenMenuId(null);
                  }
            };
            if (openMenuId !== null) {
                  document.addEventListener("mousedown", handleClickOutside);
            }
            return () => {
                  document.removeEventListener("mousedown", handleClickOutside);
            };
      }, [openMenuId]);

      // Đăng xuất
      const handleLogout = () => {
            localStorage.removeItem("jwt");
            window.location.href = "/";
      };

      const fetchPosts = React.useCallback(() => {
            fetch(`${API_BASE}/api/posts/user/${profileId}`)
                  .then(res => res.ok ? res.json() : [])
                  .then(data => setPosts(Array.isArray(data) ? data : []));
      }, [profileId]);

      useEffect(() => {
            if (!profileId) return;
            setLoading(true);
            setError(null);
            fetch(`${API_BASE}/api/users/${profileId}`)
                  .then((res) => {
                        if (!res.ok) throw new Error("Không tìm thấy người dùng");
                        return res.json();
                  })
                  .then((data) => {
                        setUser(data);
                        setLoading(false);
                  })
                  .catch((err) => {
                        if (profileId === String(getUserFromLocalStorage().id)) {
                              setUser(getUserFromLocalStorage());
                              setLoading(false);
                        } else {
                              setError(err.message);
                              setLoading(false);
                        }
                  });
            // Kiểm tra trạng thái kết bạn
            if (myId && profileId && myId !== profileId) {
                  fetch(`${API_BASE}/api/friends/status?userId1=${myId}&userId2=${profileId}`)
                        .then(res => res.text())
                        .then(setFriendStatus);
                  // Kiểm tra follow
                  fetch(`${API_BASE}/api/follows?followerId=${myId}&followingId=${profileId}`)
                        .then(res => setIsFollowing(res.ok));
            }
            fetchPosts();
      }, [profileId, myId, fetchPosts]);

      useEffect(() => {
            if (user && user.friends && myId) {
                  user.friends.forEach(friend => {
                        // Kiểm tra trạng thái bạn bè
                        fetch(`${API_BASE}/api/friends/status?userId1=${myId}&userId2=${friend.id}`)
                              .then(res => res.text())
                              .then(status => {
                                    setFriendRelations(prev => ({
                                          ...prev,
                                          [friend.id]: {
                                                ...prev[friend.id],
                                                friendStatus: status
                                          }
                                    }));
                              });
                        // Kiểm tra trạng thái theo dõi
                        fetch(`${API_BASE}/api/follows?followerId=${myId}&followingId=${friend.id}`)
                              .then(res => {
                                    setFriendRelations(prev => ({
                                          ...prev,
                                          [friend.id]: {
                                                ...prev[friend.id],
                                                isFollowing: res.ok
                                          }
                                    }));
                              });
                  });
            }
      }, [user, myId]);

      useEffect(() => {
            const params = new URLSearchParams(location.search);
            const tab = params.get("tab");
            if (tab) setActiveTab(tab);
      }, [location.search]);

      // Xử lý loading và lỗi
      if (loading) return <div style={{ padding: 40 }}>Đang tải thông tin người dùng...</div>;
      if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;
      if (!user) return <div style={{ padding: 40 }}>Không có dữ liệu người dùng.</div>;



      // Các hàm xử lý kết bạn/theo dõi
      const handleSendFriendRequest = (friendId) => {
            fetch(`${API_BASE}/api/friends/request?fromId=${myId}&toId=${friendId}`, { method: "POST" })
                  .then(() => {
                        setFriendRelations(prev => ({
                              ...prev,
                              [friendId]: {
                                    ...prev[friendId],
                                    friendStatus: "pending"
                              }
                        }));
                        if (String(friendId) === String(profileId)) setFriendStatus("pending");
                        setToast("Đã gửi lời mời kết bạn");
                        setTimeout(() => setToast(""), 2000);
                  });
      };
      const handleCancelFriendRequest = (friendId) => {
            fetch(`${API_BASE}/api/friends/request?fromId=${myId}&toId=${friendId}`, { method: "DELETE" })
                  .then(() => {
                        setFriendRelations(prev => ({
                              ...prev,
                              [friendId]: {
                                    ...prev[friendId],
                                    friendStatus: "none"
                              }
                        }));
                        if (String(friendId) === String(profileId)) setFriendStatus("none");
                        setToast("Đã hủy lời mời kết bạn");
                        setTimeout(() => setToast(""), 2000);
                  });
      };
      const handleUnfriend = (friendId) => {
            fetch(`${API_BASE}/api/friends/request?fromId=${myId}&toId=${friendId}`, { method: "DELETE" })
                  .then(() => window.location.reload());
      };
      const handleFollow = (friendId) => {
            fetch(`${API_BASE}/api/follows?followerId=${myId}&followingId=${friendId}`, { method: "POST" })
                  .then(() => setFriendRelations(prev => ({
                        ...prev,
                        [friendId]: {
                              ...prev[friendId],
                              isFollowing: true
                        }
                  })));
      };
      const handleUnfollow = (friendId) => {
            fetch(`${API_BASE}/api/follows?followerId=${myId}&followingId=${friendId}`, { method: "DELETE" })
                  .then(() => window.location.reload());
      };

      const handleAcceptFriendRequest = (fromId) => {
            fetch(`${API_BASE}/api/friends/accept?fromId=${fromId}&toId=${myId}`, { method: "POST" })
                  .then(res => res.text())
                  .then(() => window.location.reload());
      };

      const handleDeclineFriendRequest = (fromId) => {
            fetch(`${API_BASE}/api/friends/decline?fromId=${fromId}&toId=${myId}`, { method: "POST" })
                  .then(res => res.text())
                  .then(() => window.location.reload());
      };

      const handleOpenMenu = (id) => {
            setOpenMenuId(openMenuId === id ? null : id);
      };


      return (
            <div className="profile-container">
                  {/* Sidebar trái */}
                  <aside className="home__sidebar">
                        <h2 className="home__logo">😏 Fakebook</h2>
                        <ul className="home__menu">
                              <li onClick={() => window.location.href = "/Home"} style={{ cursor: "pointer" }}>🏠 Trang chủ</li>
                              <li>🔍 Tìm kiếm</li>
                              <li onClick={() => {
                                    const id = localStorage.getItem("userId");
                                    window.location.href = id ? `/messages/${id}` : "/messages";
                              }} style={{ cursor: "pointer" }}>💬 Tin nhắn</li>
                              <li onClick={() => setShowCreatePost(true)} style={{ cursor: "pointer" }}>➕ Tạo</li>
                              <li>🔔 Thông báo</li>
                              <li onClick={() => {
                                    const id = localStorage.getItem("userId");
                                    window.location.href = id ? `/profile/${id}` : "/profile";
                              }} style={{ cursor: "pointer" }}>👤 Trang cá nhân</li>
                              <li onClick={handleLogout} className="home__logout">🚪 Đăng xuất</li>
                        </ul>
                  </aside>

                  {/* Phần chính */}
                  <main className="profile-main">
                        <div className="profile-header">
                              <img
                                    className="profile-avatar"
                                    src={user.avatarUrl ? `http://localhost:8080${user.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                    alt="avatar"
                                    onError={e => { e.target.onerror = null; e.target.src = "/img/a1.jpeg"; }}
                              />
                              <div className="profile-info">
                                    <div className="profile-row">
                                          <span className="profile-username">{user.username}</span>

                                          {myId === profileId ? (
                                                <>
                                                      <button className=" profile-btn friend-btn" >
                                                            {user.friends?.length || 0} Bạn bè
                                                      </button>
                                                      <button className="profile-btn"
                                                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                                            onClick={() => window.location.href = `/profile/${profileId}?tab=about`}>
                                                            <FaUserEdit /> Chỉnh sửa trang cá nhân
                                                      </button>
                                                </>
                                          ) : (
                                                <>
                                                      {/* Nút Nhắn tin chỉ khi là bạn bè */}
                                                      {friendStatus === "accepted" && (
                                                            <button className="profile-btn" onClick={() => window.location.href = `/messages/${profileId}`}>
                                                                  <FaEnvelope /> Nhắn tin
                                                            </button>
                                                      )}

                                                      {/* Nút Theo dõi / Bỏ theo dõi */}
                                                      {isFollowing ? (
                                                            <button className="profile-btn" onClick={handleUnfollow}>Bỏ theo dõi</button>
                                                      ) : (
                                                            <button className="profile-btn" onClick={handleFollow}>Theo dõi</button>
                                                      )}

                                                      {/* Nút Thêm bạn bè / Hủy / Đã gửi */}
                                                      <button className="profile-btn"
                                                            onClick={
                                                                  friendStatus === 'accepted'
                                                                        ? () => handleUnfriend(profileId)
                                                                        : friendStatus === 'pending'
                                                                              ? () => handleCancelFriendRequest(profileId)
                                                                              : () => handleSendFriendRequest(profileId)
                                                            }
                                                            style={{
                                                                  opacity: friendStatus === 'pending' ? 0.7 : 1,
                                                                  cursor: friendStatus === 'pending' ? 'pointer' : 'pointer'
                                                            }}>
                                                            {friendStatus === 'accepted' ? 'Huỷ kết bạn' :
                                                                  friendStatus === 'pending' ? 'Hủy lời mời kết bạn' :
                                                                        friendStatus === 'cancel' ? 'Thêm bạn bè' : 'Thêm bạn bè'}
                                                      </button>
                                                </>
                                          )}
                                    </div>
                                    <div className="profile-stats">
                                          <span><b>{user.posts?.length || 0}</b> bài viết</span>
                                          <span><b>{user.followers?.length || 0}</b> người theo dõi</span>
                                          <span>Đang theo dõi <b>{user.following?.length || 0}</b> người dùng</span>
                                    </div>
                                    <div className="profile-name">@{user.name || user.username}</div>
                                    {/* <div className="profile-bio">
                                          {(user.bio || '').split("\n").map((line, i) => <div key={i}>{line}</div>)}
                                          {user.website && <a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a>}
                                    </div> */}
                              </div>
                        </div>
                        <hr />

                        {/* Tabs: Bài viết, Reels, Được gắn thẻ */}
                        <div className="profile-tabs">
                              <span
                                    className={activeTab === "posts" ? "active" : ""}
                                    onClick={() => setActiveTab("posts")}
                              >
                                    Bài viết
                              </span>
                              <span
                                    className={activeTab === "about" ? "active" : ""}
                                    onClick={() => setActiveTab("about")}
                              >
                                    Giới thiệu
                              </span>
                              <span
                                    className={activeTab === "friends" ? "active" : ""}
                                    onClick={() => setActiveTab("friends")}
                              >
                                    Bạn bè
                              </span>
                              <span
                                    className={activeTab === "photos" ? "active" : ""}
                                    onClick={() => setActiveTab("photos")}
                              >
                                    Ảnh
                              </span>
                              <span
                                    className={activeTab === "videos" ? "active" : ""}
                                    onClick={() => setActiveTab("videos")}
                              >
                                    Video
                              </span>
                        </div>
                        {/* Lưới bài viết */}
                        {activeTab === "posts" && (
                              <div className="profile-posts-grid">
                                    {Array.isArray(posts) && posts.filter(post => post.user.id === Number(profileId)).length > 0 ? (
                                          posts.filter(post => post.user.id === Number(profileId)).map((post) => (
                                                <div className="profile-post-item" key={post.id}>
                                                      {post.imageUrls && post.imageUrls.length > 0 && (
                                                            <img
                                                                  src={post.imageUrls[0]}
                                                                  alt={`post-${post.id}`}
                                                                  onClick={() => window.location.href = `/post/${post.id}`}
                                                                  style={{ cursor: 'pointer' }}
                                                            />
                                                      )}
                                                      {post.videoUrls && post.videoUrls.length > 0 && (
                                                            <video
                                                                  src={post.videoUrls[0]}
                                                                  onClick={() => window.location.href = `/post/${post.id}`}
                                                                  style={{ cursor: 'pointer' }}
                                                                  controls
                                                            />
                                                      )}
                                                      {post.content && (!post.imageUrls || post.imageUrls.length === 0) && (!post.videoUrls || post.videoUrls.length === 0) && (
                                                            <div
                                                                  className="post-content"
                                                                  onClick={() => window.location.href = `/post/${post.id}`}
                                                                  style={{ cursor: 'pointer' }}
                                                            >
                                                                  {post.content}
                                                            </div>
                                                      )}
                                                </div>
                                          ))
                                    ) : (
                                          <div style={{ textAlign: 'center', padding: '20px' }}>
                                                Không có bài viết nào
                                          </div>
                                    )}
                              </div>
                        )}

                        {activeTab === "about" && (
                              <div className="tab-content">
                                    <div className="profile-about">
                                          <h2>Giới thiệu</h2>
                                          <div className="profile-about-content">
                                                <div className="profile-about-list">
                                                      <table>
                                                            <tbody>
                                                                  <tr>
                                                                        <th></th>
                                                                        <th>
                                                                              <td style={{ textAlign: 'center' }}>
                                                                                    <p>Ảnh đại diện</p>
                                                                                    <div className="profile-avatar-wrapper">
                                                                                          <img
                                                                                                className="profile-avatar"
                                                                                                src={user.avatarUrl ? `http://localhost:8080${user.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                                                                                alt="avatar"
                                                                                                onError={e => { e.target.onerror = null; e.target.src = "/img/a1.jpeg"; }}
                                                                                          />
                                                                                          {myId === profileId && (
                                                                                                <>
                                                                                                      <div className="profile-avatar-overlay"></div>
                                                                                                      <button
                                                                                                            className="profile-avatar-edit-btn"
                                                                                                            type="button"
                                                                                                            onClick={handleAvatarClick}
                                                                                                            title="Đổi ảnh đại diện"
                                                                                                      >
                                                                                                            <FaCamera />
                                                                                                      </button>
                                                                                                      <input
                                                                                                            type="file"
                                                                                                            accept="image/*"
                                                                                                            style={{ display: "none" }}
                                                                                                            ref={fileInputRef}
                                                                                                            onChange={handleAvatarChange}
                                                                                                      />
                                                                                                </>
                                                                                          )}
                                                                                    </div>
                                                                              </td>
                                                                        </th>
                                                                        <th></th>
                                                                  </tr>
                                                                  {[
                                                                        { label: "Tên", field: "username", placeholder: "Không có tên" },
                                                                        { label: "Email", field: "email", placeholder: "Không có email" },
                                                                        { label: "Biệt danh", field: "nickname", placeholder: "Không có biệt danh" },
                                                                        { label: "Ngày sinh", field: "birthday", placeholder: "Không có ngày sinh" },
                                                                        { label: "Giới tính", field: "gender", placeholder: "Không có giới tính" },
                                                                        { label: "Đến từ", field: "from", placeholder: "Không có đến từ" },
                                                                        { label: "Sống tại", field: "livesIn", placeholder: "Không có sống tại" },
                                                                        { label: "Sở thích", field: "interests", placeholder: "Không có sở thích" },
                                                                        { label: "Học vấn", field: "education", placeholder: "Không có học vấn" }
                                                                  ].map(item => (
                                                                        <tr key={item.field}>
                                                                              <td>{item.label}</td>
                                                                              <td>
                                                                                    {editingField === item.field ? (
                                                                                          <input
                                                                                                value={editingValue}
                                                                                                onChange={e => setEditingValue(e.target.value)}
                                                                                                autoFocus
                                                                                          />
                                                                                    ) : (
                                                                                          user[item.field] || item.placeholder
                                                                                    )}
                                                                              </td>
                                                                              <td>
                                                                                    {myId === profileId && (
                                                                                          editingField === item.field ? (
                                                                                                <>
                                                                                                      <button className="profile-btn-edit" onClick={() => handleSaveEdit(item.field)}>💾 Lưu</button>
                                                                                                      <button className="profile-btn-edit" style={{ marginLeft: 6 }} onClick={handleCancelEdit}>✖ Hủy</button>
                                                                                                </>
                                                                                          ) : (
                                                                                                <button className="profile-btn-edit" onClick={() => handleStartEdit(item.field)}>✒ Sửa</button>
                                                                                          )
                                                                                    )}
                                                                              </td>
                                                                        </tr>
                                                                  ))}
                                                            </tbody>
                                                      </table>

                                                </div>
                                          </div>
                                    </div>
                              </div>
                        )}

                        {activeTab === "friends" && (
                              <div className="tab-content">
                                    {/* Chỉ chủ tài khoản mới thấy lời mời kết bạn */}
                                    {myId === profileId && (
                                          <div className="profile-friends-add">
                                                <h4>Lời mời kết bạn</h4>
                                                <div className="profile-friends-add-list">
                                                      {user.friendRequests?.length > 0 ? (
                                                            user.friendRequests.map(request => (
                                                                  <div className="profile-friend-item" key={request.id}>
                                                                        <img src={request.avatarUrl ? `http://localhost:8080${request.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"} alt={request.username} />
                                                                        <span>{request.username}</span>
                                                                        <button
                                                                              className="profile-btn"
                                                                              onClick={() => handleAcceptFriendRequest(request.id)}
                                                                              style={{ marginLeft: 8 }}
                                                                        >
                                                                              ✔ Xác nhận
                                                                        </button>
                                                                        <button
                                                                              className="profile-btn"
                                                                              onClick={() => handleDeclineFriendRequest(request.id)}
                                                                              style={{ marginLeft: 8, background: "#eee", color: "#333" }}
                                                                        >
                                                                              ✖ Từ chối
                                                                        </button>
                                                                  </div>
                                                            ))
                                                      ) : (
                                                            <div className="no-friends">Không có lời mời kết bạn mới</div>
                                                      )}
                                                </div>
                                          </div>
                                    )}
                                    {myId === profileId && <hr />}
                                    <div className="profile-friends">
                                          <h4>Bạn bè</h4>
                                          <div className="profile-friends-list">
                                                {user.friends?.length > 0 ? (
                                                      user.friends.map(friend => (
                                                            <div className="profile-friend-item" key={friend.id}>
                                                                  <img src={friend.avatarUrl ? `http://localhost:8080${friend.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                                                        alt={friend.username}
                                                                        style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                                                                        onClick={() => window.location.href = `/profile/${friend.id}`}
                                                                  />
                                                                  <div>
                                                                        <div style={{ fontWeight: 600 }}>{friend.username}</div>
                                                                  </div>
                                                                  <button className="friend-menu-btn" onClick={() => handleOpenMenu(friend.id)}>
                                                                        &#8230;
                                                                  </button>
                                                                  {openMenuId === friend.id && (
                                                                        <div className="friend-menu-popup" ref={menuRef}>
                                                                              {friendRelations[friend.id]?.friendStatus === "pending" ? (
                                                                                    <button onClick={() => handleCancelFriendRequest(friend.id)}>Hủy lời mời kết bạn</button>
                                                                              ) : friendRelations[friend.id]?.friendStatus === "accepted" ? (
                                                                                    <button onClick={() => handleUnfriend(friend.id)}>Hủy kết bạn</button>
                                                                              ) : (
                                                                                    <button onClick={() => handleSendFriendRequest(friend.id)}>Kết bạn</button>
                                                                              )}
                                                                              {friendRelations[friend.id]?.isFollowing ? (
                                                                                    <button onClick={() => handleUnfollow(friend.id)}>Bỏ theo dõi</button>
                                                                              ) : (
                                                                                    <button onClick={() => handleFollow(friend.id)}>Theo dõi</button>
                                                                              )}
                                                                        </div>
                                                                  )}
                                                            </div>
                                                      ))
                                                ) : (
                                                      <div className="no-friends">Không có người nào trong danh sách bạn bè</div>
                                                )}
                                          </div>
                                    </div>
                              </div>
                        )}

                        {activeTab === "photos" && (
                              <div className="profile-posts-grid">
                                    {Array.isArray(posts) && posts.some(post => post.user.id === Number(profileId) && post.imageUrls?.length > 0) ? (
                                          posts
                                                .filter(post => post.user.id === Number(profileId) && post.imageUrls?.length > 0)
                                                .flatMap(post =>
                                                      post.imageUrls.map((url, idx) => (
                                                            <div className="profile-post-item" key={`photo-${post.id}-${idx}`}>
                                                                  <img
                                                                        src={url}
                                                                        alt={`photo-${post.id}-${idx}`}
                                                                        onClick={() => window.location.href = `/post/${post.id}`}
                                                                        style={{ cursor: 'pointer' }}
                                                                  />
                                                            </div>
                                                      ))
                                                )
                                    ) : (
                                          <div style={{ textAlign: 'center', padding: '20px' }}>Không có ảnh nào</div>
                                    )}
                              </div>
                        )}

                        {activeTab === "videos" && (
                              <div className="profile-posts-grid">
                                    {Array.isArray(posts) && posts.some(post => post.user.id === Number(profileId) && post.videoUrls?.length > 0) ? (
                                          posts
                                                .filter(post => post.user.id === Number(profileId) && post.videoUrls?.length > 0)
                                                .flatMap(post =>
                                                      post.videoUrls.map((url, idx) => (
                                                            <div className="profile-post-item" key={`video-${post.id}-${idx}`}>
                                                                  <video
                                                                        src={url}
                                                                        controls
                                                                        onClick={() => window.location.href = `/post/${post.id}`}
                                                                        style={{ cursor: 'pointer' }}
                                                                  />
                                                            </div>
                                                      ))
                                                )
                                    ) : (
                                          <div style={{ textAlign: 'center', padding: '20px' }}>Không có video nào</div>
                                    )}
                              </div>
                        )}



                        {showCreatePost && (
                              <ShowFormPostUp
                                    onClose={() => setShowCreatePost(false)}
                                    onPostSuccess={() => {
                                          fetchPosts();
                                          setShowCreatePost(false);
                                    }}
                              />
                        )}
                  </main>
                  {/* Toast message */}
                  {toast && (
                        <div className="toast-message" style={{
                              position: "fixed", top: 80, right: 40, background: "#222", color: "#fff",
                              padding: "12px 24px", borderRadius: 8, zIndex: 9999
                        }}>
                              {toast}
                        </div>
                  )}
            </div>
      );
}