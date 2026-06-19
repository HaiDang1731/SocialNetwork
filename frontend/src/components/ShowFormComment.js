import React, { useState, useEffect } from "react";

// Lấy user info từ localStorage
const getUserFromLocalStorage = () => {
      try {
            return JSON.parse(localStorage.getItem("user")) || {};
      } catch {
            return {};
      }
};

// Hàm tính thời gian từ lúc đăng bài viết
function getTimeAgo(dateString) {
      const now = new Date();
      const created = new Date(dateString);
      const diffMs = now - created;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffMonths / 12);

      if (diffMinutes < 1) return "Vừa xong";
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffMonths < 12) {
            return diffMonths === 1 ? "Tháng trước" : `${diffMonths} tháng trước`;
      }
      return diffYears === 1 ? "Năm trước" : `${diffYears} năm trước`;
}

function ShowFormComment({ postId, onClose, post, onCommentSuccess }) {
      const [content, setContent] = useState("");
      const [comments, setComments] = useState([]);
      const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
      const [replyContent, setReplyContent] = useState("");
      const [editingCommentId, setEditingCommentId] = useState(null);
      const [editContent, setEditContent] = useState("");
      const [showOptionsFor, setShowOptionsFor] = useState(null);
      const user = getUserFromLocalStorage();

      useEffect(() => {
            fetch(`http://localhost:8080/api/comments/post/${postId}`)
                  .then((res) => res.json())
                  .then((data) => setComments(data));
      }, [postId]);

      const handleComment = async () => {
            if (!content.trim()) return;
            const userId = Number(localStorage.getItem("userId"));
            await fetch("http://localhost:8080/api/comments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                        content,
                        user: { id: userId },
                        post: { id: postId },
                  }),
            });
            setContent("");
            // Reload comments
            fetch(`http://localhost:8080/api/comments/post/${postId}`)
                  .then((res) => res.json())
                  .then((data) => setComments(data));
            if (onCommentSuccess) onCommentSuccess(); // Gọi callback tăng số lượng comment
      };

      const handleReply = async (parentId) => {
            if (!replyContent.trim()) return;
            const userId = Number(localStorage.getItem("userId"));
            await fetch("http://localhost:8080/api/comments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                        content: replyContent,
                        user: { id: userId },
                        post: { id: postId },
                        parent: { id: parentId },
                  }),
            });
            setReplyContent("");
            setActiveReplyCommentId(null);
            // Reload comments
            fetch(`http://localhost:8080/api/comments/post/${postId}`)
                  .then((res) => res.json())
                  .then((data) => setComments(data));
            if (onCommentSuccess) onCommentSuccess(); // Gọi callback tăng số lượng comment
      };

      const handleEditComment = async (commentId) => {
            if (!editContent.trim()) return;
            try {
                  await fetch(`http://localhost:8080/api/comments/${commentId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ content: editContent }),
                  });
                  setEditingCommentId(null);
                  setEditContent("");
                  setShowOptionsFor(null);
                  // Reload comments
                  fetch(`http://localhost:8080/api/comments/post/${postId}`)
                        .then((res) => res.json())
                        .then((data) => setComments(data));
            } catch (error) {
                  alert("Lỗi khi sửa bình luận!");
            }
      };

      const handleDeleteComment = async (commentId) => {
            if (window.confirm("Bạn có chắc muốn xóa bình luận này?")) {
                  try {
                        await fetch(`http://localhost:8080/api/comments/${commentId}`, {
                              method: "DELETE",
                        });
                        setShowOptionsFor(null);
                        // Reload comments
                        fetch(`http://localhost:8080/api/comments/post/${postId}`)
                              .then((res) => res.json())
                              .then((data) => setComments(data));
                        if (onCommentSuccess) onCommentSuccess(); // Gọi callback để cập nhật số lượng comment
                  } catch (error) {
                        alert("Lỗi khi xóa bình luận!");
                  }
            }
      };

      const startEditComment = (comment) => {
            setEditingCommentId(comment.id);
            setEditContent(comment.content);
            setShowOptionsFor(null);
      };

      // Tách comment cha và replies
      const parentComments = comments.filter(c => !c.parent);
      const getReplies = (parentId) => comments.filter(c => c.parent && c.parent.id === parentId);

      return (
            <div className="custom-modal-overlay">
                  <div className="custom-modal">
                        <div className="modal-header">
                              <span className="modal-title">Bài viết của {post.user?.username}</span>
                              <button onClick={onClose} className="close-button-comment">
                                    &times;
                              </button>
                        </div>
                        <div className="post-scroll-container" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: 10 }}>

                              {/* Thông tin bài post */}
                              {post && (
                                    <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                                          <img
                                                src={post.user?.avatarUrl ? `http://localhost:8080${post.user?.avatarUrl}` : "/img/a1.jpeg"}
                                                alt="avatar"
                                                className="avatar"
                                                style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 10 }}
                                          />
                                          <div>
                                                <div style={{ fontWeight: "bold" }}>{post.user?.username}</div>
                                                <div style={{ fontSize: 12, color: "#888" }}>{new Date(post.createdAt).toLocaleString()}</div>
                                          </div>
                                    </div>
                              )}

                              {/* Nội dung bài post */}
                              {post && (
                                    <div style={{ marginBottom: 12 }}>
                                          <div style={{ fontSize: 15, marginBottom: 12 }}>{post.content}</div>
                                          {(post.imageUrls?.length > 0 || post.videoUrls?.length > 0) && (
                                                <div className="comment-media-grid" style={{
                                                      display: "grid",
                                                      gap: "8px",
                                                      marginTop: "12px",
                                                      gridTemplateColumns: (() => {
                                                            const totalMedia = (post.imageUrls?.length || 0) + (post.videoUrls?.length || 0);
                                                            if (totalMedia === 1) return "1fr";
                                                            if (totalMedia === 2) return "1fr 1fr";
                                                            if (totalMedia === 3) return "1fr 1fr 1fr";
                                                            return "1fr 1fr";
                                                      })(),
                                                      maxWidth: "100%"
                                                }}>
                                                      {post.imageUrls && post.imageUrls.map((url, idx) => (
                                                            <div key={`img-${idx}`} style={{ position: "relative", overflow: "hidden", borderRadius: "12px" }}>
                                                                  <img
                                                                        src={url}
                                                                        alt={`post-img-${idx}`}
                                                                        style={{
                                                                              width: "100%",
                                                                              height: "200px",
                                                                              objectFit: "cover",
                                                                              borderRadius: "12px",
                                                                              cursor: "pointer",
                                                                              transition: "transform 0.2s ease"
                                                                        }}
                                                                        onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
                                                                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                                                  />
                                                            </div>
                                                      ))}
                                                      {post.videoUrls && post.videoUrls.map((url, idx) => (
                                                            <div key={`vid-${idx}`} style={{ position: "relative", overflow: "hidden", borderRadius: "12px" }}>
                                                                  <video
                                                                        src={url}
                                                                        controls
                                                                        style={{
                                                                              width: "100%",
                                                                              height: "200px",
                                                                              objectFit: "cover",
                                                                              borderRadius: "12px",
                                                                              outline: "none"
                                                                        }}
                                                                  />
                                                            </div>
                                                      ))}
                                                </div>
                                          )}
                                    </div>
                              )}
                              {/* Danh sách bình luận */}
                              <hr />
                              <div className="modal-body">
                                    <div className="comment-list">
                                          {parentComments.map((comment) => (
                                                <div key={comment.id} className="comment-item-wrapper">
                                                      <div className="comment-item">
                                                            <img src={comment.user?.avatarUrl ? `http://localhost:8080${comment.user?.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"} className="avatar" alt="avatar" />
                                                            <div className="comment-content">
                                                                  <div className="comment-user">{comment.user?.username}</div>
                                                                  {editingCommentId === comment.id ? (
                                                                        <div className="edit-comment-form" style={{ marginTop: 8 }}>
                                                                              <input
                                                                                    type="text"
                                                                                    value={editContent}
                                                                                    onChange={(e) => setEditContent(e.target.value)}
                                                                                    onKeyDown={(e) => e.key === "Enter" && handleEditComment(comment.id)}
                                                                                    style={{ width: "100%", padding: "6px", marginBottom: "6px" }}
                                                                              />
                                                                              <div>
                                                                                    <button onClick={() => handleEditComment(comment.id)} style={{ marginRight: "6px" }}>Lưu</button>
                                                                                    <button onClick={() => setEditingCommentId(null)}>Hủy</button>
                                                                              </div>
                                                                        </div>
                                                                  ) : (
                                                                        <div className="comment-text">{comment.content}</div>
                                                                  )}
                                                                  <div className="comment-meta">
                                                                        <span className="comment-time">
                                                                              {comment.createdAt ? getTimeAgo(comment.createdAt) : ""}
                                                                        </span> ·
                                                                        <span className="comment-action">Thích</span> ·
                                                                        <span
                                                                              className="comment-action"
                                                                              onClick={() => setActiveReplyCommentId(comment.id)}
                                                                        >
                                                                              Trả lời
                                                                        </span>
                                                                  </div>

                                                                  {activeReplyCommentId === comment.id && (
                                                                        <div className="reply-form" style={{ marginTop: 8 }}>
                                                                              <input
                                                                                    type="text"
                                                                                    placeholder="Viết phản hồi..."
                                                                                    value={replyContent}
                                                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                                                    onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
                                                                              />
                                                                              <button onClick={() => handleReply(comment.id)}>Gửi</button>
                                                                        </div>
                                                                  )}
                                                            </div>
                                                            <div style={{ position: "relative" }}>
                                                                  <span
                                                                        className="comment-action"
                                                                        style={{ cursor: "pointer" }}
                                                                        onClick={() => setShowOptionsFor(showOptionsFor === comment.id ? null : comment.id)}
                                                                  >
                                                                        ...
                                                                  </span>
                                                                  {showOptionsFor === comment.id && (
                                                                        <div className="comment-options-dropdown" style={{
                                                                              position: "absolute",
                                                                              right: 0,
                                                                              top: 20,
                                                                              background: "#fff",
                                                                              border: "1px solid #ddd",
                                                                              borderRadius: 6,
                                                                              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                                                              zIndex: 10,
                                                                              minWidth: 100
                                                                        }}>
                                                                              {comment.user?.id === Number(localStorage.getItem("userId")) ? (
                                                                                    <>
                                                                                          <button
                                                                                                style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer" }}
                                                                                                onClick={() => startEditComment(comment)}
                                                                                          >
                                                                                                Sửa
                                                                                          </button>
                                                                                          <button
                                                                                                style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer", color: "red" }}
                                                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                                          >
                                                                                                Xóa
                                                                                          </button>
                                                                                    </>
                                                                              ) : (
                                                                                    <button
                                                                                          style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer" }}
                                                                                          onClick={() => alert("Đã báo cáo bình luận!")}
                                                                                    >
                                                                                          Báo cáo
                                                                                    </button>
                                                                              )}
                                                                        </div>
                                                                  )}
                                                            </div>
                                                      </div>
                                                      {/* Render replies */}
                                                      {getReplies(comment.id).map((reply) => (
                                                            <div key={reply.id} className="comment-item reply">
                                                                  <img src={reply.user?.avatarUrl ? `http://localhost:8080${reply.user?.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"} className="avatar" alt="avatar" />
                                                                  <div className="comment-content">
                                                                        <div className="comment-user">{reply.user?.username || "Ẩn danh"}</div>
                                                                        {editingCommentId === reply.id ? (
                                                                              <div className="edit-comment-form" style={{ marginTop: 8 }}>
                                                                                    <input
                                                                                          type="text"
                                                                                          value={editContent}
                                                                                          onChange={(e) => setEditContent(e.target.value)}
                                                                                          onKeyDown={(e) => e.key === "Enter" && handleEditComment(reply.id)}
                                                                                          style={{ width: "100%", padding: "6px", marginBottom: "6px" }}
                                                                                    />
                                                                                    <div>
                                                                                          <button onClick={() => handleEditComment(reply.id)} style={{ marginRight: "6px" }}>Lưu</button>
                                                                                          <button onClick={() => setEditingCommentId(null)}>Hủy</button>
                                                                                    </div>
                                                                              </div>
                                                                        ) : (
                                                                              <div className="comment-text">{reply.content}</div>
                                                                        )}
                                                                        <div className="comment-meta">
                                                                              <span className="comment-time">
                                                                                    {reply.createdAt ? getTimeAgo(reply.createdAt) : ""}
                                                                              </span> ·
                                                                              <span className="comment-action">Thích</span> ·
                                                                              <span
                                                                                    className="comment-action"
                                                                                    onClick={() => setActiveReplyCommentId(comment.id)}
                                                                              >
                                                                                    Trả lời
                                                                              </span>
                                                                        </div>
                                                                  </div>
                                                                  <div style={{ position: "relative" }}>
                                                                        <span
                                                                              className="comment-action"
                                                                              style={{ cursor: "pointer" }}
                                                                              onClick={() => setShowOptionsFor(showOptionsFor === reply.id ? null : reply.id)}
                                                                        >
                                                                              ...
                                                                        </span>
                                                                        {showOptionsFor === reply.id && (
                                                                              <div className="comment-options-dropdown" style={{
                                                                                    position: "absolute",
                                                                                    right: 0,
                                                                                    top: 20,
                                                                                    background: "#fff",
                                                                                    border: "1px solid #ddd",
                                                                                    borderRadius: 6,
                                                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                                                                    zIndex: 10,
                                                                                    minWidth: 100
                                                                              }}>
                                                                                    {reply.user?.id === Number(localStorage.getItem("userId")) ? (
                                                                                          <>
                                                                                                <button
                                                                                                      style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer" }}
                                                                                                      onClick={() => startEditComment(reply)}
                                                                                                >
                                                                                                      Sửa
                                                                                                </button>
                                                                                                <button
                                                                                                      style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer", color: "red" }}
                                                                                                      onClick={() => handleDeleteComment(reply.id)}
                                                                                                >
                                                                                                      Xóa
                                                                                                </button>
                                                                                          </>
                                                                                    ) : (
                                                                                          <button
                                                                                                style={{ width: "100%", padding: 8, border: "none", background: "none", textAlign: "left", cursor: "pointer" }}
                                                                                                onClick={() => alert("Đã báo cáo bình luận!")}
                                                                                          >
                                                                                                Báo cáo
                                                                                          </button>
                                                                                    )}
                                                                              </div>
                                                                        )}
                                                                  </div>
                                                            </div>
                                                      ))}
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        </div>
                        {/* Ô nhập bình luận */}
                        <div className="comment-form">
                              <img
                                    src={user.avatarUrl ? `http://localhost:8080${user.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                    alt="avatar"
                                    className="avatar"
                              />
                              <input
                                    type="text"
                                    placeholder={`Bình luận dưới tên ${user?.username}`}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                              />
                              <button onClick={handleComment}>
                                    Gửi
                              </button>
                        </div>
                  </div>
            </div>
      );
}

export default ShowFormComment; 