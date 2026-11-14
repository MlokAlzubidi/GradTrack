
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    setError("");

    const trimmedName = name.trim();
    const trimmedUniversityId = universityId.trim();

    if (!trimmedName || !trimmedUniversityId) {
      setError("Please enter your full name and university ID.");
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
        universityId: trimmedUniversityId,
        password,
        role: "student",
      });

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess:
            "Your account has been created successfully. Please sign in.",
        },
      });

    } catch (error) {
      const responseData = error.response?.data;

      setError(
        responseData?.errors?.[0]?.message ||
          responseData?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-container">
        <h1>GradTrack</h1>

        <p className="register-subtitle">
          Graduation Project Management System
        </p>

        <h2>Create Your Account</h2>

        <p>Register to get started with GradTrack.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="universityId">University ID</label>

            <input
              id="universityId"
              name="universityId"
              type="text"
              placeholder="Enter your university ID"
              autoComplete="username"
              value={universityId}
              onChange={(event) => {
                setUniversityId(event.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
              required
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <Link to="/login">Sign In</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
