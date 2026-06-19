package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.repositories.FriendRepository;
import com.example.socialnetwork.entities.Friend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/users")
public class UserController {
      @Autowired
      private UserRepository userRepository;
      @Autowired
      private FriendRepository friendRepository;

      // Lấy danh sách tất cả user
      @GetMapping
      public List<User> getAllUsers() {
            return userRepository.findAll();
      }

      // Tìm kiếm user theo username
      @GetMapping("/search")
      public List<User> searchUsers(@RequestParam String query) {
            if (query == null || query.trim().isEmpty()) {
                  return new ArrayList<>();
            }

            List<User> results = userRepository.findAll().stream()
                        .filter(user -> user.getUsername().toLowerCase().contains(query.toLowerCase()) ||
                                    (user.getNickname() != null
                                                && user.getNickname().toLowerCase().contains(query.toLowerCase())))
                        .limit(10) // Giới hạn 10 kết quả
                        .toList();

            return results;
      }

      // Lấy user theo id
      @GetMapping("/{id}")
      public ResponseEntity<?> getUserById(@PathVariable Long id) {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            User user = userOpt.get();

            // Lấy danh sách bạn bè (status = accepted)
            List<Friend> friends = friendRepository.findAcceptedFriends(user, "accepted");
            List<User> friendUsers = friends.stream()
                        .map(f -> f.getUser1().getId().equals(user.getId()) ? f.getUser2() : f.getUser1())
                        .toList();

            // Lấy các lời mời kết bạn đang chờ xác nhận (user là người nhận)
            List<Friend> friendRequests = friendRepository.findByUser2AndStatus(user, "pending");
            List<User> requestUsers = friendRequests.stream()
                        .map(Friend::getUser1)
                        .toList();

            // Tạo map trả về
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("id", user.getId());
            result.put("username", user.getUsername());
            result.put("email", user.getEmail());
            result.put("role", user.getRole());
            result.put("verified", user.isVerified());
            result.put("createdAt", user.getCreatedAt());
            result.put("updatedAt", user.getUpdatedAt());
            result.put("friends", friendUsers);
            result.put("friendRequests", requestUsers);

            // Thêm các trường mà frontend cần
            result.put("avatarUrl", user.getAvatarUrl());
            result.put("nickname", user.getNickname());
            result.put("birthday", user.getBirthday());
            result.put("gender", user.getGender());
            result.put("from", user.getFrom());
            result.put("livesIn", user.getLivesIn());
            result.put("interests", user.getInterests());
            result.put("education", user.getEducation());

            return ResponseEntity.ok(result);
      }

      // Tạo user mới
      @PostMapping
      public User createUser(@RequestBody User user) {
            return userRepository.save(user);
      }

      // Cập nhật user
      @PutMapping("/{id}")
      public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
            Optional<User> optionalUser = userRepository.findById(id);
            if (optionalUser.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            User user = optionalUser.get();

            // Cập nhật các trường cơ bản
            if (userDetails.getUsername() != null)
                  user.setUsername(userDetails.getUsername());
            if (userDetails.getEmail() != null)
                  user.setEmail(userDetails.getEmail());
            if (userDetails.getPassword() != null)
                  user.setPassword(userDetails.getPassword());
            user.setVerified(userDetails.isVerified());
            if (userDetails.getRole() != null)
                  user.setRole(userDetails.getRole());

            // Cập nhật các trường mới
            user.setAvatarUrl(userDetails.getAvatarUrl());
            user.setNickname(userDetails.getNickname());
            user.setBirthday(userDetails.getBirthday());
            user.setGender(userDetails.getGender());
            user.setFrom(userDetails.getFrom());
            user.setLivesIn(userDetails.getLivesIn());
            user.setInterests(userDetails.getInterests());
            user.setEducation(userDetails.getEducation());

            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(updatedUser);
      }

