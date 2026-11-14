
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, LockKeyhole } from "lucide-react";
import api from "../../services/api";
import { SUPERVISOR_SESSION_KEY } from "../../utils/supervisorAuth";
import "./Login.css";

function SupervisorLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
        role: "supervisor",
      });

      const { token, user } = response.data;

      // Verify login response
      if (!token || !user?._id || user.role !== "supervisor") {
        throw new Error("Invalid login response from server.");
      }

      // Save JWT token
      sessionStorage.setItem("gradtrack-token", token);

      // Remove any previous student session
      sessionStorage.removeItem("gradtrack-current-student");

      // Preserve the existing supervisor session structure
      const supervisorSession = {
        id: user._id,
        email: user.email,
        staffId: user.staffId,
        name: user.fullName,
        role: user.role,
        loggedInAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        SUPERVISOR_SESSION_KEY,
        JSON.stringify(supervisorSession)
      );

      // Allow only supervisor dashboard destinations
      const requestedPath = location.state?.from?.pathname;

      const destination =
        requestedPath?.startsWith("/supervisor/")
          ? requestedPath
          : "/supervisor/dashboard";

      navigate(destination, { replace: true });

    } catch (error) {
      setError(
        error.response?.data?.errors?.[0]?.message ||
          error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background-orb login-orb-one" />
      <div className="login-background-orb login-orb-two" />

      <section className="login-container">
        <Link to="/" className="login-back-link">
          ← Back to account selection
        </Link>

        <Link
          to="/"
          className="login-brand"
          aria-label="Return to account selection"
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

          <h2>Academic Supervisor</h2>
        </div>

        <p className="login-description">
          Sign in to manage and review graduation projects.
        </p>

        {location.state?.registrationSuccess && (
          <p className="login-success-message" role="status">
            {location.state.registrationSuccess}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="supervisorIdentifier">Staff ID</label>

            <input
              id="supervisorIdentifier"
              name="supervisorIdentifier"
              type="text"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setError("");
              }}
              placeholder="Enter your staff ID"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorPassword">Password</label>

            <input
              id="supervisorPassword"
              name="supervisorPassword"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <div className="login-links">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={isLoading}
          >
            <span>{isLoading ? "Signing In..." : "Sign In"}</span>
            {!isLoading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="register-link">
          Don&apos;t have an account?{" "}
          <Link to="/supervisor/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default SupervisorLogin;
