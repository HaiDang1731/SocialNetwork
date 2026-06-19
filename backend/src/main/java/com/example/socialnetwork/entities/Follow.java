package com.example.socialnetwork.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "follows", uniqueConstraints = @UniqueConstraint(columnNames = { "follower_id", "following_id" }))
public class Follow {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      // Người theo dõi
      @ManyToOne
      @JoinColumn(name = "follower_id")
      private User follower;

      // Người được theo dõi
      @ManyToOne
      @JoinColumn(name = "following_id")
      private User following;
}
