package com.example.socialnetwork.controllers;

import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.http.HttpStatus;
import java.util.Collections;
import java.util.Map;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import com.example.socialnetwork.utils.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
      @Autowired
      private UserRepository userRepository;
      @Autowired
      private EmailService emailService;
      @Autowired
      private PasswordEncoder passwordEncoder;
      @Autowired
      private JwtUtil jwtUtil;

      // Đăng ký: lưu user, sinh OTP, gửi email
      @PostMapping("/register")
      public ResponseEntity<String> register(@RequestBody User user) {
            if (userRepository.findByUsername(user.getUsername()).isPresent()) {
                  return ResponseEntity.badRequest().body("Username đã tồn tại");
            }
            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                  return ResponseEntity.badRequest().body("Email đã tồn tại");
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setVerified(false);
            String otp = String.format("%06d", new Random().nextInt(999999));
            user.setOtp(otp);
            user.setOtpCreatedAt(LocalDateTime.now());
            userRepository.save(user);
            emailService.sendOtpEmail(user.getEmail(), otp);
            return ResponseEntity.ok("Đăng ký thành công, vui lòng kiểm tra email để xác thực OTP");
      }

      // Xác thực OTP
      // @PostMapping("/verify-otp")
      // public ResponseEntity<String> verifyOtp(@RequestParam String username,
      // @RequestParam String otp) {
      // Optional<User> optionalUser = userRepository.findByUsername(username);
      // if (optionalUser.isEmpty()) {
      // return ResponseEntity.badRequest().body("User không tồn tại");
      // }
      // User user = optionalUser.get();
      // if (user.isVerified()) {
      // return ResponseEntity.badRequest().body("User đã xác thực trước đó");
      // }
      // if (user.getOtp() == null || !user.getOtp().equals(otp)) {
      // return ResponseEntity.badRequest().body("OTP không đúng");
      // }
      // user.setVerified(true);
      // user.setOtp(null);
      // user.setOtpCreatedAt(null);
      // userRepository.save(user);
      // return ResponseEntity.ok("Xác thực thành công, bạn có thể đăng nhập");
      // }
      @PostMapping("/verify-otp")
      public ResponseEntity<String> verifyOtp(@RequestParam String otp) {
            Optional<User> optionalUser = userRepository.findByOtp(otp);
            if (optionalUser.isEmpty()) {
                  return ResponseEntity.badRequest().body("OTP không đúng hoặc đã hết hạn");
            }
            User user = optionalUser.get();
            if (user.isVerified()) {
                  return ResponseEntity.badRequest().body("User đã xác thực trước đó");
            }
            // kiểm tra thời gian hết hạn OTP
            if (user.getOtpCreatedAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
                  return ResponseEntity.badRequest().body("OTP đã hết hạn");
            }
            user.setVerified(true);
            user.setOtp(null);
            user.setOtpCreatedAt(null);
            userRepository.save(user);
            return ResponseEntity.ok("Xác thực thành công, bạn có thể đăng nhập");
      }

      // Đăng nhập (chỉ cho user đã xác thực)
      @PostMapping("/login")
      public ResponseEntity<?> login(@RequestParam String usernameOrEmail, @RequestParam String password) {
            Optional<User> optionalUser = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);
            if (optionalUser.isEmpty()) {
                  return ResponseEntity.badRequest().body("User không tồn tại");
            }
            User user = optionalUser.get();
            if (!user.isVerified()) {
                  return ResponseEntity.badRequest().body("User chưa xác thực OTP");
            }
            if (!passwordEncoder.matches(password, user.getPassword())) {
                  return ResponseEntity.badRequest().body("Sai mật khẩu");
            }
            // Sinh JWT token
            String token = jwtUtil.generateToken(user);
            return ResponseEntity.ok(Map.of(
                        "token", token,
                        "user", Map.of(
                                    "id", user.getId(),
                                    "username", user.getUsername(),
                                    "email", user.getEmail(),
                                    "role", user.getRole().toString())));
      }

      // Gửi OTP reset mật khẩu
      @PostMapping("/forgot-password")
      public ResponseEntity<String> forgotPassword(@RequestParam String email) {
            Optional<User> optionalUser = userRepository.findByEmail(email);
            if (optionalUser.isEmpty()) {
                  return ResponseEntity.badRequest().body("Email không tồn tại");
            }
            User user = optionalUser.get();
            String otp = String.format("%06d", new Random().nextInt(999999));
            user.setOtp(otp);
            user.setOtpCreatedAt(LocalDateTime.now());
            userRepository.save(user);
            emailService.sendOtpEmail(user.getEmail(), otp);
            return ResponseEntity.ok("Đã gửi OTP reset mật khẩu về email");
      }

      // Xác thực OTP và đổi mật khẩu mới
      @PostMapping("/reset-password")
      public ResponseEntity<String> resetPassword(@RequestParam String email, @RequestParam String otp,
                  @RequestParam String newPassword) {
            Optional<User> optionalUser = userRepository.findByEmail(email);
            if (optionalUser.isEmpty()) {
                  return ResponseEntity.badRequest().body("Email không tồn tại");
            }
            User user = optionalUser.get();
            if (user.getOtp() == null || !user.getOtp().equals(otp)) {
                  return ResponseEntity.badRequest().body("OTP không đúng");
            }
            // thời gian hết hạn OTP
            if (user.getOtpCreatedAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
                  return ResponseEntity.badRequest().body("OTP đã hết hạn");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setOtp(null);
            user.setOtpCreatedAt(null);
            userRepository.save(user);
            return ResponseEntity.ok("Đổi mật khẩu thành công, bạn có thể đăng nhập");
      }

      // Đăng nhập bằng Google ID Token
      @PostMapping("/google")
      public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
            String idTokenString = body.get("token");
            try {
                  GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                              GoogleNetHttpTransport.newTrustedTransport(),
                              new JacksonFactory())
                              .setAudience(Collections.singletonList(
                                          "109381085862-7pmd6krokac81ih99d3i9omrr8ikpnuu.apps.googleusercontent.com"))
                              .build();
                  GoogleIdToken idToken = verifier.verify(idTokenString);
                  if (idToken != null) {
                        GoogleIdToken.Payload payload = idToken.getPayload();
                        String email = payload.getEmail();
                        Optional<User> optionalUser = userRepository.findByEmail(email);
                        User user;
                        if (optionalUser.isEmpty()) {
                              user = new User();
                              user.setEmail(email);
                              user.setUsername(email);
                              user.setPassword("");
                              user.setVerified(true);
                              user.setRole(com.example.socialnetwork.entities.UserRole.USER);
                              userRepository.save(user);
                        } else {
                              user = optionalUser.get();
                        }
                        // Sinh JWT
                        String jwt = jwtUtil.generateToken(user);
                        // Trả về cả user info
                        return ResponseEntity.ok(Map.of(
                                    "token", jwt,
                                    "user", Map.of(
                                                "id", user.getId(),
                                                "username", user.getUsername(),
                                                "email", user.getEmail(),
                                                "role", user.getRole().toString())));
                  } else {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid ID token");
                  }
            } catch (Exception e) {
                  return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Google login error");
            }
      }
}