      // Xóa user
      @DeleteMapping("/{id}")
      public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
            if (!userRepository.existsById(id)) {
                  return ResponseEntity.notFound().build();
            }
            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
      }

      @GetMapping("/{id}/friends")
      public List<User> getFriends(@PathVariable Long id) {
            List<Friend> friends = friendRepository.findAcceptedFriendsByUserId(id);
            List<User> friendUsers = new ArrayList<>();
            for (Friend f : friends) {
                  if (f.getUser1().getId().equals(id)) {
                        friendUsers.add(f.getUser2());
                  } else {
                        friendUsers.add(f.getUser1());
                  }
            }
            return friendUsers;
      }

      // API gợi ý kết bạn
      @GetMapping("/{id}/friend-suggestions")
      public List<User> getFriendSuggestions(@PathVariable Long id) {
            Optional<User> currentUserOpt = userRepository.findById(id);
            if (currentUserOpt.isEmpty()) {
                  return new ArrayList<>();
            }

            User currentUser = currentUserOpt.get();
            List<User> suggestions = new ArrayList<>();

            // Lấy danh sách bạn bè hiện tại
            List<Friend> currentFriends = friendRepository.findAcceptedFriendsByUserId(id);
            List<Long> friendIds = new ArrayList<>();
            friendIds.add(id); // Thêm chính user hiện tại để loại trừ

            for (Friend f : currentFriends) {
                  if (f.getUser1().getId().equals(id)) {
                        friendIds.add(f.getUser2().getId());
                  } else {
                        friendIds.add(f.getUser1().getId());
                  }
            }

            // Lấy danh sách các lời mời đã gửi hoặc nhận (để tránh gợi ý trùng)
            List<Friend> allRelations = friendRepository.findByUser1OrUser2(currentUser, currentUser);
            for (Friend f : allRelations) {
                  Long otherId = f.getUser1().getId().equals(id) ? f.getUser2().getId() : f.getUser1().getId();
                  if (!friendIds.contains(otherId)) {
                        friendIds.add(otherId);
                  }
            }

            // Tìm bạn bè của bạn bè (gợi ý qua mutual friends)
            for (Friend f : currentFriends) {
                  User friend = f.getUser1().getId().equals(id) ? f.getUser2() : f.getUser1();
                  List<Friend> friendsOfFriend = friendRepository.findAcceptedFriendsByUserId(friend.getId());

                  for (Friend fof : friendsOfFriend) {
                        User potentialFriend = fof.getUser1().getId().equals(friend.getId()) ? fof.getUser2()
                                    : fof.getUser1();

                        // Kiểm tra nếu chưa là bạn và chưa có trong danh sách gợi ý
                        if (!friendIds.contains(potentialFriend.getId()) &&
                                    suggestions.stream().noneMatch(u -> u.getId().equals(potentialFriend.getId()))) {
                              suggestions.add(potentialFriend);
                        }
                  }
            }

            // Nếu chưa đủ gợi ý, thêm một số user mới tham gia
            if (suggestions.size() < 5) {
                  List<User> recentUsers = userRepository.findAll().stream()
                              .filter(u -> !friendIds.contains(u.getId()))
                              .filter(u -> suggestions.stream().noneMatch(s -> s.getId().equals(u.getId())))
                              .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // Sắp xếp theo thời gian
                                                                                              // tạo mới nhất
                              .limit(5 - suggestions.size())
                              .toList();

                  suggestions.addAll(recentUsers);
            }

            // Giới hạn tối đa 5 gợi ý
            return suggestions.stream().limit(5).toList();
      }

      @PostMapping("/{id}/avatar")
      public ResponseEntity<?> uploadAvatar(@PathVariable Long id, @RequestParam("avatar") MultipartFile file) {
            System.out.println("==> Đã vào hàm upload avatar");
            try {
                  // Tìm user trong database
                  Optional<User> userOpt = userRepository.findById(id);
                  if (userOpt.isEmpty()) {
                        return ResponseEntity.notFound().build();
                  }
                  User user = userOpt.get();

                  // Tạo thư mục upload
                  Path uploadDir = Paths.get("uploads/avatars");
                  Files.createDirectories(uploadDir);

                  // Tạo tên file
                  String ext = org.springframework.util.StringUtils.getFilenameExtension(file.getOriginalFilename());
                  String filename = id + (ext != null ? ("." + ext) : ".jpg");
                  Path filePath = uploadDir.resolve(filename);

                  // Lưu file
                  file.transferTo(filePath);
                  System.out.println("==> Đã lưu file: " + filePath.toAbsolutePath());

                  // Cập nhật avatarUrl vào database
                  String avatarUrl = "/uploads/avatars/" + filename;
                  user.setAvatarUrl(avatarUrl);
                  userRepository.save(user);
                  System.out.println("==> Đã cập nhật avatarUrl vào database: " + avatarUrl);

                  return ResponseEntity.ok().body(java.util.Map.of(
                              "message", "Upload avatar thành công!",
                              "avatarUrl", avatarUrl));
            } catch (Exception e) {
                  System.out.println("==> Lỗi upload avatar:");
                  e.printStackTrace();
                  return ResponseEntity.status(500).body("Lỗi upload ảnh: " + e.getMessage());
            }
      }
}