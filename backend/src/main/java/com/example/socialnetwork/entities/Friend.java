package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "friends", uniqueConstraints = @UniqueConstraint(columnNames = { "user1_id", "user2_id" }))
public class Friend {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      // Người gửi lời mời
      @ManyToOne
      @JoinColumn(name = "user1_id")
      private User user1;

      // Người nhận lời mời
      @ManyToOne
      @JoinColumn(name = "user2_id")
      private User user2;

      // pending, accepted, declined
      private String status;
}
