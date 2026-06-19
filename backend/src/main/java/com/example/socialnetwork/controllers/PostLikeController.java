package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.PostLike;
import com.example.socialnetwork.entities.Post;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.PostLikeRepository;
import com.example.socialnetwork.repositories.PostRepository;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/post-likes")
public class PostLikeController {
      @Autowired
      private PostLikeRepository postLikeRepository;
      @Autowired
      private PostRepository postRepository;
      @Autowired
      private UserRepository userRepository;
      @Autowired
      private NotificationService notificationService;

      static class PostLikeRequest {
            public Long userId;
            public Long postId;
            public String emoji;
      }

      // Like post
      @PostMapping
      public ResponseEntity<PostLike> likePost(@RequestBody PostLikeRequest req) {
            Optional<PostLike> existing = postLikeRepository.findByUserIdAndPostId(req.userId, req.postId);
            if (existing.isPresent()) {
                  return ResponseEntity.badRequest().build(); // Đã like rồi
            }
            Optional<User> user = userRepository.findById(req.userId);
            Optional<Post> post = postRepository.findById(req.postId);
            if (user.isEmpty() || post.isEmpty()) {
                  return ResponseEntity.badRequest().build();
            }
            PostLike like = new PostLike();
            like.setUser(user.get());
            like.setPost(post.get());
            like.setEmoji(req.emoji);
            PostLike saved = postLikeRepository.save(like);

            // Tạo thông báo like
            notificationService.createLikeNotification(user.get(), post.get());

            return ResponseEntity.ok(saved);
      }

      // Unlike post
      @DeleteMapping
      public ResponseEntity<Void> unlikePost(@RequestBody PostLikeRequest req) {
            Optional<PostLike> existing = postLikeRepository.findByUserIdAndPostId(req.userId, req.postId);
            if (existing.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            postLikeRepository.delete(existing.get());
            return ResponseEntity.noContent().build();
      }

      // Đếm số like của post
      @GetMapping("/count")
      public int countLikes(@RequestParam Long postId) {
            return postLikeRepository.countByPostId(postId);
      }

      @GetMapping
      public List<PostLike> getAllLikes() {
            return postLikeRepository.findAll();
      }

      @PutMapping
      public ResponseEntity<PostLike> updateLike(@RequestBody PostLikeRequest req) {
            Optional<PostLike> existing = postLikeRepository.findByUserIdAndPostId(req.userId, req.postId);
            if (existing.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            PostLike like = existing.get();
            like.setEmoji(req.emoji);
            PostLike saved = postLikeRepository.save(like);
            return ResponseEntity.ok(saved);
      }
}