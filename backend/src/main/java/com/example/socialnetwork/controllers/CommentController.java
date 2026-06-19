package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.Comment;
import com.example.socialnetwork.entities.Post;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.CommentRepository;
import com.example.socialnetwork.repositories.PostRepository;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
      @Autowired
      private CommentRepository commentRepository;
      @Autowired
      private PostRepository postRepository;
      @Autowired
      private UserRepository userRepository;
      @Autowired
      private NotificationService notificationService;

      // Lấy tất cả comment của một post
      @GetMapping("/post/{postId}")
      public List<Comment> getCommentsByPost(@PathVariable Long postId) {
            return commentRepository.findByPostId(postId);
      }

      // Lấy tổng số comment của một post
      @GetMapping("/post/{postId}/count")
      public int countCommentsByPost(@PathVariable Long postId) {
            return commentRepository.countByPostId(postId);
      }

      // Lấy tất cả reply của một comment
      @GetMapping("/parent/{parentId}")
      public List<Comment> getRepliesByParent(@PathVariable Long parentId) {
            return commentRepository.findByParentId(parentId);
      }

      // Tạo comment mới (có thể là reply)
      @PostMapping
      public ResponseEntity<Comment> createComment(@RequestBody Comment comment) {
            // Kiểm tra user và post tồn tại
            if (comment.getUser() == null || comment.getUser().getId() == null ||
                        comment.getPost() == null || comment.getPost().getId() == null) {
                  return ResponseEntity.badRequest().build();
            }
            Optional<User> user = userRepository.findById(comment.getUser().getId());
            Optional<Post> post = postRepository.findById(comment.getPost().getId());
            if (user.isEmpty() || post.isEmpty()) {
                  return ResponseEntity.badRequest().build();
            }
            comment.setUser(user.get());
            comment.setPost(post.get());
            // Nếu có parent thì kiểm tra parent tồn tại
            if (comment.getParent() != null && comment.getParent().getId() != null) {
                  Optional<Comment> parent = commentRepository.findById(comment.getParent().getId());
                  if (parent.isEmpty()) {
                        return ResponseEntity.badRequest().build();
                  }
                  comment.setParent(parent.get());
            } else {
                  comment.setParent(null);
            }
            Comment savedComment = commentRepository.save(comment);

            // Tạo thông báo comment
            notificationService.createCommentNotification(user.get(), post.get(), savedComment);

            return ResponseEntity.ok(savedComment);
      }

      // Xóa comment (và tất cả replies nếu là parent comment)
      @DeleteMapping("/{id}")
      public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
            if (!commentRepository.existsById(id)) {
                  return ResponseEntity.notFound().build();
            }

            // Tìm và xóa tất cả replies của comment này trước
            List<Comment> replies = commentRepository.findByParentId(id);
            for (Comment reply : replies) {
                  commentRepository.deleteById(reply.getId());
            }

            // Sau đó xóa comment gốc
            commentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
      }

      @PutMapping("/{id}")
      public ResponseEntity<Comment> updateComment(@PathVariable Long id, @RequestBody Comment comment) {
            Optional<Comment> existing = commentRepository.findById(id);
            if (existing.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            Comment c = existing.get();
            c.setContent(comment.getContent());
            c.setUpdatedAt(LocalDateTime.now());
            Comment updated = commentRepository.save(c);
            return ResponseEntity.ok(updated);
      }
}