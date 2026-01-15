import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  const storedRole = localStorage.getItem("role");

  if (!user) return <Navigate to="/login" replace />;

  if (role && storedRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
