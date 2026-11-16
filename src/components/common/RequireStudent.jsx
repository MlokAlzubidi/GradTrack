import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function RequireStudent({ children }) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, authCheckError, refreshUser } = useAuth();

  if (isLoading) return <div role="status" aria-live="polite">Checking your session…</div>;
  if (authCheckError) {
    return <div role="alert">{authCheckError} <button type="button" onClick={refreshUser}>Retry</button></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user.role !== "student") {
    return <Navigate to="/supervisor/dashboard" replace />;
  }
  return children;
}

export default RequireStudent;
