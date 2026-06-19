import React, { useState, useEffect } from 'react';
import '../css/NotificationModal.css';

const API_URL = "http://localhost:8080";

function NotificationModal({ isOpen, onClose }) {
      const [notifications, setNotifications] = useState([]);
      const [loading, setLoading] = useState(false);
      const [activeTab, setActiveTab] = useState('all'); // 'all' hoặc 'unread'
      const myId = localStorage.getItem("userId");

      // Lấy thông báo
      const fetchNotifications = async () => {
            if (!myId) return;

            setLoading(true);
            try {
                  const endpoint = activeTab === 'unread'
                        ? `${API_URL}/api/notifications/user/${myId}/unread`
                        : `${API_URL}/api/notifications/user/${myId}`;

                  const response = await fetch(endpoint);
                  if (response.ok) {
                        const data = await response.json();
                        setNotifications(data);
                  }
            } catch (error) {
                  console.error('Error fetching notifications:', error);
            } finally {
                  setLoading(false);
            }
      };

      // Đánh dấu thông báo đã đọc
      const markAsRead = async (notificationId) => {
            try {
                  await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
                        method: 'PUT'
                  });

                  // Cập nhật state local
                  setNotifications(prev => prev.map(notif =>
                        notif.id === notificationId
                              ? { ...notif, read: true }
                              : notif
                  ));
            } catch (error) {
                  console.error('Error marking notification as read:', error);
            }
      };

      // Đánh dấu tất cả đã đọc
      const markAllAsRead = async () => {
            if (!myId) return;

            try {
                  await fetch(`${API_URL}/api/notifications/user/${myId}/read-all`, {
                        method: 'PUT'
                  });

                  // Cập nhật state local
                  setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
            } catch (error) {
                  console.error('Error marking all notifications as read:', error);
            }
      };

      // Xử lý click vào thông báo
      const handleNotificationClick = (notification) => {
            // Đánh dấu đã đọc nếu chưa đọc
            if (!notification.read) {
                  markAsRead(notification.id);
            }

            // Đóng modal trước
            onClose();

            // Điều hướng dựa trên loại thông báo
            switch (notification.type) {
                  case 'POST':
                  case 'LIKE':
                  case 'COMMENT':
                        if (notification.relatedPostId) {
                              // Scroll đến bài viết cụ thể
                              setTimeout(() => {
                                    const postElement = document.getElementById(`post-${notification.relatedPostId}`);
                                    if (postElement) {
                                          postElement.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'center'
                                          });
                                          // Thêm hiệu ứng highlight
                                          postElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
                                          postElement.style.border = '2px solid #3b82f6';
                                          postElement.style.transition = 'all 0.3s ease';

                                          // Xóa hiệu ứng sau 3 giây
                                          setTimeout(() => {
                                                postElement.style.boxShadow = '';
                                                postElement.style.border = '';
                                          }, 3000);
                                    } else {
                                          // Nếu không tìm thấy post, có thể post đã bị xóa hoặc chưa load
                                          console.log('Post not found, might need to refresh or load more posts');
                                    }
                              }, 300); // Delay để modal đóng hoàn toàn
                        }
                        break;
                  case 'FRIEND_REQUEST':
                  case 'FRIEND_ACCEPT':
                        // Có thể mở profile modal hoặc chuyển đến trang profile
                        if (notification.fromUser) {
                              console.log('Navigate to profile:', notification.fromUser.id);
                              // Tạm thời log, có thể implement profile modal sau
                        }
                        break;
                  default:
                        break;
            }
      };

      // Lấy icon cho từng loại thông báo
      const getNotificationIcon = (type) => {
            switch (type) {
                  case 'POST': return '📝';
                  case 'LIKE': return '❤️';
                  case 'COMMENT': return '💬';
                  case 'FRIEND_REQUEST': return '👥';
                  case 'FRIEND_ACCEPT': return '✅';
                  default: return '🔔';
            }
      };

      // Tính thời gian
      const getTimeAgo = (dateString) => {
            const now = new Date();
            const created = new Date(dateString);
            const diffMs = now - created;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMinutes < 1) return "Vừa xong";
            if (diffMinutes < 60) return `${diffMinutes} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            return `${diffDays} ngày trước`;
      };

      // Load thông báo khi mở modal hoặc đổi tab
      useEffect(() => {
            if (isOpen) {
                  fetchNotifications();
            }
      }, [isOpen, activeTab]);

      if (!isOpen) return null;

      return (
            <div className="notification-modal-overlay" onClick={onClose}>
                  <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="notification-modal-header">
                              <h2>Thông báo</h2>
                              <button className="notification-modal-close" onClick={onClose}>×</button>
                        </div>

                        {/* Tabs */}
                        <div className="notification-tabs">
                              <button
                                    className={`notification-tab ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('all')}
                              >
                                    Tất cả
                              </button>
                              <button
                                    className={`notification-tab ${activeTab === 'unread' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('unread')}
                              >
                                    Chưa đọc
                              </button>
                              {activeTab === 'all' && notifications.some(n => !n.read) && (
                                    <button
                                          className="mark-all-read-btn"
                                          onClick={markAllAsRead}
                                    >
                                          Đánh dấu tất cả đã đọc
                                    </button>
                              )}
                        </div>

                        {/* Content */}
                        <div className="notification-modal-content">
                              {loading ? (
                                    <div className="notification-loading">Đang tải...</div>
                              ) : notifications.length > 0 ? (
                                    notifications.map(notification => (
                                          <div
                                                key={notification.id}
                                                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                                onClick={() => handleNotificationClick(notification)}
                                          >
                                                <div className="notification-icon">
                                                      {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="notification-content">
                                                      <div className="notification-header">
                                                            <img
                                                                  src={notification.fromUser?.avatarUrl ? `${API_URL}${notification.fromUser.avatarUrl}` : "/img/a1.jpeg"}
                                                                  alt="avatar"
                                                                  className="notification-avatar"
                                                            />
                                                            <div className="notification-text">
                                                                  <span className="notification-message">
                                                                        {notification.content}
                                                                  </span>
                                                                  <span className="notification-time">
                                                                        {getTimeAgo(notification.createdAt)}
                                                                  </span>
                                                            </div>
                                                      </div>
                                                      {!notification.read && (
                                                            <div className="notification-unread-dot"></div>
                                                      )}
                                                </div>
                                          </div>
                                    ))
                              ) : (
                                    <div className="notification-empty">
                                          {activeTab === 'unread'
                                                ? 'Không có thông báo chưa đọc'
                                                : 'Chưa có thông báo nào'}
                                    </div>
                              )}
                        </div>
                  </div>
            </div>
      );
}

export default NotificationModal; 