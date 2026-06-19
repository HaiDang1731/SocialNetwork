package com.example.socialnetwork.controllers;

import com.example.socialnetwork.dto.ConversationInfo;
import com.example.socialnetwork.dto.MessageRecallNotification;
import com.example.socialnetwork.dto.MessageRequest;
import com.example.socialnetwork.entities.Message;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.MessageRepository;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.repositories.FriendRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(originPatterns = "http://localhost:3000", allowCredentials = "true")
public class MessageController {

      @Autowired
      private MessageRepository messageRepository;

      @Autowired
      private UserRepository userRepository;

      @Autowired
      private FriendRepository friendRepository;

      @Autowired
      private SimpMessagingTemplate messagingTemplate;

      // Gửi tin nhắn
      @PostMapping("/send")
      public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request) {
            try {
                  Optional<User> senderOpt = userRepository.findById(request.getSenderId());
                  Optional<User> receiverOpt = userRepository.findById(request.getReceiverId());

                  if (senderOpt.isEmpty() || receiverOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body("User không tồn tại");
                  }

                  User sender = senderOpt.get();
                  User receiver = receiverOpt.get();

                  // Kiểm tra xem 2 user có phải bạn bè không
                  boolean areFriends = friendRepository.findAcceptedFriendsByUserId(sender.getId())
                              .stream()
                              .anyMatch(friend -> friend.getUser1().getId().equals(receiver.getId()) ||
                                          friend.getUser2().getId().equals(receiver.getId()));

                  if (!areFriends) {
                        return ResponseEntity.badRequest().body("Chỉ có thể nhắn tin với bạn bè");
                  }

                  Message message = new Message();
                  message.setContent(request.getContent());
                  message.setSender(sender);
                  message.setReceiver(receiver);
                  message.setRead(false);

                  Message savedMessage = messageRepository.save(message);

                  // Gửi tin nhắn real-time qua WebSocket
                  messagingTemplate.convertAndSend("/topic/messages/" + receiver.getId(), savedMessage);

                  return ResponseEntity.ok(savedMessage);

            } catch (Exception e) {
                  return ResponseEntity.badRequest().body("Lỗi gửi tin nhắn: " + e.getMessage());
            }
      }

      // Lấy tin nhắn giữa 2 user
      @GetMapping("/conversation/{userId1}/{userId2}")
      public ResponseEntity<?> getConversation(@PathVariable Long userId1, @PathVariable Long userId2) {
            try {
                  List<Message> messages = messageRepository.findMessagesBetweenUsers(userId1, userId2);
                  return ResponseEntity.ok(messages);
            } catch (Exception e) {
                  return ResponseEntity.badRequest().body("Lỗi lấy tin nhắn: " + e.getMessage());
            }
      }

      // Đánh dấu tin nhắn đã đọc
      @PutMapping("/mark-read/{senderId}/{receiverId}")
      public ResponseEntity<?> markMessagesAsRead(@PathVariable Long senderId, @PathVariable Long receiverId) {
            try {
                  List<Message> unreadMessages = messageRepository.findMessagesBetweenUsers(senderId, receiverId)
                              .stream()
                              .filter(m -> m.getReceiver().getId().equals(receiverId) && !m.isRead())
                              .toList();

                  unreadMessages.forEach(m -> m.setRead(true));
                  messageRepository.saveAll(unreadMessages);

                  return ResponseEntity.ok("Đã đánh dấu đọc");
            } catch (Exception e) {
                  return ResponseEntity.badRequest().body("Lỗi đánh dấu đọc: " + e.getMessage());
            }
      }

      // Lấy số tin nhắn chưa đọc
      @GetMapping("/unread-count/{userId}")
      public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
            long count = messageRepository.countUnreadMessages(userId);
            return ResponseEntity.ok(count);
      }

      // Thu hồi tin nhắn
      @DeleteMapping("/recall/{messageId}")
      public ResponseEntity<?> recallMessage(@PathVariable Long messageId, @RequestParam Long userId) {
            try {
                  Optional<Message> messageOpt = messageRepository.findById(messageId);
                  if (messageOpt.isEmpty()) {
                        return ResponseEntity.notFound().build();
                  }

                  Message message = messageOpt.get();

                  // Chỉ người gửi mới có thể thu hồi tin nhắn
                  if (!message.getSender().getId().equals(userId)) {
                        return ResponseEntity.badRequest().body("Chỉ có thể thu hồi tin nhắn của chính mình");
                  }

                  // Kiểm tra thời gian (ví dụ: chỉ cho phép thu hồi trong 24 giờ)
                  if (message.getCreatedAt().isBefore(java.time.LocalDateTime.now().minusHours(24))) {
                        return ResponseEntity.badRequest().body("Chỉ có thể thu hồi tin nhắn trong vòng 24 giờ");
                  }

                  // Đánh dấu tin nhắn đã bị thu hồi thay vì xóa hoàn toàn
                  message.setContent("[Tin nhắn đã được thu hồi]");
                  message.setRecalled(true);
                  messageRepository.save(message);

                  // Thông báo real-time cho người nhận
                  messagingTemplate.convertAndSend("/topic/messages/" + message.getReceiver().getId(),
                              new MessageRecallNotification(messageId, "recalled"));

                  return ResponseEntity.ok("Đã thu hồi tin nhắn");

            } catch (Exception e) {
                  return ResponseEntity.badRequest().body("Lỗi thu hồi tin nhắn: " + e.getMessage());
            }
      }

      // Xóa hoàn toàn tin nhắn (chỉ dành cho admin hoặc trường hợp đặc biệt)
      @DeleteMapping("/delete/{messageId}")
      public ResponseEntity<?> deleteMessage(@PathVariable Long messageId, @RequestParam Long userId) {
            try {
                  Optional<Message> messageOpt = messageRepository.findById(messageId);
                  if (messageOpt.isEmpty()) {
                        return ResponseEntity.notFound().build();
                  }

                  Message message = messageOpt.get();

                  // Chỉ người gửi hoặc người nhận mới có thể xóa tin nhắn khỏi cuộc trò chuyện
                  // của họ
                  if (!message.getSender().getId().equals(userId) && !message.getReceiver().getId().equals(userId)) {
                        return ResponseEntity.badRequest().body("Không có quyền xóa tin nhắn này");
                  }

                  messageRepository.deleteById(messageId);

                  // Thông báo real-time
                  messagingTemplate.convertAndSend("/topic/messages/" + message.getReceiver().getId(),
                              new MessageRecallNotification(messageId, "deleted"));
                  messagingTemplate.convertAndSend("/topic/messages/" + message.getSender().getId(),
                              new MessageRecallNotification(messageId, "deleted"));

                  return ResponseEntity.ok("Đã xóa tin nhắn");

            } catch (Exception e) {
                  return ResponseEntity.badRequest().body("Lỗi xóa tin nhắn: " + e.getMessage());
            }
      }

      // Lấy danh sách cuộc trò chuyện với tin nhắn chưa đọc
      @GetMapping("/conversations/{userId}")
      public ResponseEntity<?> getConversations(@PathVariable Long userId) {
            try {
                  Optional<User> userOpt = userRepository.findById(userId);
                  if (userOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body("User không tồn tại");
                  }

                  List<Message> allMessages = messageRepository.findMessagesForUser(userId);
                  java.util.Map<Long, ConversationInfo> conversations = new java.util.LinkedHashMap<>();

                  for (Message msg : allMessages) {
                        Long otherUserId = msg.getSender().getId().equals(userId) ? msg.getReceiver().getId()
                                    : msg.getSender().getId();

                        if (!conversations.containsKey(otherUserId) ||
                                    conversations.get(otherUserId).getLastMessageTime().isBefore(msg.getCreatedAt())) {
                              User otherUser = msg.getSender().getId().equals(userId) ? msg.getReceiver()
                                          : msg.getSender();
                              conversations.put(otherUserId, new ConversationInfo(
                                          otherUser.getId(),
                                          otherUser.getUsername(),
                                          otherUser.getAvatarUrl(),
                                          msg.getContent(),
                                          msg.getCreatedAt(),
                                          0));
                        }
                  }

                  // Đếm tin nhắn chưa đọc cho mỗi cuộc trò chuyện
                  for (ConversationInfo conv : conversations.values()) {
                        long unreadCount = messageRepository.countUnreadMessagesBetweenUsers(conv.getUserId(), userId);
                        conv.setUnreadCount((int) unreadCount);
                  }

                  return ResponseEntity.ok(conversations.values());

            } catch (Exception e) {
                  return ResponseEntity.badRequest().body("Lỗi lấy danh sách cuộc trò chuyện: " + e.getMessage());
            }
      }
}