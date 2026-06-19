package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
      private String content;

      @Column(name = "created_at", nullable = false, updatable = false)
      private LocalDateTime createdAt;

      @Column(name = "updated_at", nullable = false)
      private LocalDateTime updatedAt;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "user_id", nullable = false)
      @JsonIgnoreProperties({ "posts", "hibernateLazyInitializer", "handler" })
      private User user;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "post_id", nullable = false)
      @JsonIgnoreProperties({ "likes", "user", "hibernateLazyInitializer", "handler" })
      private Post post;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "parent_id")
      @JsonIgnoreProperties({ "user", "post", "parent", "hibernateLazyInitializer", "handler" })
      private Comment parent;

      @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
      @JsonIgnoreProperties({ "parent", "user", "post", "replies", "hibernateLazyInitializer", "handler" })
      private List<Comment> replies = new ArrayList<>();

      @PrePersist
      protected void onCreate() {
            createdAt = LocalDateTime.now();
            updatedAt = LocalDateTime.now();
      }

      @PreUpdate
      protected void onUpdate() {
            updatedAt = LocalDateTime.now();
      }
}