package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.Notification;
import com.example.socialnetwork.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

      // Lấy tất cả thông báo của user, sắp xếp theo thời gian mới nhất
      List<Notification> findByUserOrderByCreatedAtDesc(User user);

      // Lấy thông báo chưa đọc của user
      List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);

      // Đếm số thông báo chưa đọc
      long countByUserAndIsReadFalse(User user);

      // Tìm thông báo theo type và user
      List<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, String type);

      // Xóa thông báo cũ (hơn 30 ngày)
      @Query("DELETE FROM Notification n WHERE n.createdAt < :dateLimit")
      void deleteOldNotifications(@Param("dateLimit") java.time.LocalDateTime dateLimit);
}