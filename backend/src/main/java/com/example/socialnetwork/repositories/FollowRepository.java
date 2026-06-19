package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.Follow;
import com.example.socialnetwork.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
      List<Follow> findByFollower(User follower);

      List<Follow> findByFollowing(User following);

      Optional<Follow> findByFollowerAndFollowing(User follower, User following);
}
