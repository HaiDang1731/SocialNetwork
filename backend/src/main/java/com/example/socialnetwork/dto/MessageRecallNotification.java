package com.example.socialnetwork.dto;

public class MessageRecallNotification {
      private Long messageId;
      private String action;

      // Constructors
      public MessageRecallNotification() {
      }

      public MessageRecallNotification(Long messageId, String action) {
            this.messageId = messageId;
            this.action = action;
      }

      // Getters and setters
      public Long getMessageId() {
            return messageId;
      }

      public void setMessageId(Long messageId) {
            this.messageId = messageId;
      }

      public String getAction() {
            return action;
      }

      public void setAction(String action) {
            this.action = action;
      }
}