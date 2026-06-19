package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
      List<Comment> findByPostId(Long postId);

      List<Comment> findByParentId(Long parentId);

      int countByPostId(Long postId);
}