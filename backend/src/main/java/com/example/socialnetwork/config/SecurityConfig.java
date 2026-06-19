package com.example.socialnetwork.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.socialnetwork.security.JwtAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
      @Autowired
      private JwtAuthenticationFilter jwtAuthenticationFilter;

      @Bean
      public PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
      }

      @Bean
      public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
            return http.getSharedObject(AuthenticationManagerBuilder.class).build();
      }

      @Bean
      public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http
                        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                        .csrf(csrf -> csrf.disable())
                        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                        .authorizeHttpRequests(auth -> auth
                                    .requestMatchers("/api/auth/**").permitAll()
                                    .requestMatchers("/api/users/**").permitAll()
                                    .requestMatchers("/api/posts/**").permitAll()
                                    .requestMatchers("/api/upload/**").permitAll()
                                    .requestMatchers("/api/post-likes/**").permitAll()
                                    .requestMatchers("/api/comments/**").permitAll()
                                    .requestMatchers("/api/comment-likes/**").permitAll()
                                    .requestMatchers("/api/friends/**").permitAll()
                                    .requestMatchers("/api/follows/**").permitAll()
                                    .requestMatchers("/api/messages/**").permitAll()
                                    .requestMatchers("/api/notifications/**").permitAll()
                                    .requestMatchers("/ws/**").permitAll()
                                    .requestMatchers("/uploads/**").permitAll()
                                    .requestMatchers("/error").permitAll()
                                    .requestMatchers("/api/admin/users/create-admin").permitAll()
                                    .requestMatchers("/api/admin/users/create-default-admin").permitAll()
                                    .requestMatchers("/api/admin/users/temp-change-role/**").permitAll()
                                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                    .anyRequest().authenticated());
            http.addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);
            return http.build();
      }

      @Bean
      public UrlBasedCorsConfigurationSource corsConfigurationSource() {
            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            CorsConfiguration config = new CorsConfiguration();
            config.setAllowCredentials(true);
            config.addAllowedOriginPattern("http://localhost:3000");
            config.addAllowedHeader("*");
            config.addAllowedMethod("*");
            source.registerCorsConfiguration("/**", config);
            return source;
      }
}