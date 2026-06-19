package com.example.socialnetwork.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

      @Override
      public void configureMessageBroker(MessageBrokerRegistry config) {
            // Kích hoạt message broker với prefix "/topic"
            config.enableSimpleBroker("/topic");
            // Prefix cho các message từ client gửi lên server
            config.setApplicationDestinationPrefixes("/app");
      }

      @Override
      public void registerStompEndpoints(StompEndpointRegistry registry) {
            // Đăng ký endpoint WebSocket với SockJS fallback
            registry.addEndpoint("/ws")
                        .setAllowedOriginPatterns("*")
                        .withSockJS();
      }
}
