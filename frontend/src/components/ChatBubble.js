import React, { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import "../css/ChatBubble.css";

const API_URL = "http://localhost:8080";

// Lấy thông tin người dùng từ localStorage
const getUserFromLocalStorage = () => {
      try {
            return JSON.parse(localStorage.getItem("user")) || {};
      } catch {
            return {};
      }
};

function ChatBubble() {
      // Trạng thái UI
      const [showChatPopup, setShowChatPopup] = useState(false); // Ẩn/hiện popup chat
      const [conversations, setConversations] = useState([]); // Danh sách cuộc trò chuyện
      const [selectedConversation, setSelectedConversation] = useState(null); // Cuộc trò chuyện đang chọn
      const [messages, setMessages] = useState([]); // Danh sách tin nhắn của cuộc trò chuyện
      const [newMessage, setNewMessage] = useState(""); // Tin nhắn mới
      const [totalUnreadCount, setTotalUnreadCount] = useState(0); // Tổng số tin chưa đọc
      const [showMessageOptions, setShowMessageOptions] = useState(null); // Hiển thị options cho tin nhắn

      const stompClient = useRef(null); // WebSocket client
      const messagesEndRef = useRef(null); // Ref để cuộn xuống cuối
      const myId = localStorage.getItem("userId"); // ID người dùng hiện tại
      const user = getUserFromLocalStorage();

      // Hàm cuộn xuống cuối danh sách tin nhắn
      const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };

      // Hàm lấy danh sách cuộc trò chuyện
      const fetchConversations = useCallback(async () => {
            if (!myId) return;

            try {
                  const response = await fetch(`${API_URL}/api/messages/conversations/${myId}`);
                  if (response.ok) {
                        const data = await response.json();
                        setConversations(data);
                        const total = data.reduce((sum, conv) => sum + conv.unreadCount, 0);
                        setTotalUnreadCount(total);
                  }
            } catch (error) {
                  console.error('Error fetching conversations:', error);
            }
      }, [myId]);

      // Kết nối WebSocket khi component mount
      useEffect(() => {
            if (!myId) return;

            const socket = new SockJS(`${API_URL}/ws`);
            stompClient.current = Stomp.over(socket);

            stompClient.current.connect({}, () => {
                  // Đăng ký nhận tin nhắn real-time theo userId
                  stompClient.current.subscribe(`/topic/messages/${myId}`, (message) => {
                        const messageData = JSON.parse(message.body);

                        // Nếu tin nhắn thuộc cuộc trò chuyện đang mở -> thêm vào
                        if (selectedConversation &&
                              (messageData.sender?.id === selectedConversation.userId ||
                                    messageData.receiver?.id === selectedConversation.userId)) {
                              setMessages(prev => [...prev, messageData]);
                              setTimeout(scrollToBottom, 100); // Cuộn xuống sau khi thêm tin nhắn
                        }

                        // Cập nhật lại số tin chưa đọc
                        fetchConversations();
                  });

                  // Lắng nghe thông báo thu hồi tin nhắn
                  stompClient.current.subscribe(`/topic/recall/${myId}`, (notification) => {
                        const recallData = JSON.parse(notification.body);
                        if (recallData.action === 'recalled') {
                              // Cập nhật tin nhắn đã bị thu hồi
                              setMessages(prev => prev.map(msg =>
                                    msg.id === recallData.messageId
                                          ? { ...msg, content: "Tin nhắn đã được thu hồi", recalled: true }
                                          : msg
                              ));
                        }
                  });
            });

            // Dọn dẹp khi unmount
            return () => {
                  if (stompClient.current) {
                        stompClient.current.disconnect();
                  }
            };
      }, [myId, selectedConversation, fetchConversations]);

      // Lấy tin nhắn giữa 2 user
      const fetchMessages = async (otherUserId) => {
            try {
                  const response = await fetch(`${API_URL}/api/messages/conversation/${myId}/${otherUserId}`);
                  if (response.ok) {
                        const data = await response.json();
                        setMessages(data);

                        // Gọi API đánh dấu đã đọc
                        await fetch(`${API_URL}/api/messages/mark-read/${otherUserId}/${myId}`, {
                              method: 'PUT'
                        });

                        fetchConversations(); // cập nhật lại danh sách
                        setTimeout(scrollToBottom, 200); // Cuộn xuống sau khi load tin nhắn
                  }
            } catch (error) {
                  console.error('Error fetching messages:', error);
            }
      };

      // Gửi tin nhắn mới
      const sendMessage = async () => {
            if (!newMessage.trim() || !selectedConversation) return;

            try {
                  const response = await fetch(`${API_URL}/api/messages/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              senderId: parseInt(myId),
                              receiverId: selectedConversation.userId,
                              content: newMessage
                        })
                  });

                  if (response.ok) {
                        setNewMessage("");
                        fetchMessages(selectedConversation.userId); // load lại tin nhắn
                        setTimeout(scrollToBottom, 100); // Cuộn xuống sau khi gửi
                  }
            } catch (error) {
                  console.error('Error sending message:', error);
            }
      };

      // Thu hồi tin nhắn
      const recallMessage = async (messageId) => {
            try {
                  const response = await fetch(`${API_URL}/api/messages/recall/${messageId}?userId=${myId}`, {
                        method: 'DELETE'
                  });

                  if (response.ok) {
                        // Cập nhật local state
                        setMessages(prev => prev.map(msg =>
                              msg.id === messageId
                                    ? { ...msg, content: "Tin nhắn đã được thu hồi", recalled: true }
                                    : msg
                        ));
                        setShowMessageOptions(null);
                        fetchConversations(); // Cập nhật lại danh sách cuộc trò chuyện
                  }
            } catch (error) {
                  console.error('Error recalling message:', error);
            }
      };

      // Lấy cuộc trò chuyện khi mở popup
      useEffect(() => {
            if (showChatPopup) {
                  fetchConversations();
            }
      }, [showChatPopup, fetchConversations]);

      // Lấy cuộc trò chuyện định kỳ mỗi 30 giây
      useEffect(() => {
            fetchConversations();
            const interval = setInterval(fetchConversations, 30000);
            return () => clearInterval(interval);
      }, [fetchConversations]);

      // Cuộn xuống khi có tin nhắn mới
      useEffect(() => {
            scrollToBottom();
      }, [messages]);

      // Ẩn message options khi click ra ngoài
      useEffect(() => {
            const handleClickOutside = () => {
                  setShowMessageOptions(null);
            };

            if (showMessageOptions) {
                  document.addEventListener('click', handleClickOutside);
                  return () => document.removeEventListener('click', handleClickOutside);
            }
      }, [showMessageOptions]);

      return (
            <>
                  {/* Nút tròn nổi góc trái */}
                  <div className="chat-bubble" onClick={() => setShowChatPopup(!showChatPopup)}>
                        <span className="chat-bubble-icon">💬</span>
                        {totalUnreadCount > 0 && (
                              <div className="chat-bubble-badge">
                                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                              </div>
                        )}
                  </div>

                  {/* Giao diện popup chat */}
                  {showChatPopup && (
                        <div className="chat-popup">
                              {/* Header */}
                              <div className="chat-popup-header">
                                    <h3>{selectedConversation ? selectedConversation.username : 'Tin nhắn'}</h3>
                                    <div className="chat-popup-actions">
                                          {selectedConversation && (
                                                <button onClick={() => setSelectedConversation(null)}>←</button>
                                          )}
                                          <button onClick={() => setShowChatPopup(false)}>×</button>
                                    </div>
                              </div>

                              {/* Nội dung */}
                              <div className="chat-popup-body">
                                    {/* Nếu chưa chọn người */}
                                    {!selectedConversation ? (
                                          <div className="chat-popup-list">
                                                {conversations.length > 0 ? (
                                                      conversations.map(conv => (
                                                            <div
                                                                  key={conv.userId}
                                                                  className={`chat-popup-item ${conv.unreadCount > 0 ? 'unread' : ''}`}
                                                                  onClick={() => {
                                                                        setSelectedConversation(conv);
                                                                        fetchMessages(conv.userId);
                                                                  }}
                                                            >
                                                                  <img
                                                                        src={conv.avatarUrl ? `${API_URL}${conv.avatarUrl}` : "/img/a1.jpeg"}
                                                                        alt="avatar"
                                                                        className="chat-avatar"
                                                                  />
                                                                  <div className="chat-item-text">
                                                                        <div className="chat-username">{conv.username}</div>
                                                                        <div className="chat-last-message">{conv.lastMessage}</div>
                                                                  </div>
                                                                  {conv.unreadCount > 0 && (
                                                                        <div className="chat-unread-badge">{conv.unreadCount}</div>
                                                                  )}
                                                            </div>
                                                      ))
                                                ) : (
                                                      <div className="chat-empty">Chưa có cuộc trò chuyện nào</div>
                                                )}
                                          </div>
                                    ) : (
                                          <>
                                                {/* Danh sách tin nhắn */}
                                                <div className="chat-popup-message">
                                                      {messages.map(msg => (
                                                            <div
                                                                  key={msg.id}
                                                                  className={`chat-message ${msg.sender?.id === parseInt(myId) ? 'me' : 'other'}`}
                                                            >
                                                                  <div
                                                                        className={`chat-message-content ${msg.recalled ? 'recalled' : ''}`}
                                                                        onContextMenu={(e) => {
                                                                              e.preventDefault();
                                                                              if (msg.sender?.id === parseInt(myId) && !msg.recalled) {
                                                                                    setShowMessageOptions(msg.id);
                                                                              }
                                                                        }}
                                                                        onClick={() => {
                                                                              if (msg.sender?.id === parseInt(myId) && !msg.recalled) {
                                                                                    setShowMessageOptions(showMessageOptions === msg.id ? null : msg.id);
                                                                              }
                                                                        }}
                                                                  >
                                                                        {msg.content}
                                                                        {showMessageOptions === msg.id && msg.sender?.id === parseInt(myId) && !msg.recalled && (
                                                                              <div className="message-options">
                                                                                    <button onClick={() => recallMessage(msg.id)}>
                                                                                          Thu hồi
                                                                                    </button>
                                                                              </div>
                                                                        )}
                                                                  </div>
                                                            </div>
                                                      ))}
                                                      {/* Phần tử để cuộn xuống */}
                                                      <div ref={messagesEndRef} />
                                                </div>

                                                {/* Ô nhập tin nhắn */}
                                                <div className="chat-popup-input">
                                                      <input
                                                            type="text"
                                                            value={newMessage}
                                                            onChange={(e) => setNewMessage(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                                            placeholder="Aa"
                                                      />
                                                      <button onClick={sendMessage} disabled={!newMessage.trim()}>
                                                            Gửi
                                                      </button>
                                                </div>
                                          </>
                                    )}
                              </div>
                        </div>
                  )}
            </>
      );
}

export default ChatBubble;
