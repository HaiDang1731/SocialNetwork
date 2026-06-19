package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.Message;
import com.example.socialnetwork.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

      // Lấy tất cả tin nhắn giữa 2 user, sắp xếp theo thời gian
      @Query("SELECT m FROM Message m WHERE " +
                  "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
                  "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
                  "ORDER BY m.createdAt ASC")
      List<Message> findMessagesBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

      // Lấy tin nhắn cuối cùng giữa 2 user
      @Query("SELECT m FROM Message m WHERE " +
                  "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
                  "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
                  "ORDER BY m.createdAt DESC LIMIT 1")
      Message findLastMessageBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

      // Đếm tin nhắn chưa đọc cho một user
      @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :userId AND m.isRead = false")
      long countUnreadMessages(@Param("userId") Long userId);

      // Đếm tin nhắn chưa đọc từ một user cụ thể
      @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :receiverId AND m.sender.id = :senderId AND m.isRead = false")
      long countUnreadMessagesFromUser(@Param("receiverId") Long receiverId, @Param("senderId") Long senderId);

      // Lấy tất cả tin nhắn của một user (gửi hoặc nhận)
      @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.createdAt DESC")
      List<Message> findMessagesForUser(@Param("userId") Long userId);

      // Đếm tin nhắn chưa đọc giữa 2 user cụ thể
      @Query("SELECT COUNT(m) FROM Message m WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isRead = false")
      long countUnreadMessagesBetweenUsers(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
}