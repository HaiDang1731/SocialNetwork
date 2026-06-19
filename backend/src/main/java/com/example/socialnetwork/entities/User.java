package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "users") // It's good practice to name tables in plural
@Data // Lombok annotation to generate getters, setters, toString, equals, and
      // hashCode
@NoArgsConstructor // Lombok annotation for no-args constructor
@AllArgsConstructor // Lombok annotation for all-args constructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class User {

      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @Column(nullable = false, unique = true, columnDefinition = "nvarchar(255)")
      private String username;

      @Column(nullable = false, unique = true)
      private String email;

      @Column(nullable = false)
      private String password; // Store hashed passwords, not plain text!

      @Column(name = "created_at", nullable = false, updatable = false)
      private LocalDateTime createdAt;

      @Column(name = "updated_at", nullable = false)
      private LocalDateTime updatedAt;

      @Enumerated(EnumType.STRING)
      @Column(nullable = false)
      private UserRole role = UserRole.USER;

      @Column(name = "verified", nullable = false)
      private boolean verified = false;

      @Column(name = "otp")
      private String otp;

      @Column(name = "otp_created_at")
      private java.time.LocalDateTime otpCreatedAt;

      // Thêm các trường mà frontend cần
      @Column(name = "avatar_url", columnDefinition = "nvarchar(255)")
      private String avatarUrl;

      @Column(name = "nickname", columnDefinition = "nvarchar(255)")
      private String nickname;

      @Column(name = "birthday")
      private LocalDate birthday;

      @Column(name = "gender", columnDefinition = "nvarchar(50)")
      private String gender;

      @Column(name = "from_location", columnDefinition = "nvarchar(255)")
      private String from;

      @Column(name = "lives_in", columnDefinition = "nvarchar(255)")
      private String livesIn;

      @Column(name = "interests", columnDefinition = "nvarchar(1000)")
      private String interests;

      @Column(name = "education", columnDefinition = "nvarchar(500)")
      private String education;

      // Automatically set createdAt and updatedAt before persisting
      @PrePersist
      protected void onCreate() {
            createdAt = LocalDateTime.now();
            updatedAt = LocalDateTime.now();
      }

      // Automatically update updatedAt before updating
      @PreUpdate
      protected void onUpdate() {
            updatedAt = LocalDateTime.now();
      }
}