package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.Notification;
import com.example.socialnetwork.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

      @Autowired
      private NotificationService notificationService;

      // Lấy tất cả thông báo của user
      @GetMapping("/user/{userId}")
      public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
            List<Notification> notifications = notificationService.getUserNotifications(userId);
            return ResponseEntity.ok(notifications);
      }

      // Lấy thông báo chưa đọc
      @GetMapping("/user/{userId}/unread")
      public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
            List<Notification> notifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(notifications);
      }

      // Lấy số lượng thông báo chưa đọc
      @GetMapping("/user/{userId}/unread-count")
      public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long userId) {
            long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
      }

      // Đánh dấu thông báo đã đọc
      @PutMapping("/{notificationId}/read")
      public ResponseEntity<?> markAsRead(@PathVariable Long notificationId) {
            notificationService.markAsRead(notificationId);
            return ResponseEntity.ok().build();
      }

      // Đánh dấu tất cả thông báo đã đọc
      @PutMapping("/user/{userId}/read-all")
      public ResponseEntity<?> markAllAsRead(@PathVariable Long userId) {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok().build();
      }
}