package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
      Optional<CommentLike> findByUserIdAndCommentId(Long userId, Long commentId);

      int countByCommentId(Long commentId);
}