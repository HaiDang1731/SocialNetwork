import React, { useState, useEffect } from "react";
import "../css/styles.css"; // import file CSS
import { FaRegThumbsUp, FaRegComment } from "react-icons/fa";
import { PiShareFatThin } from "react-icons/pi";
import ShowFormPostUp from "./ShowFormPostUp";
import ShowFormComment from "./ShowFormComment";
import ChatBubble from "./ChatBubble";
import SearchModal from "./SearchModal";
import NotificationModal from "./NotificationModal";

const API_URL = "http://localhost:8080";
// Lấy user info từ localStorage
const getUserFromLocalStorage = () => {
      try {
            return JSON.parse(localStorage.getItem("user")) || {};
      } catch {
            return {};
      }
};


export default function Home() {
      const [showCreatePost, setShowCreatePost] = useState(false);
      const [posts, setPosts] = useState([]);
      const user = getUserFromLocalStorage();
      const [hoveredPostId, setHoveredPostId] = useState(null);
      const [likeLoading, setLikeLoading] = useState(false);
      const [likes, setLikes] = useState([]); // [{id, user, post, emoji, ...}]
      const [showCommentModal, setShowCommentModal] = useState({ show: false, postId: null });
      const [commentCounts, setCommentCounts] = useState({}); // {postId: count}
      const [selectedImage, setSelectedImage] = useState(null);
      const [showOptionsFor, setShowOptionsFor] = useState(null);
      const [editPost, setEditPost] = useState(null);
      const myId = localStorage.getItem("userId");
      const [friendRequests, setFriendRequests] = useState([]);
      const [friendIds, setFriendIds] = useState([]);
      const [friendSuggestions, setFriendSuggestions] = useState([]);
      const [sendingFriendRequest, setSendingFriendRequest] = useState(null);
      const [showSearchModal, setShowSearchModal] = useState(false);
      const [showNotificationModal, setShowNotificationModal] = useState(false);
      const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
      // State để lưu thông tin user đầy đủ từ server
      const [currentUser, setCurrentUser] = useState(user);

      const emojiList = [
            { symbol: "👍", value: "like" },
            { symbol: "❤️", value: "love" },
            { symbol: "😂", value: "haha" },
            { symbol: "😮", value: "wow" },
            { symbol: "😢", value: "sad" },
            { symbol: "😡", value: "angry" },
      ];

      // Fetch thông tin user đầy đủ từ server
      useEffect(() => {
            const userId = localStorage.getItem("userId");
            if (userId) {
                  fetch(`${API_URL}/api/users/${userId}`)
                        .then(res => res.json())
                        .then(userData => {
                              console.log('Fetched user data:', userData);
                              setCurrentUser(userData);
                              // Cập nhật localStorage với thông tin đầy đủ
                              localStorage.setItem("user", JSON.stringify(userData));
                        })
                        .catch(err => console.error('Error fetching user:', err));
            }
      }, []);

      useEffect(() => {
            fetch("http://localhost:8080/api/posts")
                  .then((res) => res.json())
                  .then((data) => {
                        setPosts(data);
                        // Lấy số lượng bình luận (bao gồm cả reply) cho từng post
                        data.forEach((post) => {
                              fetch(`http://localhost:8080/api/comments/post/${post.id}`)
                                    .then((res) => res.json())
                                    .then((comments) => {
                                          setCommentCounts((prev) => ({ ...prev, [post.id]: comments.length }));
                                    });
                        });
                  })
                  .catch((err) => console.error(err));
            fetch("http://localhost:8080/api/post-likes")
                  .then((res) => res.json())
                  .then((data) => setLikes(data))
                  .catch((err) => console.error(err));
      }, []);

      useEffect(() => {
            if (myId) {
                  fetch(`http://localhost:8080/api/users/${myId}`)
                        .then(res => res.json())
                        .then(data => setFriendRequests(data.friendRequests || []));
            }
      }, [myId]);

      useEffect(() => {
            const myId = localStorage.getItem("userId");
            if (myId) {
                  fetch(`http://localhost:8080/api/users/${myId}/friends`)
                        .then(res => res.json())
                        .then(data => setFriendIds(data.map(u => u.id)));

                  // Lấy gợi ý kết bạn
                  fetch(`http://localhost:8080/api/users/${myId}/friend-suggestions`)
                        .then(res => res.json())
                        .then(data => setFriendSuggestions(data))
                        .catch(err => console.error('Error fetching friend suggestions:', err));

                  // Lấy số thông báo chưa đọc
                  fetchUnreadNotificationCount(myId);
            }
      }, []);

      // Lấy số thông báo chưa đọc
      const fetchUnreadNotificationCount = async (userId) => {
            try {
                  const response = await fetch(`${API_URL}/api/notifications/user/${userId}/unread-count`);
                  if (response.ok) {
                        const data = await response.json();
                        setUnreadNotificationCount(data.count);
                  }
            } catch (error) {
                  console.error('Error fetching unread notification count:', error);
            }
      };

      const handleLogout = () => {
            localStorage.removeItem("jwt");
            window.location.href = "/";
      };

      const getUserLikeForPost = (postId) => {
            const userId = Number(localStorage.getItem("userId"));
            return likes.find(
                  (like) => like.post.id === postId && like.user.id === userId
            );
      };

      const handleLike = async (postId) => {
            setLikeLoading(true);
            const userId = Number(localStorage.getItem("userId"));
            const userLike = getUserLikeForPost(postId);
            if (userLike) {
                  // Đã like, click lại là unlike
                  await fetch("http://localhost:8080/api/post-likes", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, postId }),
                  });
            } else {
                  // Chưa like, like mặc định
                  await fetch("http://localhost:8080/api/post-likes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, postId, emoji: "like" }),
                  });
            }
            fetch("http://localhost:8080/api/post-likes")
                  .then((res) => res.json())
                  .then((data) => setLikes(data));
            setLikeLoading(false);
      };

      const handleEmoji = async (postId, emoji) => {
            setLikeLoading(true);
            const userId = Number(localStorage.getItem("userId"));
            const userLike = getUserLikeForPost(postId);
            if (userLike) {
                  // Đã like, đổi emoji bằng PUT
                  await fetch("http://localhost:8080/api/post-likes", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, postId, emoji }),
                  });
            } else {
                  // Chưa like, like mới
                  await fetch("http://localhost:8080/api/post-likes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, postId, emoji }),
                  });
            }
            fetch("http://localhost:8080/api/post-likes")
                  .then((res) => res.json())
                  .then((data) => setLikes(data));
            setLikeLoading(false);
      };

      const getEmojiSummaryForPost = (postId) => {
            const summary = {};
            emojiList.forEach((e) => (summary[e.value] = 0));
            likes.forEach((like) => {
                  if (like.post.id === postId) {
                        summary[like.emoji] = (summary[like.emoji] || 0) + 1;
                  }
            });
            // Trả về mảng các emoji có số lượng > 0, sắp xếp theo số lượng giảm dần
            return emojiList
                  .map((e) => ({ ...e, count: summary[e.value] }))
                  .filter((e) => e.count > 0)
                  .sort((a, b) => b.count - a.count);
      };

      const getTotalLikesForPost = (postId) =>
            likes.filter((like) => like.post.id === postId).length;

      const handleEditPost = (post) => {
            setEditPost(post);
            setShowOptionsFor(null);
      };
      const handleEditPostClose = () => {
            setEditPost(null);
      };
      const handleEditPostSuccess = () => {
            fetch("http://localhost:8080/api/posts")
                  .then((res) => res.json())
                  .then((data) => setPosts(data));
            setEditPost(null);
      };
      const handleDeletePost = async (postId) => {
            if (window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
                  await fetch(`http://localhost:8080/api/posts/${postId}`, { method: "DELETE" });
                  setPosts(posts.filter(p => p.id !== postId));
            }
            return alert("Đã xóa bài viết!");
      };
      const handleReportPost = (postId) => {
            alert("Đã báo cáo bài viết!");
      };
      const handleSavePost = (postId) => {
            alert("Đã lưu bài viết!");
      };

      // Hàm lấy lại số lượng comment thực tế từ server cho postId
      const refreshCommentCount = (postId) => {
            fetch(`http://localhost:8080/api/comments/post/${postId}`)
                  .then(res => res.json())
                  .then(comments => {
                        setCommentCounts(prev => ({
                              ...prev,
                              [postId]: comments.length
                        }));
                  });
      };

      const handleAcceptFriendRequest = (fromId) => {
            fetch(`http://localhost:8080/api/friends/accept?fromId=${fromId}&toId=${myId}`, { method: "POST" })
                  .then(() => setFriendRequests(prev => prev.filter(u => u.id !== fromId)));
      };

      const handleDeclineFriendRequest = (fromId) => {
            fetch(`http://localhost:8080/api/friends/decline?fromId=${fromId}&toId=${myId}`, { method: "POST" })
                  .then(() => setFriendRequests(prev => prev.filter(u => u.id !== fromId)));
      };

      const handleSendFriendRequest = async (toId) => {
            setSendingFriendRequest(toId);
            try {
                  const response = await fetch(`http://localhost:8080/api/friends/request?fromId=${myId}&toId=${toId}`, {
                        method: "POST"
                  });

                  if (response.ok) {
                        // Xóa user khỏi danh sách gợi ý sau khi gửi lời mời
                        setFriendSuggestions(prev => prev.filter(u => u.id !== toId));
                        alert("Đã gửi lời mời kết bạn!");
                  } else {
                        const errorText = await response.text();
                        alert(errorText || "Có lỗi xảy ra khi gửi lời mời!");
                  }
            } catch (error) {
                  console.error("Error sending friend request:", error);
                  alert("Có lỗi xảy ra khi gửi lời mời!");
            } finally {
                  setSendingFriendRequest(null);
            }
      };

      return (
            <div className="home">
                  {/* Sidebar trái */}
                  <aside className="home__sidebar">
                        <h2 className="home__logo">😏 Fakebook</h2>
                        <ul className="home__menu">
                              <li onClick={() => window.location.href = "/Home"} style={{ cursor: "pointer" }}>🏠 Trang chủ</li>
                              <li onClick={() => setShowSearchModal(true)} style={{ cursor: "pointer" }}>🔍 Tìm kiếm</li>
                              <li onClick={() => {
                                    const id = localStorage.getItem("userId");
                                    window.location.href = id ? `/messages/${id}` : "/messages";
                              }} style={{ cursor: "pointer" }}>💬 Tin nhắn</li>
                              <li onClick={() => setShowCreatePost(true)} style={{ cursor: "pointer" }}>➕ Tạo</li>
                              <li
                                    onClick={() => setShowNotificationModal(true)}
                                    style={{ cursor: "pointer", position: "relative" }}
                              >
                                    🔔 Thông báo
                                    {unreadNotificationCount > 0 && (
                                          <span style={{
                                                position: "absolute",
                                                top: "-2px",
                                                right: "10px",
                                                backgroundColor: "#ff3040",
                                                color: "white",
                                                borderRadius: "50%",
                                                minWidth: "18px",
                                                height: "18px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "11px",
                                                fontWeight: "bold"
                                          }}>
                                                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                                          </span>
                                    )}
                              </li>
                              <li onClick={() => {
                                    const id = localStorage.getItem("userId");
                                    window.location.href = id ? `/profile/${id}` : "/profile";
                              }} style={{ cursor: "pointer" }}>👤 Trang cá nhân</li>
                              {currentUser.role === "ADMIN" && (
                                    <li onClick={() => window.location.href = "/admin"} style={{ cursor: "pointer", color: "#e74c3c" }}>
                                          👑 Quản trị
                                    </li>
                              )}
                              <li onClick={handleLogout} className="home__logout">🚪 Đăng xuất</li>
                        </ul>
                  </aside>

                  {/* Nội dung chính */}
                  <main className="home__main">
                        <div className="home__create-post">
                              <img src={currentUser.avatarUrl ? `http://localhost:8080${currentUser.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"} alt="avatar" className="home__avatar home__avatar--large" />
                              <input
                                    className="home__input-post"
                                    type="text"
                                    placeholder={` ${currentUser.username}, hãy nhập nội dung bài viết của bạn...`}
                                    onFocus={() => setShowCreatePost(true)}
                                    readOnly
                              />

                              {showCreatePost && !editPost && (
                                    <ShowFormPostUp
                                          onClose={() => setShowCreatePost(false)}
                                          onPostSuccess={() => {
                                                fetch("http://localhost:8080/api/posts")
                                                      .then((res) => res.json())
                                                      .then((data) => setPosts(data));
                                          }}
                                    />
                              )}
                              {editPost && (
                                    <ShowFormPostUp
                                          editData={editPost}
                                          onClose={handleEditPostClose}
                                          onPostSuccess={handleEditPostSuccess}
                                    />
                              )}
                        </div>

                        {posts.map((post) => {
                              // Kiểm tra quyền xem bài viết
                              const isOwner = post.user?.id === currentUser.id;
                              const isFriend = friendIds.includes(post.user?.id);

                              if (post.privacy === "private" && !isOwner) return null;
                              if (post.privacy === "friends" && !isOwner && !isFriend) return null;

                              const userLike = getUserLikeForPost(post.id);
                              const userEmoji = userLike ? emojiList.find((e) => e.value === userLike.emoji) : null;
                              return (
                                    <article className="home__post" key={post.id} id={`post-${post.id}`}>
                                          <header className="home__post-header">
                                                <div className="home__post-author-info">
                                                      <img
                                                            src={post.user?.avatarUrl ? `http://localhost:8080${post.user?.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                                            alt="avatar"
                                                            className="home__avatar"
                                                            onClick={() => window.location.href = `/profile/${post.user?.id}`}
                                                            style={{ cursor: "pointer" }}
                                                      />
                                                      <div>
                                                            <span
                                                                  className="home__post-author"
                                                                  onClick={() => window.location.href = `/profile/${post.user?.id}`}
                                                                  style={{ cursor: "pointer" }}
                                                            >
                                                                  {post.user?.username}{" "}
                                                                  {post.user?.id !== currentUser.id && (
                                                                        <span
                                                                              className="home__post-follow"
                                                                              style={{ cursor: "pointer" }}
                                                                        >
                                                                              · Theo dõi
                                                                        </span>
                                                                  )}
                                                            </span>
                                                            <div className="home__post-meta">
                                                                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                                                                  <span className="home__post-dot">·</span>
                                                                  <span className="home__post-privacy">
                                                                        {post.privacy === "public" && "🌍"}
                                                                        {post.privacy === "friends" && "👥"}
                                                                        {post.privacy === "private" && "🔒"}
                                                                  </span>
                                                            </div>
                                                      </div>
                                                </div>
                                                <div className="home__post-options" style={{ position: "relative", display: "inline-block" }}>
                                                      <span style={{ cursor: "pointer" }} onClick={() => setShowOptionsFor(post.id)}>...</span>
                                                      {showOptionsFor === post.id && (
                                                            <div className="post-options-dropdown" style={{
                                                                  position: "absolute",
                                                                  right: 0,
                                                                  top: 24,
                                                                  background: "#fff",
                                                                  border: "1px solid #ddd",
                                                                  borderRadius: 6,
                                                                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                                                  zIndex: 10,
                                                                  minWidth: 120
                                                            }}
                                                                  onMouseLeave={() => setShowOptionsFor(null)}
                                                            >
                                                                  {post.user?.id === currentUser.id ? (
                                                                        <>
                                                                              <button style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer" }} onClick={() => handleEditPost(post)}>Chỉnh sửa</button>
                                                                              <button style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer", color: "red" }} onClick={() => handleDeletePost(post.id)}>Xóa</button>
                                                                        </>
                                                                  ) : (
                                                                        <>
                                                                              <button style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer" }} onClick={() => handleReportPost(post.id)}>Báo cáo</button>
                                                                              <button style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer" }} onClick={() => handleSavePost(post.id)}>Lưu bài viết</button>
                                                                        </>
                                                                  )}
                                                            </div>
                                                      )}
                                                </div>
                                          </header>

                                          <div className="home__post-content">
                                                <p>{post.content}</p>
                                                {(post.imageUrls?.length > 0 || post.videoUrls?.length > 0) && (
                                                      <div className={`media-grid images-${post.imageUrls?.length || 0}`}>
                                                            {post.imageUrls &&
                                                                  post.imageUrls.map((url, idx) => (
                                                                        <img
                                                                              key={`img-${idx}`}
                                                                              src={url}
                                                                              alt={`post-img-${idx}`}
                                                                              className="home__post-media"
                                                                              onClick={() => setSelectedImage(url)}
                                                                        />
                                                                  ))}
                                                            {post.videoUrls &&
                                                                  post.videoUrls.map((url, idx) => (
                                                                        <video
                                                                              key={`vid-${idx}`}
                                                                              src={url}
                                                                              controls
                                                                              className="home__post-media"
                                                                        />
                                                                  ))}
                                                      </div>
                                                )}
                                                {/* Overlay hiển thị ảnh lớn */}
                                                {selectedImage && (
                                                      <div
                                                            className="image-viewer-overlay"
                                                            onClick={() => setSelectedImage(null)}
                                                      >
                                                            <img src={selectedImage} alt="Xem ảnh" className="image-viewer-full" />
                                                      </div>
                                                )}
                                                {/* end Overlay popup ảnh */}
                                          </div>


                                          <div className="home__post-actions-bar">
                                                {/* Hiện các emoji đã được like và số lượng */}
                                                <span>
                                                      {getEmojiSummaryForPost(post.id)
                                                            .sort((a, b) => b.count - a.count)
                                                            .slice(0, 3)
                                                            .map((e) => (
                                                                  <span
                                                                        key={e.value}
                                                                        style={{ marginRight: 2, fontSize: 18 }}
                                                                  >
                                                                        {e.symbol}
                                                                  </span>
                                                            ))}
                                                      {/* Hiện tổng số like, ví dụ: "Bạn và 4,5K người khác" */}
                                                      <span style={{ marginLeft: 6, color: "#555" }}>
                                                            {getTotalLikesForPost(post.id) === 0
                                                                  ? "0 lượt thích"
                                                                  : getTotalLikesForPost(post.id) === 1
                                                                        ? "1 người đã cảm xúc"
                                                                        : `${getTotalLikesForPost(post.id).toLocaleString()} người đã cảm xúc`}
                                                      </span>

                                                </span>
                                                {/* Số lượng bình luận */}
                                                <span>{commentCounts[post.id] !== undefined ? `${commentCounts[post.id]} bình luận` : "0 bình luận"}</span>
                                                {/* Số lượng chia sẻ */}
                                                <span>0 lượt chia sẻ</span>
                                          </div>
                                          <div className="home__post-buttons">
                                                <div className="like-btn-wrapper"
                                                      onMouseEnter={() => setHoveredPostId(post.id)}
                                                      onMouseLeave={() => setTimeout(() => setHoveredPostId(null), 200)}
                                                >
                                                      {/* nút like */}
                                                      <button
                                                            disabled={likeLoading}
                                                            onClick={() => handleLike(post.id)}
                                                            style={{ display: "flex", color: userLike ? "#1877f2" : "#222", alignItems: "center" }}
                                                      >
                                                            {userLike && userEmoji ? (
                                                                  <span style={{ fontSize: 20, marginRight: 4 }}>
                                                                        {userEmoji.symbol}
                                                                  </span>
                                                            ) : (
                                                                  <FaRegThumbsUp style={{ marginRight: 4 }} />
                                                            )}
                                                            {userLike && userEmoji
                                                                  ? userEmoji.value.charAt(0).toUpperCase() +
                                                                  userEmoji.value.slice(1)
                                                                  : "Thích"}
                                                      </button>
                                                      {hoveredPostId === post.id && (
                                                            <div
                                                                  className="emoji-popup"
                                                                  onMouseEnter={() => setHoveredPostId(post.id)}
                                                                  onMouseLeave={() =>
                                                                        setTimeout(() => setHoveredPostId(null), 500)
                                                                  }
                                                            >
                                                                  {emojiList.map((e) => (
                                                                        <span
                                                                              key={e.value}
                                                                              onClick={() => handleEmoji(post.id, e.value)}
                                                                              style={{
                                                                                    fontWeight:
                                                                                          userLike && userLike.emoji === e.value
                                                                                                ? "bold"
                                                                                                : "normal",
                                                                                    fontSize:
                                                                                          userLike && userLike.emoji === e.value ? 28 : 22,
                                                                              }}
                                                                        >
                                                                              {e.symbol}
                                                                        </span>
                                                                  ))}
                                                            </div>
                                                      )}
                                                </div>
                                                {/* nút bình luận */}
                                                <button
                                                      onClick={() =>
                                                            setShowCommentModal({ show: true, postId: post.id })
                                                      }
                                                >
                                                      <FaRegComment /> Bình luận
                                                </button>
                                                {showCommentModal.show && (
                                                      <ShowFormComment
                                                            postId={showCommentModal.postId}
                                                            post={posts.find((p) => p.id === showCommentModal.postId)}
                                                            onClose={() =>
                                                                  setShowCommentModal({ show: false, postId: null })
                                                            }
                                                            onCommentSuccess={() => refreshCommentCount(showCommentModal.postId)}
                                                      />
                                                )}
                                                {/* nút chia sẻ */}
                                                <button>
                                                      <PiShareFatThin /> Chia sẻ
                                                </button>
                                          </div>
                                    </article>
                              );
                        })}
                  </main>

                  {/* phần bên phải */}
                  <aside className="home__rightbar">
                        <div className="home__profile">
                              <img
                                    src={currentUser.avatarUrl ? `http://localhost:8080${currentUser.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                    alt="avatar"
                                    className="home__avatar home__avatar--large"
                              />
                              <h3>{currentUser.username}</h3>
                              <small>@{currentUser.username || "user"}</small>
                        </div>
                        <hr />

                        <div className="home__suggestions">
                              <div className="home__suggestions-header">
                                    <h5>Lời mời kết bạn</h5>
                                    <span
                                          className="home__suggestions-viewall"
                                          onClick={() => {
                                                const myId = localStorage.getItem("userId");
                                                if (myId) {
                                                      window.location.href = `/profile/${myId}?tab=friends`;
                                                }
                                          }}
                                    >
                                          xem tất cả
                                    </span>
                              </div>
                              <ul className="home__friend-requests">
                                    {friendRequests.length > 0 ? (
                                          friendRequests.map(request => (
                                                <li key={request.id}>
                                                      <img
                                                            src={request.avatarUrl ? `http://localhost:8080${request.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                                            alt="avatar"
                                                            className="home__avatar"
                                                            onClick={() => window.location.href = `/profile/${request.id}`}
                                                      />
                                                      <div className="home__friend-info">
                                                            <div className="home__friend-name-row">
                                                                  <span className="home__friend-name">{request.username}</span>
                                                            </div>
                                                            <div className="home__friend-actions">
                                                                  <button
                                                                        className="home__friend-accept"
                                                                        onClick={() => handleAcceptFriendRequest(request.id)}
                                                                  > ✔️ Xác nhận</button>
                                                                  <button
                                                                        className="home__friend-decline"
                                                                        onClick={() => handleDeclineFriendRequest(request.id)}
                                                                  >❌ Từ chối</button>
                                                            </div>
                                                      </div>
                                                </li>
                                          ))
                                    ) : (
                                          <li>Không có lời mời kết bạn mới</li>
                                    )}
                              </ul>
                        </div>

                        <hr />
                        <div className="home__suggestions home__suggestions-list">
                              <h5>Gợi ý cho bạn</h5>
                              <ul>
                                    {friendSuggestions.length > 0 ? (
                                          friendSuggestions.map(suggestion => (
                                                <li key={suggestion.id}>
                                                      <img
                                                            src={suggestion.avatarUrl ? `http://localhost:8080${suggestion.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                                            alt="avatar"
                                                            className="home__avatar"
                                                            onClick={() => window.location.href = `/profile/${suggestion.id}`}
                                                            style={{ cursor: "pointer" }}
                                                      />
                                                      <span
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => window.location.href = `/profile/${suggestion.id}`}
                                                      >
                                                            {suggestion.username}
                                                      </span>
                                                      <button
                                                            onClick={() => handleSendFriendRequest(suggestion.id)}
                                                            disabled={sendingFriendRequest === suggestion.id}
                                                            style={{
                                                                  opacity: sendingFriendRequest === suggestion.id ? 0.6 : 1,
                                                                  cursor: sendingFriendRequest === suggestion.id ? "not-allowed" : "pointer"
                                                            }}
                                                      >
                                                            {sendingFriendRequest === suggestion.id ? "Đang gửi..." : "Kết bạn"}
                                                      </button>
                                                </li>
                                          ))
                                    ) : (
                                          <li>Không có gợi ý kết bạn</li>
                                    )}
                              </ul>
                        </div>

                        <div className="message-button">
                              <ChatBubble />
                              <button onClick={() => window.location.href = `/messages`}>💬 Tin nhắn</button>
                        </div>



                  </aside>

                  {/* Search Modal */}
                  <SearchModal
                        isOpen={showSearchModal}
                        onClose={() => setShowSearchModal(false)}
                  />

                  {/* Notification Modal */}
                  <NotificationModal
                        isOpen={showNotificationModal}
                        onClose={() => {
                              setShowNotificationModal(false);
                              // Refresh unread count when closing modal
                              const myId = localStorage.getItem("userId");
                              if (myId) fetchUnreadNotificationCount(myId);
                        }}
                  />
            </div>
      );

}


