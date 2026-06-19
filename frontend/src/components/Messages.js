import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import "../css/messages.css";

const API_BASE = "http://localhost:8080";

// Lấy user info từ localStorage
const getUserFromLocalStorage = () => {
      try {
            return JSON.parse(localStorage.getItem("user")) || {};
      } catch {
            return {};
      }
};

export default function Messages() {
      const { userId: paramUserId } = useParams();
      const [selectedFriend, setSelectedFriend] = useState(null);
      const [friends, setFriends] = useState([]);
      const [messages, setMessages] = useState([]);
      const [newMessage, setNewMessage] = useState("");
      const [loading, setLoading] = useState(true);
      const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, messageId: null, canRecall: false });
      // const currentUser = getUserFromLocalStorage();
      const myId = localStorage.getItem("userId");
      const messagesEndRef = useRef(null);
      const stompClient = useRef(null);

      // Cuộn xuống cuối tin nhắn
      const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };

      // Lấy danh sách bạn bè
      useEffect(() => {
            if (!myId) return;

            console.log('Fetching friends for userId:', myId);
            fetch(`${API_BASE}/api/users/${myId}/friends`)
                  .then(res => {
                        console.log('Friends API response status:', res.status);
                        if (res.ok) {
                              return res.json();
                        } else {
                              console.error('Friends API failed with status:', res.status);
                              return res.text().then(text => {
                                    console.error('Friends API error:', text);
                                    return [];
                              });
                        }
                  })
                  .then(data => {
                        console.log('Friends data:', data);
                        setFriends(Array.isArray(data) ? data : []);
                        setLoading(false);

                        // Nếu có userId trong URL, tự động chọn bạn đó
                        if (paramUserId && Array.isArray(data)) {
                              const friend = data.find(f => f.id === Number(paramUserId));
                              if (friend) {
                                    setSelectedFriend(friend);
                              }
                        }
                  })
                  .catch(err => {
                        console.error('Friends fetch error:', err);
                        setFriends([]);
                        setLoading(false);
                  });
      }, [myId, paramUserId]);

      // Kết nối WebSocket
      useEffect(() => {
            if (!myId) return;

            const socket = new SockJS(`${API_BASE}/ws`);
            stompClient.current = Stomp.over(socket);

            stompClient.current.connect({}, () => {
                  // Lắng nghe tin nhắn mới
                  stompClient.current.subscribe(`/topic/messages/${myId}`, (message) => {
                        const messageData = JSON.parse(message.body);

                        // Kiểm tra nếu là thông báo thu hồi tin nhắn
                        if (messageData.action === 'recalled' || messageData.action === 'deleted') {
                              setMessages(prev => {
                                    if (messageData.action === 'recalled') {
                                          return prev.map(msg =>
                                                msg.id === messageData.messageId
                                                      ? { ...msg, content: "[Tin nhắn đã được thu hồi]", recalled: true }
                                                      : msg
                                          );
                                    } else if (messageData.action === 'deleted') {
                                          return prev.filter(msg => msg.id !== messageData.messageId);
                                    }
                                    return prev;
                              });
                        } else {
                              // Tin nhắn mới bình thường
                              if (messageData.sender && selectedFriend && messageData.sender.id === selectedFriend.id) {
                                    setMessages(prev => [...prev, messageData]);
                                    scrollToBottom();
                              }
                        }
                  });
            });

            return () => {
                  if (stompClient.current) {
                        stompClient.current.disconnect();
                  }
            };
      }, [myId, selectedFriend]);

      // Lấy tin nhắn khi chọn bạn bè
      useEffect(() => {
            if (!selectedFriend || !myId) return;

            console.log('Fetching conversation between:', myId, 'and', selectedFriend.id);
            fetch(`${API_BASE}/api/messages/conversation/${myId}/${selectedFriend.id}`)
                  .then(res => {
                        console.log('Conversation API response status:', res.status);
                        if (res.ok) {
                              return res.json();
                        } else {
                              console.error('Conversation API failed with status:', res.status);
                              return res.text().then(text => {
                                    console.error('Conversation API error:', text);
                                    return [];
                              });
                        }
                  })
                  .then(data => {
                        console.log('Conversation data:', data);
                        setMessages(Array.isArray(data) ? data : []);

                        // Đánh dấu đã đọc
                        fetch(`${API_BASE}/api/messages/mark-read/${selectedFriend.id}/${myId}`, {
                              method: "PUT"
                        }).catch(err => console.error('Mark read error:', err));
                  })
                  .catch(err => {
                        console.error('Conversation fetch error:', err);
                        setMessages([]);
                  });
      }, [selectedFriend, myId]);

      // Cuộn xuống khi có tin nhắn mới
      useEffect(() => {
            scrollToBottom();
      }, [messages]);

      // Gửi tin nhắn
      const handleSendMessage = () => {
            if (!newMessage.trim() || !selectedFriend) return;

            const messageData = {
                  senderId: Number(myId),
                  receiverId: selectedFriend.id,
                  content: newMessage
            };

            console.log('Sending message:', messageData);
            fetch(`${API_BASE}/api/messages/send`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(messageData)
            })
                  .then(res => {
                        console.log('Send message API response status:', res.status);
                        if (res.ok) {
                              return res.json();
                        } else {
                              console.error('Send message API failed with status:', res.status);
                              return res.text().then(text => {
                                    console.error('Send message API error:', text);
                                    throw new Error(text);
                              });
                        }
                  })
                  .then(data => {
                        console.log('Send message response:', data);
                        if (data && data.id) {
                              setMessages(prev => Array.isArray(prev) ? [...prev, data] : [data]);
                              setNewMessage("");
                              scrollToBottom();
                        }
                  })
                  .catch(err => {
                        console.error('Send message error:', err);
                        alert('Lỗi gửi tin nhắn: ' + err.message);
                  });
      };

      // Xử lý phím Enter
      const handleKeyPress = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
            }
      };

      // Đăng xuất
      const handleLogout = () => {
            localStorage.removeItem("jwt");
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            window.location.href = "/";
      };

      // Thu hồi tin nhắn
      const handleRecallMessage = async (messageId) => {
            try {
                  const response = await fetch(`${API_BASE}/api/messages/recall/${messageId}?userId=${myId}`, {
                        method: "DELETE"
                  });

                  if (response.ok) {
                        // Cập nhật tin nhắn trong state
                        setMessages(prev => prev.map(msg =>
                              msg.id === messageId
                                    ? { ...msg, content: "[Tin nhắn đã được thu hồi]", recalled: true }
                                    : msg
                        ));
                        setContextMenu({ show: false, x: 0, y: 0, messageId: null, canRecall: false });
                  } else {
                        const error = await response.text();
                        alert(error);
                  }
            } catch (err) {
                  console.error('Recall message error:', err);
                  alert('Lỗi thu hồi tin nhắn');
            }
      };

      // Xử lý click chuột phải vào tin nhắn
      const handleMessageRightClick = (e, message) => {
            e.preventDefault();

            const isMyMessage = message.sender.id === Number(myId);
            const canRecall = isMyMessage && !message.recalled;

            setContextMenu({
                  show: true,
                  x: e.clientX,
                  y: e.clientY,
                  messageId: message.id,
                  canRecall: canRecall
            });
      };

      // Đóng context menu
      const handleCloseContextMenu = () => {
            setContextMenu({ show: false, x: 0, y: 0, messageId: null, canRecall: false });
      };

      // Lắng nghe click để đóng context menu
      useEffect(() => {
            const handleClick = () => handleCloseContextMenu();
            if (contextMenu.show) {
                  document.addEventListener('click', handleClick);
            }
            return () => document.removeEventListener('click', handleClick);
      }, [contextMenu.show]);

      if (loading) return <div style={{ padding: 40 }}>Đang tải...</div>;

      return (
            <div className="messages-container">
                  {/* Sidebar trái */}
                  <aside className="home__sidebar">
                        <h2 className="home__logo">😏 Fakebook</h2>
                        <ul className="home__menu">
                              <li onClick={() => window.location.href = "/Home"} style={{ cursor: "pointer" }}>🏠 Trang chủ</li>
                              <li>🔍 Tìm kiếm</li>
                              <li className="active">💬 Tin nhắn</li>
                              <li>➕ Tạo</li>
                              <li>🔔 Thông báo</li>
                              <li onClick={() => {
                                    const id = localStorage.getItem("userId");
                                    window.location.href = id ? `/profile/${id}` : "/profile";
                              }} style={{ cursor: "pointer" }}>👤 Trang cá nhân</li>
                              <li onClick={handleLogout} className="home__logout">🚪 Đăng xuất</li>
                        </ul>
                  </aside>

                  {/* Danh sách bạn bè */}
                  <div className="friends-list">
                        <div className="friends-header">
                              <h3>Tin nhắn</h3>
                        </div>
                        <div className="friends-scroll">
                              {friends.length > 0 ? (
                                    friends.map(friend => (
                                          <div
                                                key={friend.id}
                                                className={`friend-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
                                                onClick={() => setSelectedFriend(friend)}
                                          >
                                                <img
                                                      src={friend.avatarUrl ? `http://localhost:8080${friend.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                                      alt={friend.username}
                                                      className="friend-avatar"
                                                />
                                                <div className="friend-info">
                                                      <div className="friend-name">{friend.username}</div>
                                                      <div className="friend-last-message">Nhấn để chat</div>
                                                </div>
                                          </div>
                                    ))
                              ) : (
                                    <div className="no-friends">Không có bạn bè để chat</div>
                              )}
                        </div>
                  </div>

                  {/* Khu vực chat */}
                  <div className="chat-area">
                        {selectedFriend ? (
                              <>
                                    {/* Header chat */}
                                    <div className="chat-header">
                                          <img
                                                src={selectedFriend.avatarUrl ? `http://localhost:8080${selectedFriend.avatarUrl}?${Date.now()}` : "/img/a1.jpeg"}
                                                alt={selectedFriend.username}
                                                className="chat-avatar"
                                          />
                                          <div className="chat-info">
                                                <div className="chat-name">{selectedFriend.username}</div>
                                                <div className="chat-status">Đang hoạt động</div>
                                          </div>
                                    </div>

                                    {/* Tin nhắn */}
                                    <div className="messages-list">

                                          {Array.isArray(messages) && messages.map(message => (
                                                <div
                                                      key={message.id}
                                                      className={`message ${message.sender.id === Number(myId) ? 'sent' : 'received'} ${message.recalled ? 'recalled' : ''}`}
                                                      onContextMenu={(e) => handleMessageRightClick(e, message)}
                                                >
                                                      <div className="message-content" >
                                                            {message.recalled ? (
                                                                  <span style={{ fontStyle: 'italic', color: '#888' }}>
                                                                        {message.content}
                                                                  </span>
                                                            ) : (
                                                                  message.content
                                                            )}
                                                      </div>
                                                      <div className="message-time">
                                                            {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit'
                                                            })}
                                                      </div>
                                                </div>
                                          ))}
                                          <div ref={messagesEndRef} />
                                    </div>

                                    {/* Context Menu */}
                                    {contextMenu.show && (
                                          <div
                                                className="context-menu"
                                                style={{
                                                      position: 'fixed',
                                                      top: contextMenu.y,
                                                      left: contextMenu.x,
                                                      zIndex: 1000
                                                }}
                                          >
                                                {contextMenu.canRecall && (
                                                      <button onClick={() => handleRecallMessage(contextMenu.messageId)}>
                                                            Thu hồi tin nhắn
                                                      </button>
                                                )}
                                                <button onClick={handleCloseContextMenu}>
                                                      Đóng
                                                </button>
                                          </div>
                                    )}

                                    {/* Input gửi tin nhắn */}
                                    <div className="message-input">
                                          <input
                                                type="text"
                                                placeholder={`Nhắn tin cho ${selectedFriend.username}...`}
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                          />
                                          <button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                                Gửi
                                          </button>
                                    </div>
                              </>
                        ) : (
                              <div className="no-chat-selected">
                                    <h3>Chọn một cuộc trò chuyện</h3>
                                    <p>Chọn bạn bè từ danh sách để bắt đầu chat</p>
                              </div>
                        )}
                  </div>
            </div>
      );
}