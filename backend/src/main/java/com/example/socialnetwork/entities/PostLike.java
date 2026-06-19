package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "post_likes", uniqueConstraints = { @UniqueConstraint(columnNames = { "user_id", "post_id" }) })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostLike {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "user_id", nullable = false)
      @JsonIgnoreProperties({ "posts", "hibernateLazyInitializer", "handler" })
      private User user;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "post_id", nullable = false)
      @JsonIgnoreProperties({ "likes", "user", "hibernateLazyInitializer", "handler" })
      private Post post;

      @Column(name = "created_at", nullable = false, updatable = false)
      private LocalDateTime createdAt;

      @Column(name = "emoji", nullable = false)
      private String emoji = "like"; // like, love, haha, wow, sad, angry

      @PrePersist
      protected void onCreate() {
            createdAt = LocalDateTime.now();
      }
}