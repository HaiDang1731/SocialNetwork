import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

export default function PostManagement() {
      const [posts, setPosts] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            fetchPosts();
      }, []);

      const fetchPosts = async () => {
            try {
                  const response = await fetch(`${API_BASE}/api/admin/users/posts`);
                  if (response.ok) {
                        const data = await response.json();
                        setPosts(data);
                  } else {
                        console.error("Failed to fetch posts");
                  }
            } catch (error) {
                  console.error("Error fetching posts:", error);
            } finally {
                  setLoading(false);
            }
      };

      const handleDeletePost = async (postId) => {
            if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
                  return;
            }

            try {
                  const response = await fetch(`${API_BASE}/api/admin/users/posts/${postId}`, {
                        method: "DELETE"
                  });

                  if (response.ok) {
                        setPosts(posts.filter(post => post.id !== postId));
                        alert("Xóa bài viết thành công!");
                  } else {
                        alert("Lỗi xóa bài viết!");
                  }
            } catch (error) {
                  console.error("Error deleting post:", error);
                  alert("Lỗi xóa bài viết!");
            }
      };

      const formatContent = (content) => {
            if (content.length > 100) {
                  return content.substring(0, 100) + "...";
            }
            return content;
      };

      if (loading) {
            return <div className="admin-loading">Đang tải danh sách bài viết...</div>;
      }

      return (
            <div className="post-management">
                  <div className="post-management-header">
                        <div className="post-stats">
                              <span>Tổng số bài viết: {posts.length}</span>
                        </div>
                  </div>

                  <div className="posts-grid">
                        {posts.map(post => (
                              <div key={post.id} className="post-card">
                                    <div className="post-header">
                                          <div className="post-author">
                                                <img
                                                      src={post.user?.avatarUrl ? `${API_BASE}${post.user.avatarUrl}` : "/img/a1.jpeg"}
                                                      alt={post.user?.username || "User"}
                                                      className="post-author-avatar"
                                                />
                                                <div className="post-author-info">
                                                      <span className="post-author-name">
                                                            {post.user?.username || "Unknown User"}
                                                      </span>
                                                      <span className="post-date">
                                                            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                                      </span>
                                                </div>
                                          </div>
                                          <button
                                                className="btn-delete-post"
                                                onClick={() => handleDeletePost(post.id)}
                                                title="Xóa bài viết"
                                          >
                                                🗑️
                                          </button>
                                    </div>

                                    <div className="post-content">
                                          <p>{formatContent(post.content)}</p>
                                    </div>

                                    {post.imageUrl && (
                                          <div className="post-image">
                                                <img
                                                      src={`${API_BASE}${post.imageUrl}`}
                                                      alt="Post content"
                                                      className="post-image-preview"
                                                />
                                          </div>
                                    )}
                                    {post.videoUrl && (
                                          <div className="post-video">
                                                <video src={`${API_BASE}${post.videoUrl}`} alt="Post content" className="post-video-preview" />
                                          </div>
                                    )}

                                    <div className="post-stats">
                                          <span>👍 {post.likesCount || 0} likes</span>
                                          <span>💬 {post.commentsCount || 0} comments</span>
                                          <span>ID: {post.id}</span>
                                    </div>
                              </div>
                        ))}
                  </div>

                  {posts.length === 0 && (
                        <div className="no-data">
                              Không có bài viết nào
                        </div>
                  )}
            </div>
      );
} 