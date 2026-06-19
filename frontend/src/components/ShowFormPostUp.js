import React, { useState, useEffect } from "react";

// Lấy user info từ localStorage
const getUserFromLocalStorage = () => {
      try {
            return JSON.parse(localStorage.getItem("user")) || {};
      } catch {
            return {};
      }
};

function ShowFormPostUp({ onClose, onPostSuccess, editData }) {
      const [content, setContent] = useState(editData ? editData.content : "");
      const [loading, setLoading] = useState(false);
      const [mediaFiles, setMediaFiles] = useState(() => {
            if (editData) {
                  const imgs = (editData.imageUrls || []).map(url => ({ type: "image", url }));
                  const vids = (editData.videoUrls || []).map(url => ({ type: "video", url }));
                  return [...imgs, ...vids];
            }
            return [];
      });
      const [privacy, setPrivacy] = useState(editData ? editData.privacy : "public");
      const user = getUserFromLocalStorage();

      // State để lưu thông tin user đầy đủ từ server
      const [currentUser, setCurrentUser] = useState(user);

      const MAX_SIZE_MB = 100; // hoặc giá trị bạn muốn, ví dụ 1024 cho 1GB
      const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

      // Fetch thông tin user đầy đủ từ server
      useEffect(() => {
            const userId = localStorage.getItem("userId");
            if (userId) {
                  fetch(`http://localhost:8080/api/users/${userId}`)
                        .then(res => res.json())
                        .then(userData => {
                              setCurrentUser(userData);
                        })
                        .catch(err => console.error('Error fetching user:', err));
            }
      }, []);

      const handleMediaChange = async (e) => {
            const files = Array.from(e.target.files);
            const uploaded = [];

            console.log('Files selected:', files.length);

            for (const file of files) {
                  console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

                  if (file.size > MAX_SIZE) {
                        alert(`File "${file.name}" vượt quá dung lượng cho phép (${MAX_SIZE_MB}MB)!`);
                        continue; // bỏ qua file này
                  }

                  try {
                        const formData = new FormData();
                        formData.append("file", file);

                        console.log('Uploading file to:', "http://localhost:8080/api/upload");
                        const res = await fetch("http://localhost:8080/api/upload", {
                              method: "POST",
                              body: formData,
                              credentials: 'include'
                        });

                        console.log('Upload response status:', res.status);

                        if (res.ok) {
                              const url = await res.text();
                              console.log('Upload success, URL:', url);
                              const type = file.type.startsWith("video") ? "video" : "image";
                              uploaded.push({ type, url });
                        } else {
                              const errorText = await res.text();
                              console.error('Upload failed:', res.status, errorText);

                              if (res.status === 413) {
                                    alert("File vượt quá dung lượng cho phép trên server!");
                              } else {
                                    alert(`Lỗi upload file "${file.name}": ${errorText}`);
                              }
                              continue;
                        }
                  } catch (error) {
                        console.error('Upload error for file:', file.name, error);
                        alert(`Lỗi kết nối khi upload file "${file.name}": ${error.message}`);
                        continue;
                  }
            }

            console.log('Uploaded files:', uploaded);
            setMediaFiles((prev) => [...prev, ...uploaded]);
      };

      const handlePost = async () => {
            setLoading(true);
            const userId = localStorage.getItem("userId");
            if (!userId) {
                  alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!");
                  setLoading(false);
                  return;
            }

            const postData = {
                  content,
                  user: { id: Number(userId) },
                  imageUrls: mediaFiles.filter(f => f.type === "image").map(f => f.url),
                  videoUrls: mediaFiles.filter(f => f.type === "video").map(f => f.url),
                  privacy,
            };
            try {
                  let res;
                  if (editData) {
                        res = await fetch(`http://localhost:8080/api/posts/${editData.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(postData),
                        });
                  } else {
                        res = await fetch("http://localhost:8080/api/posts", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(postData),
                        });
                  }
                  if (res.ok) {
                        setContent("");
                        setMediaFiles([]);
                        onPostSuccess(); // reload lại danh sách bài viết
                        onClose();
                  } else {
                        alert(editData ? "Cập nhật bài viết thất bại!" : "Đăng bài thất bại!");
                  }
            } catch (e) {
                  alert("Lỗi kết nối server!");
            }
            setLoading(false);
      };

      const removeMedia = (idx) => {
            setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
      };

      return (
            <div className="custom-modal-overlay">
                  <div className="custom-modal">
                        {/* Header */}
                        <div className="modal-header">
                              <span className="modal-title">{editData ? "Chỉnh sửa bài viết" : "Tạo bài viết"}</span>
                              <button onClick={onClose} className="close-button" style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#888", width: "10%" }}>
                                    &times;
                              </button>
                        </div>

                        {/* User Info */}
                        <div className="user-info">
                              <img
                                    src={currentUser.avatarUrl ? `http://localhost:8080${currentUser.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                    alt="avatar"
                                    className="avatar"
                              />
                              <div>
                                    <div className="user-name">{currentUser.username}</div>
                                    {/* <div className="privacy">🌍 Công khai</div> */}
                                    <select
                                          style={{ fontSize: 14, borderRadius: 6, padding: '2px 8px', marginTop: 2 }}
                                          value={privacy}
                                          onChange={e => setPrivacy(e.target.value)}
                                    >
                                          <option value="public">🌍 Công khai</option>
                                          <option value="friends">👥 Bạn bè</option>
                                          <option value="private">🔒 Chỉ mình tôi</option>
                                    </select>
                              </div>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                              <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={`${currentUser.username} ơi, bạn đang nghĩ gì thế?`}
                                    rows={4}
                                    className="post-input"
                              />

                              {/* Hiển thị ảnh/video đã chọn */}
                              {mediaFiles.length > 0 && (
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
                                          {mediaFiles.map((f, idx) => (
                                                <div key={idx} style={{ position: "relative", display: "inline-block", padding: 2 }}>
                                                      {f.type === "image" ? (
                                                            <img
                                                                  src={f.url}
                                                                  alt="media"
                                                                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
                                                            />
                                                      ) : (
                                                            <video
                                                                  src={f.url}
                                                                  controls
                                                                  style={{ width: 100, height: 80, borderRadius: 6 }}
                                                            />
                                                      )}
                                                      <button
                                                            onClick={() => removeMedia(idx)}
                                                            style={{
                                                                  position: "absolute",
                                                                  top: 0,
                                                                  right: 0,
                                                                  background: "rgba(0,0,0,0.5)",
                                                                  color: "white",
                                                                  border: "none",
                                                                  borderRadius: "50%",
                                                                  width: 22,
                                                                  height: 22,
                                                                  cursor: "pointer",
                                                                  fontWeight: "bold",
                                                                  lineHeight: "18px",
                                                                  padding: 0
                                                            }}
                                                            title="Xóa ảnh/video"
                                                      >
                                                            ×
                                                      </button>
                                                </div>
                                          ))}
                                    </div>
                              )}

                              {/* Action icons */}
                              <div className="action-icons">
                                    <p>Thêm vào bài viết của bạn :</p>
                                    <span style={{ cursor: "pointer" }} onClick={() => document.getElementById("media-upload-input").click()}>🖼️</span>
                                    <input
                                          id="media-upload-input"
                                          type="file"
                                          accept="image/*,video/*"
                                          multiple
                                          style={{ display: "none" }}
                                          onChange={handleMediaChange}
                                    />
                                    <span>🎨</span>
                                    <span>🎥</span>
                                    <span>😊</span>
                                    <span>👥</span>
                                    <span>📍</span>
                                    <span>GIF</span>
                              </div>

                              {/* Post button */}
                              <button
                                    className="post-button"
                                    disabled={(!content.trim() && mediaFiles.length === 0) || loading}
                                    onClick={handlePost}
                              >
                                    {loading ? (editData ? "Đang lưu..." : "Đang đăng...") : (editData ? "Lưu thay đổi" : "Đăng")}
                              </button>
                        </div>
                  </div>
            </div>
      );
}

export default ShowFormPostUp; 