import React from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleLoginButton({ onLoginSuccess }) {
      return (
            <GoogleOAuthProvider clientId="109381085862-7pmd6krokac81ih99d3i9omrr8ikpnuu.apps.googleusercontent.com">
                  <GoogleLogin
                        onSuccess={onLoginSuccess}
                        onError={() => alert("Đăng nhập Google thất bại!")}
                  />
            </GoogleOAuthProvider>
      );
} 