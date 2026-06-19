package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.CommentLike;
import com.example.socialnetwork.entities.Comment;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.CommentLikeRepository;
import com.example.socialnetwork.repositories.CommentRepository;
import com.example.socialnetwork.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/comment-likes")
public class CommentLikeController {
      @Autowired
      private CommentLikeRepository commentLikeRepository;
      @Autowired
      private CommentRepository commentRepository;
      @Autowired
      private UserRepository userRepository;
      @Autowired
      private SimpMessagingTemplate messagingTemplate;

      // Like comment
      @PostMapping
      public ResponseEntity<CommentLike> likeComment(@RequestParam Long userId, @RequestParam Long commentId) {
            Optional<CommentLike> existing = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);
            if (existing.isPresent()) {
                  return ResponseEntity.badRequest().build(); // Đã like rồi
            }
            Optional<User> user = userRepository.findById(userId);
            Optional<Comment> comment = commentRepository.findById(commentId);
            if (user.isEmpty() || comment.isEmpty()) {
                  return ResponseEntity.badRequest().build();
            }
            CommentLike like = new CommentLike();
            like.setUser(user.get());
            like.setComment(comment.get());
            CommentLike saved = commentLikeRepository.save(like);
            // Gửi event WebSocket
            messagingTemplate.convertAndSend("/topic/comment-likes", saved);
            return ResponseEntity.ok(saved);
      }

      // Unlike comment
      @DeleteMapping
      public ResponseEntity<Void> unlikeComment(@RequestParam Long userId, @RequestParam Long commentId) {
            Optional<CommentLike> existing = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);
            if (existing.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            commentLikeRepository.delete(existing.get());
            // Gửi event WebSocket (có thể gửi thông tin unlike)
            messagingTemplate.convertAndSend("/topic/comment-likes", "unlike:" + userId + ":" + commentId);
            return ResponseEntity.noContent().build();
      }

      // Đếm số like của comment
      @GetMapping("/count")
      public int countLikes(@RequestParam Long commentId) {
            return commentLikeRepository.countByCommentId(commentId);
      }
}