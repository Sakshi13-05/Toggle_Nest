import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/Admin_Dashboard";
import ViewProfile from "./pages/Profile";
import { DashboardProvider } from "./context/DashboardContext";
import Progress from "./pages/Progress";
import ViewHistory from "./components/ActivityLog"
import ProtectedRoute from "./context/ProtectRoute";
import PublicRoute from "./context/PublicRoute";
import ActivityLog from "./components/ActivityLog";

// --- Role Transition Loader Component ---
const RoleTransitionLoader = ({ role = "User" }) => {
  useEffect(() => {
    // Add any necessary body styling when loader is active
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex items-center justify-center mb-6"
      >
        <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-xl">
          <Loader2 className="text-white animate-spin" size={36} />
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-black mb-2">Configuring {role} Workspace...</h2>
        <p className="text-gray-400 font-medium">Your personalized nest is almost ready.</p>
      </motion.div>
    </div>
  );
};

// --- Generic Spinner for initial loads ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <Loader2 className="text-black animate-spin" size={48} />
  </div>
);

// --- Dashboard Router Logic (PURE VIEW) ---
const DashboardRouter = ({ userData }) => {
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsTransitioning(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isTransitioning) {
    const role = userData?.role?.toLowerCase();
    const displayRole = role === 'admin' ? 'Admin' : 'Member';
    return <RoleTransitionLoader role={displayRole} />;
  }

  if (userData?.role?.toLowerCase() === 'admin') {
    return (
      <DashboardProvider>
        <AdminDashboard user={userData} />
      </DashboardProvider>
    );
  } else {
    return <Dashboard user={userData} />;
  }
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [fullUserData, setFullUserData] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [syncLoading, setSyncLoading] = useState(true);

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/onboarding/user/${user.email}`);
      const backendUser = res.data?.user;
      if (backendUser) {
        if (backendUser.role) backendUser.role = backendUser.role.toLowerCase();
        setFullUserData(backendUser);
        localStorage.setItem('user', JSON.stringify(backendUser));
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    if (user) refreshUser();
    else {
      setFullUserData(null);
      setSyncLoading(false);
      localStorage.removeItem('user');
    }
  }, [user]);

  if (authLoading || (syncLoading && !fullUserData)) {
    return <LoadingSpinner />;
  }

  const isOnboarded = fullUserData?.onboardingComplete || fullUserData?.onboardingCompleted;
  const role = fullUserData?.role?.toLowerCase();

  return (
    <Routes>
      <Route path="/" element={
        !user ? <LandingPage /> :
          !isOnboarded ? <Navigate to="/onboarding" replace /> :
            role === 'admin' ? <Navigate to="/admindashboard" replace /> : <Navigate to="/dashboard" replace />
      } />

      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />

      <Route path="/onboarding" element={
        user ? (
          isOnboarded ? (
            role === 'admin' ? <Navigate to="/admindashboard" replace /> : <Navigate to="/dashboard" replace />
          ) : <OnboardingPage refreshUser={refreshUser} />
        ) : <Navigate to="/login" replace />
      } />

      <Route path="/dashboard" element={
        user ? (
          !isOnboarded ? <Navigate to="/onboarding" replace /> :
            role === 'admin' ? <Navigate to="/admindashboard" replace /> : <DashboardRouter userData={fullUserData} />
        ) : <Navigate to="/" replace />
      } />

      <Route path="/admindashboard" element={
        user ? (
          !isOnboarded ? <Navigate to="/onboarding" replace /> :
            role === 'member' ? <Navigate to="/dashboard" replace /> : <DashboardRouter userData={fullUserData} />
        ) : <Navigate to="/login" replace />
      } />

      <Route path="/profile" element={user ? <ViewProfile /> : <Navigate to="/" replace />} />
      <Route path="/progress" element={user ? <Progress /> : <Navigate to="/login" replace />} />
      <Route path="/history/:projectId" element={user ? <ActivityLog /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}