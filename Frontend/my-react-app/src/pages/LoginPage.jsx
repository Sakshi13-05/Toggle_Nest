import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Linkedin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { BASE_URL } from '../api/config';
import toast from 'react-hot-toast';
import { auth, googleProvider, githubProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { useEffect } from 'react';


const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 🔄 Handle Redirect Result on Mount
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const token = await user.getIdToken();

          // 1. Verify token
          try {
            await fetch(`${BASE_URL}/api/auth/verify`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (verifyErr) {
            console.warn("Verification sub-call failed:", verifyErr);
          }

          // 2. Fetch Role
          const res = await fetch(`${BASE_URL}/api/onboarding/user/${user.email}`);
          const data = await res.json();
          const userData = data?.user;
          const role = userData?.role;
          const onboardingConfirmed = userData?.onboardingComplete;

          localStorage.setItem("user", JSON.stringify({
            email: user.email,
            role: role || null,
            projectId: userData?.projectId || null,
            onboardingComplete: onboardingConfirmed || false,
          }));

          // 3. Navigate
          if (!onboardingConfirmed || !role) {
            toast.error("Account detected. Please complete onboarding.");
            navigate("/onboarding", { replace: true });
          } else if (role.toLowerCase() === "admin") {
            navigate("/admindashboard", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (error) {
        console.error("Redirect Login Error:", error);
        toast.error("Authentication failed. Please try again.");
      }
    };
    handleRedirect();
  }, [navigate]);

  const handleSocialLogin = async (provider) => {
    try {
      let authProvider;
      if (provider === "Google") authProvider = googleProvider;
      else if (provider === "GitHub") authProvider = githubProvider;
      else return;

      // Use Redirect instead of Popup to solve COOP issues permanently
      await signInWithRedirect(auth, authProvider);

    } catch (error) {
      console.error("Social login request failed:", error);
      toast.error("Unable to start social login.");
    }
  };


  const handleEmailLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const token = await user.getIdToken();

      try {
        await fetch(`${BASE_URL}/api/auth/verify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (verifyErr) {
        console.warn("Verification sub-call failed:", verifyErr);
      }

      const res = await fetch(
        `${BASE_URL}/api/onboarding/user/${user.email}`
      );
      const data = await res.json();

      const userData = data?.user;
      const role = userData?.role;
      const onboardingComplete = userData?.onboardingComplete;

      localStorage.setItem(
        "user",
        JSON.stringify({
          email: user.email,
          role: role || null,
          projectId: userData?.projectId || null,
          onboardingComplete: onboardingComplete || false,
        })
      );

      if (!onboardingComplete || !role) {
        toast.error("Account detected. Please complete onboarding.");
        navigate("/onboarding", { replace: true });
      } else if (role.toLowerCase() === "admin") {
        navigate("/admindashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Account detected. Please complete onboarding.");
      navigate("/onboarding", { replace: true });
    }
  };


  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="auth-card"
      >

        {/* LEFT COLUMN: Visual & Branding */}
        <div className="auth-col-left">
          <div className="auth-visual-wrapper">
            <img
              src="https://i.pinimg.com/736x/55/45/45/554545387e48f3771cfdf06c6475a77c.jpg"
              alt="Team Collaboration Visual"
              className="auth-visual-img"
            />
          </div>
          <div className="auth-quote-box">
            <h1 className="auth-quote">Elevate your<br />team's focus.</h1>
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form */}
        <div className="auth-col-right">
          <div className="auth-header">
            <h2 className="auth-title">Welcome to ToggleNest</h2>
            <p className="auth-subtitle">Login to your workspace</p>
          </div>

          {/* Social Stack */}
          <div className="auth-social-stack">
            <button
              className="auth-btn-social"
              onClick={() => handleSocialLogin('Google')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <button
              className="auth-btn-social"
              onClick={() => handleSocialLogin('LinkedIn')}
            >
              <Linkedin size={20} color="#0077b5" fill="#0077b5" />
              Continue with LinkedIn
            </button>
            <button
              className="auth-btn-social"
              onClick={() => handleSocialLogin('GitHub')}
            >
              <Github size={20} />
              Continue with GitHub
            </button>
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin}>
            <div className="auth-form-group">
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={20} />
                <input
                  type="email"
                  className="auth-input-field"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input-field"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="auth-link-row">
              <span className="auth-link-text">Forgot password?</span>
            </div>

            <button type="submit" className="auth-btn-submit">
              Log In
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?
            <span
              className="auth-footer-link"
              onClick={() => navigate('/register')}
            >
              Sign up
            </span>
          </p>

        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
