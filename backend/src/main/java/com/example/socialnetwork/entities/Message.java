package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
      private String content;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "sender_id", nullable = false)
      @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
      private User sender;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "receiver_id", nullable = false)
      @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
      private User receiver;

      @Column(name = "created_at", nullable = false, updatable = false)
      private LocalDateTime createdAt;

      @Column(name = "is_read", nullable = false)
      private boolean isRead = false;

      @Column(name = "is_recalled", nullable = false)
      private boolean recalled = false;

      @PrePersist
      protected void onCreate() {
            createdAt = LocalDateTime.now();
      }
}