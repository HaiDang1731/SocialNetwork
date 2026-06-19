package com.example.socialnetwork.dto;

public class MessageRequest {
      private Long senderId;
      private Long receiverId;
      private String content;

      // Constructors
      public MessageRequest() {
      }

      public MessageRequest(Long senderId, Long receiverId, String content) {
            this.senderId = senderId;
            this.receiverId = receiverId;
            this.content = content;
      }

      // Getters and setters
      public Long getSenderId() {
            return senderId;
      }

      public void setSenderId(Long senderId) {
            this.senderId = senderId;
      }

      public Long getReceiverId() {
            return receiverId;
      }

      public void setReceiverId(Long receiverId) {
            this.receiverId = receiverId;
      }

      public String getContent() {
            return content;
      }

      public void setContent(String content) {
            this.content = content;
      }
}