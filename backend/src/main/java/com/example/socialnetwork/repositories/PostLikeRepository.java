package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
      Optional<PostLike> findByUserIdAndPostId(Long userId, Long postId);

      int countByPostId(Long postId);
}