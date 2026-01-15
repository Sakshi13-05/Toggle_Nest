import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, ArrowRight } from "lucide-react";
import { auth } from "../firebase";   // ✅ REQUIRED
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();



  return (
    <div className="tn-page">
      {/* Navigation Header */}
      <header className="tn-header">
        <div className="tn-brand" onClick={() => navigate("/")}>
          <Layers size={24} color="#111827" strokeWidth={2.5} />
          <span className="tn-brand-text">ToggleNest</span>
        </div>

        <nav className="tn-nav-right">
          <button className="tn-link" onClick={() => navigate("/login")}>
            Sign In
          </button>
          <button className="tn-btn-black" onClick={() => navigate("/register")}>
            Sign Up
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="tn-hero">
        <div className="tn-hero-visual">
          <img
            src="https://i.pinimg.com/736x/ca/cc/2c/cacc2c99880fea254bb835e7702c5a1f.jpg"
            alt="Modern Productivity Desk"
            className="tn-hero-img"
          />
        </div>

        <div className="tn-hero-content">
          <h1 className="tn-hero-headline">
            Master your workflow.<br />
            Start your day with clarity.
          </h1>
          <p className="tn-hero-subtext">
            The collaborative workspace that nests your team's tasks and progress in one beautiful, intuitive interface.
          </p>
          <button className="tn-btn-large" onClick={() => navigate("/register")}>
            Get Started
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
