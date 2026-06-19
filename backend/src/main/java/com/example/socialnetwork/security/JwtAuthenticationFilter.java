package com.example.socialnetwork.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
      @Autowired
      private UserDetailsService userDetailsService;

      private final String jwtSecret = "your_jwt_secret"; // Nên để ở config thực tế

      @Override
      protected void doFilterInternal(HttpServletRequest request,
                  HttpServletResponse response, FilterChain filterChain)
                  throws ServletException, IOException {
            String authHeader = request.getHeader("Authorization");
            String username = null;
            String jwt = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                  jwt = authHeader.substring(7);
                  try {
                        Claims claims = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(jwt).getBody();
                        username = claims.getSubject();
                  } catch (Exception e) {
                        // Token không hợp lệ
                  }
            }
            if (username != null &&
                        SecurityContextHolder.getContext().getAuthentication() == null) {
                  UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                  if (validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                  }
            }
            filterChain.doFilter(request, response);
      }

      private boolean validateToken(String token, UserDetails userDetails) {
            try {
                  Claims claims = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody();
                  return claims.getSubject().equals(userDetails.getUsername());
            } catch (Exception e) {
                  return false;
            }
      }
}