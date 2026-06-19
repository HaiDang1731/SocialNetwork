package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "user_id")
      private User user; // Người nhận thông báo

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "from_user_id")
      private User fromUser; // Người tạo thông báo

      @Column(nullable = false)
      private String type; // "POST", "LIKE", "COMMENT", "FRIEND_REQUEST", "FRIEND_ACCEPT"

      @Column(nullable = false, columnDefinition = "NVARCHAR(500)")
      private String content; // Nội dung thông báo

      @Column(name = "related_post_id")
      private Long relatedPostId; // ID bài viết liên quan (nếu có)

      @Column(name = "related_comment_id")
      private Long relatedCommentId; // ID comment liên quan (nếu có)

      @Column(name = "is_read")
      private boolean isRead = false; // Đã đọc chưa

      @Column(name = "created_at")
      private LocalDateTime createdAt;

      @PrePersist
      protected void onCreate() {
            createdAt = LocalDateTime.now();
      }

      // Constructors
      public Notification() {
      }

      public Notification(User user, User fromUser, String type, String content) {
            this.user = user;
            this.fromUser = fromUser;
            this.type = type;
            this.content = content;
      }

      // Getters and Setters
      public Long getId() {
            return id;
      }

      public void setId(Long id) {
            this.id = id;
      }

      public User getUser() {
            return user;
      }

      public void setUser(User user) {
            this.user = user;
      }

      public User getFromUser() {
            return fromUser;
      }

      public void setFromUser(User fromUser) {
            this.fromUser = fromUser;
      }

      public String getType() {
            return type;
      }

      public void setType(String type) {
            this.type = type;
      }

      public String getContent() {
            return content;
      }

      public void setContent(String content) {
            this.content = content;
      }

      public Long getRelatedPostId() {
            return relatedPostId;
      }

      public void setRelatedPostId(Long relatedPostId) {
            this.relatedPostId = relatedPostId;
      }

      public Long getRelatedCommentId() {
            return relatedCommentId;
      }

      public void setRelatedCommentId(Long relatedCommentId) {
            this.relatedCommentId = relatedCommentId;
      }

      public boolean isRead() {
            return isRead;
      }

      public void setRead(boolean read) {
            isRead = read;
      }

      public LocalDateTime getCreatedAt() {
            return createdAt;
      }

      public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
      }
}