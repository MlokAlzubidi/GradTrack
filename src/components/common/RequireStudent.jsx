import { Navigate, useLocation } from "react-router-dom";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";

function readCurrentStudent() {
  try {
    const savedStudent = sessionStorage.getItem(CURRENT_STUDENT_KEY);
    const student = savedStudent ? JSON.parse(savedStudent) : null;

    return student?.role === "student" && student?.universityId
      ? student
      : null;
  } catch {
    return null;
  }
}

function RequireStudent({ children }) {
  const location = useLocation();
  const student = readCurrentStudent();

  if (!student) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

export default RequireStudent;
