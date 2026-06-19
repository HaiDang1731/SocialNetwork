import React, { useState } from "react";

export default function ForgotPassword({ setView }) {
      const [email, setEmail] = useState("");
      const [otp, setOtp] = useState("");
      const [newPassword, setNewPassword] = useState("");

      const handleSendOtp = async (e) => {
            e.preventDefault();
            const res = await fetch(`http://localhost:8080/api/auth/forgot-password?email=${email}`, {
                  method: "POST",
            });
            const data = await res.text();
            alert(data);
      };

      const handleReset = async (e) => {
            e.preventDefault();
            const res = await fetch(`http://localhost:8080/api/auth/reset-password?email=${email}&otp=${otp}&newPassword=${newPassword}`, {
                  method: "POST",
            });
            const data = await res.text();
            alert(data);
      };

      return (
            <div className="card p-4 shadow mb-3" style={{ borderRadius: 10 }}>
                  <h2 className="text-center">Quên mật khẩu</h2>
                  <form onSubmit={handleSendOtp} className="mb-2">
                        <div className="mb-2">
                              <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
                        </div>
                        <button className="btn btn-warning w-100" type="submit">Gửi OTP</button>
                  </form>
                  <form onSubmit={handleReset}>
                        <div className="mb-2">
                              <input className="form-control" value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP" required />
                        </div>
                        <div className="mb-2">
                              <input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" required />
                        </div>
                        <button className="btn btn-primary w-100" type="submit">Đổi mật khẩu</button>
                  </form>
                  <span className="text-primary" style={{ cursor: 'pointer' }} onClick={() => setView('login')}>Quay lại đăng nhập</span>
            </div>
      );
} 