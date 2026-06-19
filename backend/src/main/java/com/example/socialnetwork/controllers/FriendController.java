package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.Friend;
import com.example.socialnetwork.entities.Follow;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.FriendRepository;
import com.example.socialnetwork.repositories.FollowRepository;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/friends")
public class FriendController {
      @Autowired
      private FriendRepository friendRepo;
      @Autowired
      private UserRepository userRepo;
      @Autowired
      private FollowRepository followRepo;
      @Autowired
      private NotificationService notificationService;

      // Gửi lời mời kết bạn
      @PostMapping("/request")
      public ResponseEntity<?> sendFriendRequest(@RequestParam Long fromId, @RequestParam Long toId) {
            if (fromId.equals(toId))
                  return ResponseEntity.badRequest().body("Không thể kết bạn với chính mình");
            User from = userRepo.findById(fromId).orElse(null);
            User to = userRepo.findById(toId).orElse(null);
            if (from == null || to == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            Optional<Friend> f1 = friendRepo.findByUser1AndUser2(from, to);
            Optional<Friend> f2 = friendRepo.findByUser1AndUser2(to, from);

            if ((f1.isPresent() && ("pending".equals(f1.get().getStatus()) || "accepted".equals(f1.get().getStatus())))
                        || (f2.isPresent() && ("pending".equals(f2.get().getStatus())
                                    || "accepted".equals(f2.get().getStatus())))) {
                  return ResponseEntity.badRequest().body("Đã gửi lời mời hoặc đã là bạn bè");
            }
            Friend f = new Friend(null, from, to, "pending");
            friendRepo.save(f);

            // Tạo thông báo lời mời kết bạn
            notificationService.createFriendRequestNotification(from, to);

            return ResponseEntity.ok("Đã gửi lời mời kết bạn");
      }

      // Chấp nhận lời mời
      @PostMapping("/accept")
      public ResponseEntity<?> acceptFriend(@RequestParam Long fromId, @RequestParam Long toId) {
            User from = userRepo.findById(fromId).orElse(null);
            User to = userRepo.findById(toId).orElse(null);
            if (from == null || to == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            Optional<Friend> opt = friendRepo.findByUser1AndUser2(from, to);
            if (opt.isEmpty() || !"pending".equals(opt.get().getStatus()))
                  return ResponseEntity.badRequest().body("Không có lời mời kết bạn");
            Friend f = opt.get();
            f.setStatus("accepted");
            friendRepo.save(f);
            // Tự động follow 2 chiều
            if (followRepo.findByFollowerAndFollowing(from, to).isEmpty())
                  followRepo.save(new Follow(null, from, to));
            if (followRepo.findByFollowerAndFollowing(to, from).isEmpty())
                  followRepo.save(new Follow(null, to, from));

            // Tạo thông báo chấp nhận kết bạn
            notificationService.createFriendAcceptNotification(to, from);

            return ResponseEntity.ok("Đã chấp nhận kết bạn và tự động follow nhau");
      }

      // Từ chối lời mời
      @PostMapping("/decline")
      public ResponseEntity<?> declineFriend(@RequestParam Long fromId, @RequestParam Long toId) {
            User from = userRepo.findById(fromId).orElse(null);
            User to = userRepo.findById(toId).orElse(null);
            if (from == null || to == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            Optional<Friend> opt = friendRepo.findByUser1AndUser2(from, to);
            if (opt.isEmpty() || !"pending".equals(opt.get().getStatus()))
                  return ResponseEntity.badRequest().body("Không có lời mời kết bạn");
            Friend f = opt.get();
            f.setStatus("declined");
            friendRepo.save(f);
            return ResponseEntity.ok("Đã từ chối lời mời kết bạn");
      }

      // Danh sách bạn bè (đã accepted)
      @GetMapping("/{userId}")
      public ResponseEntity<?> getFriends(@PathVariable Long userId) {
            User user = userRepo.findById(userId).orElse(null);
            if (user == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            return ResponseEntity.ok(
                        friendRepo.findByUser1OrUser2AndStatus(user, user, "accepted"));
      }

      // Kiểm tra trạng thái kết bạn (API cũ để tương thích)
      @GetMapping("/status")
      public ResponseEntity<?> getFriendStatus(@RequestParam Long userId1, @RequestParam Long userId2) {
            User u1 = userRepo.findById(userId1).orElse(null);
            User u2 = userRepo.findById(userId2).orElse(null);
            if (u1 == null || u2 == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            Optional<Friend> f1 = friendRepo.findByUser1AndUser2(u1, u2);
            Optional<Friend> f2 = friendRepo.findByUser1AndUser2(u2, u1);
            if (f1.isPresent())
                  return ResponseEntity.ok(f1.get().getStatus());
            if (f2.isPresent())
                  return ResponseEntity.ok(f2.get().getStatus());
            return ResponseEntity.ok("none");
      }

      // Kiểm tra trạng thái kết bạn chi tiết (bao gồm hướng)
      @GetMapping("/detailed-status")
      public ResponseEntity<?> getDetailedFriendStatus(@RequestParam Long userId1, @RequestParam Long userId2) {
            User u1 = userRepo.findById(userId1).orElse(null);
            User u2 = userRepo.findById(userId2).orElse(null);
            if (u1 == null || u2 == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");

            // Kiểm tra user1 -> user2
            Optional<Friend> f1 = friendRepo.findByUser1AndUser2(u1, u2);
            if (f1.isPresent()) {
                  java.util.Map<String, Object> result = new java.util.HashMap<>();
                  result.put("status", f1.get().getStatus());
                  result.put("fromId", f1.get().getUser1().getId());
                  result.put("toId", f1.get().getUser2().getId());
                  result.put("isSender", true); // userId1 là người gửi
                  return ResponseEntity.ok(result);
            }

            // Kiểm tra user2 -> user1
            Optional<Friend> f2 = friendRepo.findByUser1AndUser2(u2, u1);
            if (f2.isPresent()) {
                  java.util.Map<String, Object> result = new java.util.HashMap<>();
                  result.put("status", f2.get().getStatus());
                  result.put("fromId", f2.get().getUser1().getId());
                  result.put("toId", f2.get().getUser2().getId());
                  result.put("isSender", false); // userId1 là người nhận
                  return ResponseEntity.ok(result);
            }

            // Không có quan hệ nào
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("status", "none");
            result.put("fromId", null);
            result.put("toId", null);
            result.put("isSender", false);
            return ResponseEntity.ok(result);
      }

      @DeleteMapping("/request")
      public ResponseEntity<?> unfriend(@RequestParam Long fromId, @RequestParam Long toId) {
            User from = userRepo.findById(fromId).orElse(null);
            User to = userRepo.findById(toId).orElse(null);
            if (from == null || to == null)
                  return ResponseEntity.badRequest().body("User không tồn tại");
            // Xóa cả 2 chiều nếu có
            Optional<Friend> f1 = friendRepo.findByUser1AndUser2(from, to);
            Optional<Friend> f2 = friendRepo.findByUser1AndUser2(to, from);
            boolean removed = false;
            if (f1.isPresent()) {
                  friendRepo.delete(f1.get());
                  removed = true;
            }
            if (f2.isPresent()) {
                  friendRepo.delete(f2.get());
                  removed = true;
            }
            if (removed) {
                  return ResponseEntity.ok("Đã hủy kết bạn");
            } else {
                  return ResponseEntity.badRequest().body("Không phải bạn bè");
            }
      }
}
