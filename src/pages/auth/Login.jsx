import { Link } from "react-router-dom";
import "./Login.css";


function Login() {
  function handleSubmit(event) {
    event.preventDefault();

    // Authentication will be connected to the backend later.
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
              required
            />
          </div>

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