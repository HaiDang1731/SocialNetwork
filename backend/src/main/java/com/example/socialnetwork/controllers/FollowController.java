package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.Follow;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.FollowRepository;
import com.example.socialnetwork.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/follows")
public class FollowController {
      @Autowired
      private FollowRepository followRepo;
      @Autowired
      private UserRepository userRepo;

      // Theo dõi
      @PostMapping
      public ResponseEntity<?> follow(@RequestParam Long followerId, @RequestParam Long followingId) {
            if (followerId.equals(followingId))
                  return ResponseEntity.badRequest().body("Không thể tự theo dõi chính mình");
            User follower = userRepo.findById(followerId).orElse(null);
            User following = userRepo.findById(followingId).orElse(null);
            if (follower == null || following == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            if (followRepo.findByFollowerAndFollowing(follower, following).isPresent())
                  return ResponseEntity.badRequest().body("Đã theo dõi rồi");
            followRepo.save(new Follow(null, follower, following));
            return ResponseEntity.ok("Đã theo dõi");
      }

      // Bỏ theo dõi
      @DeleteMapping
      public ResponseEntity<?> unfollow(@RequestParam Long followerId, @RequestParam Long followingId) {
            User follower = userRepo.findById(followerId).orElse(null);
            User following = userRepo.findById(followingId).orElse(null);
            if (follower == null || following == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            var opt = followRepo.findByFollowerAndFollowing(follower, following);
            if (opt.isEmpty())
                  return ResponseEntity.badRequest().body("Chưa theo dõi");
            followRepo.delete(opt.get());
            return ResponseEntity.ok("Đã bỏ theo dõi");
      }

      // Danh sách đang theo dõi
      @GetMapping("/following/{userId}")
      public ResponseEntity<?> getFollowing(@PathVariable Long userId) {
            User user = userRepo.findById(userId).orElse(null);
            if (user == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            return ResponseEntity.ok(followRepo.findByFollower(user));
      }

      // Danh sách follower
      @GetMapping("/followers/{userId}")
      public ResponseEntity<?> getFollowers(@PathVariable Long userId) {
            User user = userRepo.findById(userId).orElse(null);
            if (user == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            return ResponseEntity.ok(followRepo.findByFollowing(user));
      }
}
