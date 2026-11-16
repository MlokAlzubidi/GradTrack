
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, LockKeyhole } from "lucide-react";
import "./Login.css";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    setError("");

    if (!/^\d{11}$/.test(universityId)) {
      setError("University ID must contain exactly 11 digits.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        identifier: universityId,
        password,
        role: "student",
      });

      const { token, user } = response.data;

      // Verify login response
      if (!token || !user?._id || user.role !== "student") {
        throw new Error("Invalid login response from server.");
      }

      // Save JWT token
      sessionStorage.setItem("gradtrack-token", token);

      // Remove any previous supervisor session
      sessionStorage.removeItem("gradtrack-current-supervisor");

      // Save current student information
      const currentStudent = {
        id: user._id,
        universityId: user.universityId,
        name: user.fullName,
        role: user.role,
      };

      sessionStorage.setItem(
        "gradtrack-current-student",
        JSON.stringify(currentStudent)
      );
      setSession(token, user);

      // Allow only student dashboard destinations
      const requestedPath = location.state?.from?.pathname;

      const destination =
        requestedPath?.startsWith("/student/")
          ? requestedPath
          : "/student/dashboard";

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

        {location.state?.registrationSuccess && (
          <p className="login-success-message" role="status">
            {location.state.registrationSuccess}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="universityId">
              University ID
            </label>

            <input
              id="universityId"
              name="universityId"
              type="text"
              placeholder="Enter your 11-digit university ID"
              autoComplete="username"
              inputMode="numeric"
              maxLength={11}
              pattern="[0-9]{11}"
              title="Enter exactly 11 digits (0–9)."
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
          Don't have an account?{" "}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
