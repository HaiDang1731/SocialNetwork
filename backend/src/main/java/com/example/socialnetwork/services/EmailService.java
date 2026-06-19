package com.example.socialnetwork.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
      @Autowired
      private JavaMailSender mailSender;

      public void sendOtpEmail(String to, String otp) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Mã xác thực OTP");
            String body = "Chào mừng bạn đến với 😏Fakebook của chúng tôi!\n\n";
            body += "Mã OTP của bạn là: " + otp + "\n\n";
            body += "Vui lòng không chia sẻ mã này cho bất kỳ ai.";
            message.setText(body);
            message.setFrom("buihaidang317@gmail.com");
            mailSender.send(message);
      }
}