import React, { useState } from "react";

export default function Register({ setView }) {
      const [username, setUsername] = useState("");
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");

      const handleRegister = async (e) => {
            e.preventDefault();
            const res = await fetch("http://localhost:8080/api/auth/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username, email, password }),
            });
            const data = await res.text();
            alert(data);
            if (res.ok) {
                  setView('otp');
            }
      };

      return (
            <div className="card p-4 shadow mb-3" style={{ borderRadius: 10 }}>
                  <h2 className="text-center">Tạo tài khoản mới</h2>
                  <form onSubmit={handleRegister}>
                        <div className="mb-2">
                              <input className="form-control" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                        </div>
                        <div className="mb-2">
                              <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
                        </div>
                        <div className="mb-2">
                              <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                        </div>
                        <button className="btn btn-success w-100" type="submit">Tạo tài khoản mới</button>
                        <span className="text-primary" style={{ cursor: 'pointer' }} onClick={() => setView('login')}>Bạn đã có tài khoản?</span>
                  </form>
            </div>
      );
} 