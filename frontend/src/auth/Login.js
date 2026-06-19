import React, { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import { useNavigate } from "react-router-dom";

export default function Login({ setView }) {
      const [usernameOrEmail, setUsernameOrEmail] = useState("");
      const [password, setPassword] = useState("");
      const navigate = useNavigate();

      const handleLogin = async (e) => {
            e.preventDefault();
            const res = await fetch("http://localhost:8080/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams({ usernameOrEmail, password }),
            });
            if (res.ok) {
                  const data = await res.json();
                  localStorage.setItem("jwt", data.token);
                  if (data.user && data.user.id) {
                        localStorage.setItem("userId", data.user.id);
                        localStorage.setItem("user", JSON.stringify(data.user));
                  }
                  navigate("/home");
            } else {
                  const error = await res.text();
                  alert(error);
            }
      };

      const handleGoogleLogin = async (credentialResponse) => {
            const res = await fetch("http://localhost:8080/api/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential }),
            });
            const data = await res.json();
            if (data.token) {
                  localStorage.setItem("jwt", data.token);
                  if (data.user && data.user.id) {
                        localStorage.setItem("userId", data.user.id);
                        localStorage.setItem("user", JSON.stringify(data.user));
                  }
                  navigate("/home");
            } else {
                  alert("Đăng nhập Google thất bại");
            }
      };

      return (
            <div className="card p-3 mb-3">
                  <h2 className="text-center">Đăng nhập</h2>
                  <form onSubmit={handleLogin}>
                        <div className="mb-2">
                              <input className="form-control" value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)} placeholder="Username hoặc Email" required />
                        </div>
                        <div className="mb-2">
                              <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                        </div>
                        <button className="btn btn-primary w-100" type="submit">Đăng nhập</button>
                        <br />
                        <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-primary" style={{ cursor: 'pointer' }} onClick={() => setView('forgot')}>Quên mật khẩu?</span>
                              <span className="text-primary" style={{ cursor: 'pointer' }} onClick={() => setView('register')}>Đăng ký</span>
                        </div>
                  </form>
                  <div className="text-center mt-2">
                        <GoogleLoginButton onLoginSuccess={handleGoogleLogin} />
                  </div>
            </div>
      );
} 