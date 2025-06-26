import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { Link } from "react-router-dom";
import './Login.css'; // Custom CSS

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); 

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error:", errorText);
        setError("Login failed. Please check your credentials.");
        return;
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="login visual"
          />
        </div>
        <div className="auth-form-container">
          <form onSubmit={handleLogin} className="auth-form">
            <h2 className="auth-title">Login to Your Account</h2>

            {error && <div className="auth-error">{error}</div>}

            <label>Email address</label>
            <input
              type="email"
              placeholder="Enter a valid email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </span>
            </div>

            <div className="auth-options">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="auth-button">Login</button>

            <p className="auth-footer-text">
              Don't have an account? <Link to="/si">Signup</Link>
            </p>
          </form>
        </div>
      </div>

      <footer className="auth-footer">
        <span>© 2025</span>
        <div className="social-icons">
          <a href="#!"><i className="fab fa-facebook-f"></i></a>
          <a href="#!"><i className="fab fa-twitter"></i></a>
          <a href="#!"><i className="fab fa-google"></i></a>
          <a href="#!"><i className="fab fa-linkedin-in"></i></a>
        </div>
      </footer>
    </section>
  );
};

export default Login;