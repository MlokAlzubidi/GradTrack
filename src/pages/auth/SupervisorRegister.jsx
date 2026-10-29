import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, UserPlus } from "lucide-react";
import { registerSupervisor } from "../../utils/supervisorAssignments";
import "./Login.css";

function SupervisorRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = registerSupervisor({ name, email, staffId, password });
    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/supervisor/login", {
      replace: true,
      state: { registrationSuccess: "Your supervisor account is ready. Sign in to continue." },
    });
  }

  return (
    <main className="login-page">
      <div className="login-background-orb login-orb-one" />
      <div className="login-background-orb login-orb-two" />

      <section className="login-container">
        <Link to="/" className="login-brand" aria-label="Return to account selection">
          <span className="login-brand-icon">
            <GraduationCap size={27} strokeWidth={1.8} />
          </span>
          <span className="login-brand-name">Grad<span>Track</span></span>
        </Link>

        <p className="login-subtitle">Graduation Project Management System</p>

        <div className="login-heading">
          <span className="login-heading-icon"><UserPlus size={17} /></span>
          <h2>Create Supervisor Account</h2>
        </div>
        <p className="login-description">Register your academic supervisor account.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="supervisorName">Full Name</label>
            <input
              id="supervisorName"
              name="supervisorName"
              type="text"
              value={name}
              onChange={(event) => { setName(event.target.value); setError(""); }}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorEmail">University Email</label>
            <input
              id="supervisorEmail"
              name="supervisorEmail"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError(""); }}
              placeholder="name@university.edu"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorStaffId">Staff ID <span>(optional)</span></label>
            <input
              id="supervisorStaffId"
              name="supervisorStaffId"
              type="text"
              value={staffId}
              onChange={(event) => { setStaffId(event.target.value); setError(""); }}
              placeholder="Enter your staff ID"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorNewPassword">Password</label>
            <input
              id="supervisorNewPassword"
              name="supervisorNewPassword"
              type="password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supervisorConfirmPassword">Confirm Password</label>
            <input
              id="supervisorConfirmPassword"
              name="supervisorConfirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <button type="submit" className="login-submit-button">
            <span>Create Account</span>
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="register-link">
          Already have an account? <Link to="/supervisor/login">Sign In</Link>
        </p>
      </section>
    </main>
  );
}

export default SupervisorRegister;
