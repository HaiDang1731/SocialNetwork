package com.example.socialnetwork.repositories;

import com.example.socialnetwork.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
      // Spring Data JPA will automatically provide basic CRUD operations
      // We can add custom query methods here if needed, e.g., findByUsername(String
      // username);

      Optional<User> findByUsername(String username);

      Optional<User> findByEmail(String email);

      Optional<User> findByOtp(String otp);

      Optional<User> findByUsernameOrEmail(String username, String email);
}