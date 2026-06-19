package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "comment_likes", uniqueConstraints = { @UniqueConstraint(columnNames = { "user_id", "comment_id" }) })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentLike {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "user_id", nullable = false)
      private User user;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "comment_id", nullable = false)
      private Comment comment;

      @Column(name = "created_at", nullable = false, updatable = false)
      private LocalDateTime createdAt;

      @PrePersist
      protected void onCreate() {
            createdAt = LocalDateTime.now();
      }
}