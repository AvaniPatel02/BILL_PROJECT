import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Login.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    if (!email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/forgot-password/send-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        toast.success("Password reset OTP sent successfully to your email!");
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Send OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/forgot-password/verify-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp_code: otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        toast.success("OTP verified successfully! You can now reset your password.");
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Verify OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otpVerified) {
      toast.error("Please verify your email with OTP first");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/forgot-password/reset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successfully! You can now login with your new password.");
        navigate("/");
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="auth-container">
        <div className="auth-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="Forgot Password visual"
          />
        </div>

        <div className="auth-form-container">
          <form onSubmit={handleResetPassword} className="auth-form">
            <h2 className="auth-title">Forgot Password</h2>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
              Enter your email to receive a password reset OTP
            </p>

            <label>Email</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                style={{ flex: 1 }}
                disabled={otpSent}
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading || otpSent}
                style={{
                  padding: '10px 15px',
                  backgroundColor: otpSent ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: otpSent ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? "Sending..." : otpSent ? "OTP Sent" : "Get OTP"}
              </button>
            </div>

            {otpSent && (
              <>
                <label>OTP</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{ flex: 1 }}
                    disabled={otpVerified}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={loading || otpVerified || otp.length !== 6}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: otpVerified ? '#28a745' : (otp.length !== 6 ? '#ccc' : '#007bff'),
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (otpVerified || otp.length !== 6) ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {loading ? "Verifying..." : otpVerified ? "✓ Verified" : "Verify OTP"}
                  </button>
                </div>
                {otpVerified && (
                  <div style={{ color: '#28a745', fontSize: '14px', marginTop: '5px' }}>
                    ✓ OTP verified successfully!
                  </div>
                )}
              </>
            )}

            {otpVerified && (
              <>
                <label>New Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <span onClick={() => setShowPassword(!showPassword)} className="toggle-password">
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </span>
                </div>

                <label>Confirm New Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading || !otpVerified}
              style={{
                backgroundColor: !otpVerified ? '#ccc' : undefined,
                cursor: !otpVerified ? 'not-allowed' : undefined
              }}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

            <div className="auth-footer-text">
              Remember your password? <Link to="/">Login</Link>
            </div>
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

export default ForgotPassword; 