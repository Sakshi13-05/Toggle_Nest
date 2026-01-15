import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PublicRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (!userData?.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return userData.role === "admin"
      ? <Navigate to="/admindashboard" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
