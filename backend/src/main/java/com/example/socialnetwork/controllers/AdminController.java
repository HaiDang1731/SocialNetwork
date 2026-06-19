package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.entities.UserRole;
import com.example.socialnetwork.entities.Post;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.repositories.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
public class AdminController {
      @Autowired
      private UserRepository userRepository;

      @Autowired
      private PostRepository postRepository;

      // Lấy danh sách tất cả user (có thể lọc theo role)
      @GetMapping
      public List<User> getAllUsers(@RequestParam(value = "role", required = false) UserRole role) {
            if (role != null) {
                  return userRepository.findAll().stream()
                              .filter(user -> user.getRole() == role)
                              .toList();
            }
            return userRepository.findAll();
      }

      // Thay đổi role của user
      @PutMapping("/{id}/role")
      public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody UserRole newRole) {
            Optional<User> optionalUser = userRepository.findById(id);
            if (optionalUser.isEmpty()) {
                  return ResponseEntity.notFound().build();
            }
            User user = optionalUser.get();
            user.setRole(newRole);
            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(updatedUser);
      }

      // Lấy danh sách tất cả bài viết
      @GetMapping("/posts")
      public List<Post> getAllPosts() {
            return postRepository.findAll();
      }

      // Xóa bài viết
      @DeleteMapping("/posts/{id}")
      public ResponseEntity<Void> deletePost(@PathVariable Long id) {
            if (!postRepository.existsById(id)) {
                  return ResponseEntity.notFound().build();
            }
            postRepository.deleteById(id);
            return ResponseEntity.noContent().build();
      }

      // Tạo admin user tạm thời (chỉ để testing)
      @PostMapping("/create-admin")
      public ResponseEntity<?> createAdminUser(@RequestParam String username, @RequestParam String email,
                  @RequestParam String password) {
            try {
                  // Kiểm tra xem user đã tồn tại chưa
                  if (userRepository.findByUsername(username).isPresent()) {
                        return ResponseEntity.badRequest().body("Username already exists");
                  }
                  if (userRepository.findByEmail(email).isPresent()) {
                        return ResponseEntity.badRequest().body("Email already exists");
                  }

                  User adminUser = new User();
                  adminUser.setUsername(username);
                  adminUser.setEmail(email);
                  adminUser.setPassword(password); // Trong thực tế cần encode password
                  adminUser.setRole(UserRole.ADMIN);
                  adminUser.setVerified(true);

                  // Set các trường bắt buộc khác nếu cần
                  adminUser.setCreatedAt(java.time.LocalDateTime.now());
                  adminUser.setUpdatedAt(java.time.LocalDateTime.now());

                  User savedUser = userRepository.save(adminUser);

                  return ResponseEntity.ok().body(java.util.Map.of(
                              "message", "Admin user created successfully",
                              "userId", savedUser.getId(),
                              "username", savedUser.getUsername(),
                              "role", savedUser.getRole()));
            } catch (Exception e) {
                  return ResponseEntity.status(500).body("Error creating admin user: " + e.getMessage());
            }
      }

      // Tạo admin mặc định (không cần parameter)
      @PostMapping("/create-default-admin")
      public ResponseEntity<?> createDefaultAdmin() {
            try {
                  String username = "admin";
                  String email = "admin@admin.com";
                  String password = "admin123";

                  // Kiểm tra xem admin đã tồn tại chưa
                  if (userRepository.findByUsername(username).isPresent()) {
                        return ResponseEntity.ok().body("Admin user already exists");
                  }

                  User adminUser = new User();
                  adminUser.setUsername(username);
                  adminUser.setEmail(email);
                  adminUser.setPassword(password);
                  adminUser.setRole(UserRole.ADMIN);
                  adminUser.setVerified(true);
                  adminUser.setCreatedAt(java.time.LocalDateTime.now());
                  adminUser.setUpdatedAt(java.time.LocalDateTime.now());

                  User savedUser = userRepository.save(adminUser);

                  return ResponseEntity.ok().body(java.util.Map.of(
                              "message", "Default admin user created successfully",
                              "username", "admin",
                              "password", "admin123",
                              "email", "admin@admin.com",
                              "userId", savedUser.getId()));
            } catch (Exception e) {
                  return ResponseEntity.status(500).body("Error creating default admin: " + e.getMessage());
            }
      }

      // Endpoint tạm thời để đổi role user (không cần authentication)
      @PostMapping("/temp-change-role/{userId}")
      public ResponseEntity<?> tempChangeRole(@PathVariable Long userId, @RequestParam String role) {
            try {
                  Optional<User> optionalUser = userRepository.findById(userId);
                  if (optionalUser.isEmpty()) {
                        return ResponseEntity.notFound().build();
                  }

                  User user = optionalUser.get();
                  UserRole newRole = UserRole.valueOf(role.toUpperCase());
                  user.setRole(newRole);

                  User updatedUser = userRepository.save(user);

                  return ResponseEntity.ok().body(java.util.Map.of(
                              "message", "User role updated successfully",
                              "userId", updatedUser.getId(),
                              "username", updatedUser.getUsername(),
                              "oldRole", user.getRole(),
                              "newRole", newRole));
            } catch (Exception e) {
                  return ResponseEntity.status(500).body("Error updating user role: " + e.getMessage());
            }
      }
}