import './App.css';
import Login from './auth/Login';
import Register from './auth/Register';
import OtpVerify from './auth/OtpVerify';
import ForgotPassword from './auth/ForgotPassword';
import Home from './components/Home';
import Profile from './components/Profile';
import Messages from './components/Messages';
import AdminDashboard from './admin/AdminDashboard';
// import OtherProfile from './components/OtherProfile';
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from 'react';

function AuthLayout({ setView, view }) {
  return (
    <div className="container py-5">
      <div className="row justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <div className="col-md-6 d-flex flex-column align-items-center justify-content-center">
          <h1 style={{ color: "#1877f2", fontWeight: "bold", fontSize: "4rem", textAlign: "right" }}>
            😏fakebook
          </h1>
          <h3 className="fw-normal text-center" style={{ maxWidth: 400 }}>
            Fakebook giúp bạn kết nối và chia sẻ với mọi người những thứ ối dồi ôi trong cuộc sống của bạn.
          </h3>
        </div>

        <div className="col-md-4">
          {view === 'login' && <Login setView={setView} />}
          {view === 'register' && <Register setView={setView} />}
          {view === 'forgot' && <ForgotPassword setView={setView} />}
          {view === 'otp' && <OtpVerify setView={setView} />}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState('login');
  return (
    <GoogleOAuthProvider clientId="109381085862-7pmd6krokac81ih99d3i9omrr8ikpnuu.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/" element={<AuthLayout setView={setView} view={view} />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* <Route path="/admin/users" element={<UserManagement />} /> */}

        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
