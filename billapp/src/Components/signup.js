import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
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
      const response = await fetch("http://localhost:8000/api/auth/send-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        toast.success("OTP sent successfully to your email!");
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
      const response = await fetch("http://localhost:8000/api/auth/verify-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp_code: otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        toast.success("OTP verified successfully!");
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

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!otpVerified) {
      toast.error("Please verify your email with OTP first");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          mobile,
          password,
          password2: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        const errorMsg = Object.entries(data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : value}`)
          .join("\n") || "Registration failed";
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Registration error:", err);
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
            alt="Signup visual"
          />
        </div>

        <div className="auth-form-container">
          <form onSubmit={handleSignup} className="auth-form">
            <h2 className="auth-title">Create an Account</h2>

            {error && <div className="auth-error">{error}</div>}

            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Enter your first name"
            />

            <label>Email</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                style={{ flex: 1 }}
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
                    ✓ Email verified successfully!
                  </div>
                )}
              </>
            )}

            <label>Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              pattern="[0-9]{10}"
              title="Please enter a 10-digit mobile number"
              placeholder="Enter your mobile number"
            />

            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
              <span onClick={() => setShowPassword(!showPassword)} className="toggle-password">
                {showPassword ? <EyeSlash /> : <Eye />}
              </span>
            </div>

            <label>Confirm Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
              />
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading || !otpVerified}
              style={{
                backgroundColor: !otpVerified ? '#ccc' : undefined,
                cursor: !otpVerified ? 'not-allowed' : undefined
              }}
            >
              {loading ? "Creating Account..." : "Signup"}
            </button>

            <div className="auth-footer-text">
              Already have an account? <Link to="/">Login</Link>
            </div>
          </form>
        </div>
      </div>

      <footer className="auth-footer">
        <div>© 2025 YourCompany</div>
        <div className="social-icons">
          <a href="#"><i className="fab fa-facebook-f"></i></a>
          <a href="#"><i className="fab fa-twitter"></i></a>
          <a href="#"><i className="fab fa-google"></i></a>
          <a href="#"><i className="fab fa-linkedin-in"></i></a>
        </div>
      </footer>
    </section>
  );
};

export default Signup;
