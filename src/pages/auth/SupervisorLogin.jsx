import { Link } from "react-router-dom";
import "./SupervisorLogin.css";
function SupervisorLogin() {
  function handleSubmit(event) {
    event.preventDefault();

    // Supervisor authentication will be connected
    // to the backend later.
  }

  return (
    <main className="supervisor-login-page">
      <section className="supervisor-login-container">
        <Link
          to="/"
          className="supervisor-back-link"
        >
          ← Back to account selection
        </Link>

        <h1>GradTrack</h1>

        <p className="supervisor-login-subtitle">
          Graduation Project Management System
        </p>

        <div className="supervisor-heading">
          <h2>Academic Supervisor</h2>

          <p>
            Sign in to manage and review graduation projects.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="supervisor-form-group">
            <label htmlFor="supervisorEmail">
              University Email or Staff ID
            </label>

            <input
              id="supervisorEmail"
              name="supervisorEmail"
              type="text"
              placeholder="Enter your email or staff ID"
              autoComplete="username"
              required
            />
          </div>

          <div className="supervisor-form-group">
            <label htmlFor="supervisorPassword">
              Password
            </label>

            <input
              id="supervisorPassword"
              name="supervisorPassword"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="supervisor-forgot-link">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button type="submit">
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}

export default SupervisorLogin;