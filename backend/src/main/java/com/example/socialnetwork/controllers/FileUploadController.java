package com.example.socialnetwork.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(originPatterns = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {
      @Value("${upload.dir:uploads}")
      private String uploadDir;

      @PostMapping
      public ResponseEntity<String> uploadFile(HttpServletRequest request, @RequestParam("file") MultipartFile file) {
            try {
                  System.out.println("Upload request received - File: " + file.getOriginalFilename() + ", Size: "
                              + file.getSize());

                  if (file.isEmpty()) {
                        System.out.println("Error: File is empty");
                        return ResponseEntity.badRequest().body("File is empty");
                  }

                  // Tạo thư mục nếu chưa có
                  File dir = new File(uploadDir);
                  if (!dir.exists()) {
                        boolean created = dir.mkdirs();
                        System.out.println("Created upload directory: " + created + " at " + dir.getAbsolutePath());
                  }

                  // Kiểm tra file type
                  String contentType = file.getContentType();
                  System.out.println("Content type: " + contentType);

                  if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
                        System.out.println("Error: Invalid file type - " + contentType);
                        return ResponseEntity.badRequest().body("Chỉ cho phép upload ảnh và video");
                  }

                  // Đặt tên file duy nhất
                  String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
                  String ext = "";
                  int dotIdx = originalFilename.lastIndexOf('.');
                  if (dotIdx > 0) {
                        ext = originalFilename.substring(dotIdx);
                  }
                  String filename = UUID.randomUUID() + ext;

                  Path filePath = Paths.get(uploadDir, filename);
                  System.out.println("Saving file to: " + filePath.toAbsolutePath());

                  Files.copy(file.getInputStream(), filePath);

                  // Lấy base URL từ request
                  String baseUrl = request.getScheme() + "://" + request.getServerName() + ":"
                              + request.getServerPort();

                  // Trả về URL đầy đủ
                  String fileUrl = baseUrl + "/uploads/" + filename;
                  System.out.println("Upload successful, URL: " + fileUrl);
                  return ResponseEntity.ok(fileUrl);

            } catch (IOException e) {
                  System.err.println("Upload failed with IOException: " + e.getMessage());
                  e.printStackTrace();
                  return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                              .body("Upload failed: " + e.getMessage());
            } catch (Exception e) {
                  System.err.println("Upload failed with Exception: " + e.getMessage());
                  e.printStackTrace();
                  return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                              .body("Upload failed: " + e.getMessage());
            }
      }
}