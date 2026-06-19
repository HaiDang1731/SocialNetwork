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
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {
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
      @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
      private User user;

      @ElementCollection
      private java.util.List<String> imageUrls;

      @ElementCollection
      private java.util.List<String> videoUrls;

      @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
      @JsonIgnoreProperties({ "post", "user", "parent", "replies", "hibernateLazyInitializer", "handler" })
      private List<Comment> comments = new ArrayList<>();

      @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
      @JsonIgnoreProperties({ "post", "user", "hibernateLazyInitializer", "handler" })
      private List<PostLike> likes = new ArrayList<>();

      @Column(nullable = false)
      private String privacy = "public";// "public", "friends", "private"

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