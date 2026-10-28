import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, LockKeyhole } from "lucide-react";
import "./Login.css";
import { getAllMockStudents } from "../../data/mockData";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const students = getAllMockStudents();

    const student = students.find(
      (student) =>
        student.universityId === universityId.trim() &&
        student.password === password
    );

    if (!student) {
      setError("Invalid university ID or password.");
      return;
    }

    let savedProfileName = student.name;

    try {
      const savedOverrides = localStorage.getItem(
        "gradtrack-student-profile-overrides"
      );

      const profileOverrides = savedOverrides
        ? JSON.parse(savedOverrides)
        : {};

      const editedName =
        profileOverrides?.[student.universityId]?.name;

      if (
        typeof editedName === "string" &&
        editedName.trim()
      ) {
        savedProfileName = editedName.trim();
      }
    } catch {
      // Use the original account name if the saved override cannot be read.
    }

    const currentStudent = {
      universityId: student.universityId,
      name: savedProfileName,
      role: student.role,
      teamStatus: student.teamStatus,
      teamId: student.teamId,
    };

    // Keep the signed-in account isolated to this browser tab.
    sessionStorage.setItem(
      "gradtrack-current-student",
      JSON.stringify(currentStudent)
    );

    const destination = location.state?.from?.pathname || "/student/dashboard";
    navigate(destination, { replace: true });
  }

  return (
    <main className="login-page">
      <div className="login-background-orb login-orb-one" />
      <div className="login-background-orb login-orb-two" />

      <section className="login-container">
        <Link
          to="/"
          className="login-brand"
          aria-label="Return to GradTrack home"
        >
          <span className="login-brand-icon">
            <GraduationCap size={27} strokeWidth={1.8} />
          </span>

          <span className="login-brand-name">
            Grad<span>Track</span>
          </span>
        </Link>

        <p className="login-subtitle">
          Graduation Project Management System
        </p>

        <div className="login-heading">
          <span className="login-heading-icon">
            <LockKeyhole size={17} />
          </span>

          <h2>Welcome Back</h2>
        </div>

        <p className="login-description">
          Sign in to continue to your account.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="universityId">
              University ID
            </label>

            <input
              id="universityId"
              name="universityId"
              type="text"
              placeholder="Enter your university ID"
              autoComplete="username"
              value={universityId}
              onChange={(event) =>
                setUniversityId(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <div className="login-links">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="login-submit-button">
            <span>Sign In</span>
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="register-link">
          Don't have an account?{" "}
          <Link to="/register">
            Create an account
          </Link>
        </p>

        <div className="login-card-footer">
          <span className="login-footer-dot" />
          Your graduation journey starts here
        </div>
      </section>
    </main>
  );
}

export default Login;