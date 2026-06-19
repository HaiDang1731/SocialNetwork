package com.example.socialnetwork.services;

import com.example.socialnetwork.entities.Notification;
import com.example.socialnetwork.entities.User;
import com.example.socialnetwork.entities.Post;
import com.example.socialnetwork.entities.Comment;
import com.example.socialnetwork.repositories.NotificationRepository;
import com.example.socialnetwork.repositories.UserRepository;
import com.example.socialnetwork.repositories.FriendRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

      @Autowired
      private NotificationRepository notificationRepository;

      @Autowired
      private UserRepository userRepository;

      @Autowired
      private FriendRepository friendRepository;

      // Tạo thông báo cho bài post mới của bạn bè
      public void createNewPostNotification(Post post) {
            User postAuthor = post.getUser();
            if (postAuthor == null)
                  return;

            // Lấy danh sách bạn bè của tác giả
            List<com.example.socialnetwork.entities.Friend> friends = friendRepository.findAcceptedFriends(postAuthor,
                        "accepted");

            String content = postAuthor.getUsername() + " đã đăng một bài viết mới";

            for (com.example.socialnetwork.entities.Friend friendship : friends) {
                  User friend = friendship.getUser1().getId().equals(postAuthor.getId())
                              ? friendship.getUser2()
                              : friendship.getUser1();

                  Notification notification = new Notification(friend, postAuthor, "POST", content);
                  notification.setRelatedPostId(post.getId());
                  notificationRepository.save(notification);
            }
      }

      // Tạo thông báo khi có người like bài viết
      public void createLikeNotification(User liker, Post post) {
            User postAuthor = post.getUser();

            // Không tạo thông báo nếu like chính bài viết của mình
            if (postAuthor.getId().equals(liker.getId()))
                  return;

            String content = liker.getUsername() + " đã thích bài viết của bạn";

            Notification notification = new Notification(postAuthor, liker, "LIKE", content);
            notification.setRelatedPostId(post.getId());
            notificationRepository.save(notification);
      }

      // Tạo thông báo khi có người comment bài viết
      public void createCommentNotification(User commenter, Post post, Comment comment) {
            User postAuthor = post.getUser();

            // Không tạo thông báo nếu comment chính bài viết của mình
            if (postAuthor.getId().equals(commenter.getId()))
                  return;

            String content = commenter.getUsername() + " đã bình luận về bài viết của bạn";

            Notification notification = new Notification(postAuthor, commenter, "COMMENT", content);
            notification.setRelatedPostId(post.getId());
            notification.setRelatedCommentId(comment.getId());
            notificationRepository.save(notification);
      }

      // Tạo thông báo lời mời kết bạn
      public void createFriendRequestNotification(User requester, User receiver) {
            String content = requester.getUsername() + " đã gửi lời mời kết bạn cho bạn";

            Notification notification = new Notification(receiver, requester, "FRIEND_REQUEST", content);
            notificationRepository.save(notification);
      }

      // Tạo thông báo chấp nhận kết bạn
      public void createFriendAcceptNotification(User accepter, User requester) {
            String content = accepter.getUsername() + " đã chấp nhận lời mời kết bạn của bạn";

            Notification notification = new Notification(requester, accepter, "FRIEND_ACCEPT", content);
            notificationRepository.save(notification);
      }

      // Lấy tất cả thông báo của user
      public List<Notification> getUserNotifications(Long userId) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty())
                  return List.of();

            return notificationRepository.findByUserOrderByCreatedAtDesc(userOpt.get());
      }

      // Lấy thông báo chưa đọc
      public List<Notification> getUnreadNotifications(Long userId) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty())
                  return List.of();

            return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(userOpt.get());
      }

      // Đếm số thông báo chưa đọc
      public long getUnreadCount(Long userId) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty())
                  return 0;

            return notificationRepository.countByUserAndIsReadFalse(userOpt.get());
      }

      // Đánh dấu thông báo đã đọc
      public void markAsRead(Long notificationId) {
            Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
            if (notificationOpt.isPresent()) {
                  Notification notification = notificationOpt.get();
                  notification.setRead(true);
                  notificationRepository.save(notification);
            }
      }

      // Đánh dấu tất cả thông báo đã đọc
      public void markAllAsRead(Long userId) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty())
                  return;

            List<Notification> unreadNotifications = notificationRepository
                        .findByUserAndIsReadFalseOrderByCreatedAtDesc(userOpt.get());
            for (Notification notification : unreadNotifications) {
                  notification.setRead(true);
                  notificationRepository.save(notification);
            }
      }
}