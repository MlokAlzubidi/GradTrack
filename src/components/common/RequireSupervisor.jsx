import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function RequireSupervisor() {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, authCheckError, refreshUser } = useAuth();

  if (isLoading) return <div role="status" aria-live="polite">Checking your session…</div>;
  if (authCheckError) {
    return <div role="alert">{authCheckError} <button type="button" onClick={refreshUser}>Retry</button></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/supervisor/login" replace state={{ from: location }} />;
  }
  if (user.role !== "supervisor") {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Outlet />;
}

export default RequireSupervisor;
