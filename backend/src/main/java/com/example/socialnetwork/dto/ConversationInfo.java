package com.example.socialnetwork.dto;

import java.time.LocalDateTime;

public class ConversationInfo {
      private Long userId;
      private String username;
      private String avatarUrl;
      private String lastMessage;
      private LocalDateTime lastMessageTime;
      private int unreadCount;

      // Constructors
      public ConversationInfo() {
      }

      public ConversationInfo(Long userId, String username, String avatarUrl, String lastMessage,
                  LocalDateTime lastMessageTime, int unreadCount) {
            this.userId = userId;
            this.username = username;
            this.avatarUrl = avatarUrl;
            this.lastMessage = lastMessage;
            this.lastMessageTime = lastMessageTime;
            this.unreadCount = unreadCount;
      }

      // Getters and setters
      public Long getUserId() {
            return userId;
      }

      public void setUserId(Long userId) {
            this.userId = userId;
      }

      public String getUsername() {
            return username;
      }

      public void setUsername(String username) {
            this.username = username;
      }

      public String getAvatarUrl() {
            return avatarUrl;
      }

      public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
      }

      public String getLastMessage() {
            return lastMessage;
      }

      public void setLastMessage(String lastMessage) {
            this.lastMessage = lastMessage;
      }

      public LocalDateTime getLastMessageTime() {
            return lastMessageTime;
      }

      public void setLastMessageTime(LocalDateTime lastMessageTime) {
            this.lastMessageTime = lastMessageTime;
      }

      public int getUnreadCount() {
            return unreadCount;
      }

      public void setUnreadCount(int unreadCount) {
            this.unreadCount = unreadCount;
      }
}