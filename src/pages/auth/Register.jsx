import { Link } from "react-router-dom";
import "./Register.css";

function Register() {
  function handleSubmit(event) {
    event.preventDefault();

    // Registration will be connected to the backend later.
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
              required
            />
          </div>

          <button type="submit">
            Create Account
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