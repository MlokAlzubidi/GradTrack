
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSupervisorSession } from "../../utils/supervisorAuth";

function RequireSupervisor() {
  const location = useLocation();
  const supervisor = getSupervisorSession();

  if (!supervisor) {
    return (
      <Navigate
        to="/supervisor/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}

export default RequireSupervisor;
