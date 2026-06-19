package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.Friend;
import com.example.socialnetwork.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRepository extends JpaRepository<Friend, Long> {
      List<Friend> findByUser1OrUser2AndStatus(User user1, User user2, String status);

      Optional<Friend> findByUser1AndUser2(User user1, User user2);

      List<Friend> findByUser1OrUser2(User user1, User user2);

      @Query("SELECT f FROM Friend f WHERE (f.user1 = :user1 AND f.status = :status) OR (f.user2 = :user1 AND f.status = :status)")
      List<Friend> findAcceptedFriends(@Param("user1") User user1, @Param("status") String status);

      List<Friend> findByUser2AndStatus(User user2, String status);

      @Query("SELECT f FROM Friend f WHERE (f.user1.id = :userId OR f.user2.id = :userId) AND f.status = 'accepted'")
      List<Friend> findAcceptedFriendsByUserId(Long userId);
}
