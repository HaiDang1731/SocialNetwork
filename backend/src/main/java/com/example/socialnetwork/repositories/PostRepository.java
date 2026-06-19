package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
      List<Post> findByUserId(Long userId);

      long countByUserId(Long userId);
}