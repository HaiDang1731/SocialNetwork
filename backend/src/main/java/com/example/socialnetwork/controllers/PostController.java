package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.Post;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.PostRepository;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
public class PostController {
      @Autowired
      private PostRepository postRepository;
      @Autowired
      private UserRepository userRepository;
      @Autowired
      private NotificationService notificationService;

      @GetMapping
      public List<Post> getAllPosts() {
            return postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
      }

      // Lấy bài viết theo id
      @GetMapping("/{id}")
      public ResponseEntity<Post> getPostById(@PathVariable Long id) {
            Optional<Post> post = postRepository.findById(id);
            return post.map(ResponseEntity::ok)
                        .orElseGet(() -> ResponseEntity.notFound().build());
      }

      // Tạo bài viết mới
      @PostMapping
      public ResponseEntity<Post> createPost(@RequestBody Post post) {
            // Đảm bảo user tồn tại
            if (post.getUser() == null || post.getUser().getId() == null) {
                  return ResponseEntity.badRequest().build();
            }
            Optional<User> user = userRepository.findById(post.getUser().getId());
            if (user.isEmpty()) {
                  return ResponseEntity.badRequest().build();
            }
            post.setUser(user.get());
            // Đảm bảo privacy hợp lệ
            if (post.getPrivacy() == null || !(post.getPrivacy().equals("public") || post.getPrivacy().equals("friends")
                        || post.getPrivacy().equals("private"))) {
                  post.setPrivacy("public");
            }
            Post savedPost = postRepository.save(post);

            // Tạo thông báo cho bạn bè
            notificationService.createNewPostNotification(savedPost);

            return ResponseEntity.ok(savedPost);
      }

      // Cập nhật bài viết
      @PutMapping("/{id}")
      public ResponseEntity<Post> updatePost(@PathVariable Long id, @RequestBody Post postDetails) {
            Optional<Post> optionalPost = postRepository.findById(id);
            if (optionalPost.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            Post post = optionalPost.get();
            post.setContent(postDetails.getContent());
            post.setImageUrls(postDetails.getImageUrls());
            post.setVideoUrls(postDetails.getVideoUrls());
            // Cập nhật privacy nếu có
            if (postDetails.getPrivacy() != null && (postDetails.getPrivacy().equals("public")
                        || postDetails.getPrivacy().equals("friends") || postDetails.getPrivacy().equals("private"))) {
                  post.setPrivacy(postDetails.getPrivacy());
            }
            Post updatedPost = postRepository.save(post);
            return ResponseEntity.ok(updatedPost);
      }

      // Xóa bài viết
      @DeleteMapping("/{id}")
      public ResponseEntity<Void> deletePost(@PathVariable Long id) {
            if (!postRepository.existsById(id)) {
                  return ResponseEntity.notFound().build();
            }
            postRepository.deleteById(id);
            return ResponseEntity.noContent().build();
      }

      // Lấy tất cả bài viết của 1 user
      @GetMapping("/user/{userId}")
      public List<Post> getPostsByUser(@PathVariable Long userId) {
            return postRepository.findByUserId(userId);
      }

      // Lấy số lượng bài viết của 1 user
      @GetMapping("/user/{userId}/count")
      public ResponseEntity<Integer> getPostCountByUser(@PathVariable Long userId) {
            Optional<User> user = userRepository.findById(userId);
            if (user.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            int postCount = (int) postRepository.countByUserId(userId);
            return ResponseEntity.ok(postCount);
      }
}