import React, { useState } from "react";

export default function OtpVerify({ setView }) {
      const [otp, setOtp] = useState("");

      const handleVerify = async (e) => {
            e.preventDefault();
            const res = await fetch(`http://localhost:8080/api/auth/verify-otp?otp=${otp}`, {
                  method: "POST",
            });
            const data = await res.text();
            alert(data);
            if (res.ok) {
                  setView('login');
            }
      };

      return (
            <div className="card p-4 shadow mb-3" style={{ borderRadius: 10 }}>
                  <h2 className="text-center">Xác thực OTP</h2>
                  <form onSubmit={handleVerify}>
                        <div className="mb-2">
                              <input className="form-control" value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP" required />
                        </div>
                        <button className="btn btn-info w-100" type="submit">Xác thực</button>
                  </form>
            </div>
      );
} 