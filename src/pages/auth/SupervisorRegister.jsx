
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, UserPlus } from "lucide-react";
import api from "../../services/api";
import "./Login.css";

function SupervisorRegister() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedStaffId = staffId.trim();

    if (!trimmedName || !trimmedStaffId) {
      setError("Please enter your full name and staff ID.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        fullName: trimmedName,
        email: trimmedEmail || undefined,
        staffId: trimmedStaffId,
        password,
        role: "supervisor",
      });

      navigate("/supervisor/login", {
        replace: true,
        state: {
          registrationSuccess:
            "Your supervisor account is ready. Sign in to continue.",
        },
      });

    } catch (error) {
      setError(
        error.response?.data?.errors?.[0]?.message ||
          error.response?.data?.message ||
          "Registration failed. Please try again."
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
            <UserPlus size={17} />
          </span>
          <h2>Create Supervisor Account</h2>
        </div>

        <p className="login-description">
          Register your academic supervisor account.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="supervisorName">Full Name</label>
            <input
              id="supervisorName"
              name="supervisorName"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorEmail">
              University Email <span>(optional)</span>
            </label>
            <input
              id="supervisorEmail"
              name="supervisorEmail"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="name@university.edu"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorStaffId">Staff ID</label>
            <input
              id="supervisorStaffId"
              name="supervisorStaffId"
              type="text"
              value={staffId}
              onChange={(event) => {
                setStaffId(event.target.value);
                setError("");
              }}
              placeholder="Enter your staff ID"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorNewPassword">Password</label>
            <input
              id="supervisorNewPassword"
              name="supervisorNewPassword"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorConfirmPassword">
              Confirm Password
            </label>
            <input
              id="supervisorConfirmPassword"
              name="supervisorConfirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit-button"
            disabled={isLoading}
          >
            <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
            {!isLoading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="register-link">
          Already have an account?{" "}
          <Link to="/supervisor/login">Sign In</Link>
        </p>
      </section>
    </main>
  );
}

export default SupervisorRegister;
