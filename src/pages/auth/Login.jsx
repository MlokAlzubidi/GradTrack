
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { getAllMockStudents } from "../../data/mockData";

function Login() {
  const navigate = useNavigate();

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

    const currentStudent = {
      universityId: student.universityId,
      name: student.name,
      role: student.role,
      teamStatus: student.teamStatus,
      teamId: student.teamId,
    };

    localStorage.setItem(
      "gradtrack-current-student",
      JSON.stringify(currentStudent)
    );

    navigate("/student/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-container">
        <h1>GradTrack</h1>

        <p className="login-subtitle">
          Graduation Project Management System
        </p>

        <h2>Welcome Back</h2>

        <p>Sign in to continue to your account.</p>

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

          <button type="submit">
            Sign In
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
