
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  // Student information
  const [name, setName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error message
  const [error, setError] = useState("");

  // Handle registration form submission
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedUniversityId = universityId.trim();

    // Validate name and university ID
    if (!trimmedName || !trimmedUniversityId) {
      setError("Please enter your full name and university ID.");
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Send registration data to Backend
      await api.post("/auth/register", {
        fullName: trimmedName,
        universityId: trimmedUniversityId,
        password,
        role: "student",
      });

      // Redirect to login after successful registration
      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess:
            "Your account has been created successfully. Please sign in.",
        },
      });

    } catch (error) {
      // Read detailed validation errors from Backend
      const responseData = error.response?.data;

      const validationMessage =
        responseData?.errors?.[0]?.message;

      setError(
        validationMessage ||
          responseData?.message ||
          "Registration failed. Please try again."
      );
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
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          {/* University ID */}
          <div className="form-group">
            <label htmlFor="universityId">University ID</label>

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

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {/* Confirm Password */}
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
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button type="submit">
            Create Account
          </button>
        </form>

        {/* Login Link */}
        <p className="login-link">
          Already have an account?{" "}
          <Link to="/login">Sign In</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
