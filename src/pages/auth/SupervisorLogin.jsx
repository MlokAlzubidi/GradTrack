import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, LockKeyhole } from "lucide-react";
import { SUPERVISOR_SESSION_KEY } from "../../utils/supervisorAuth";
import { authenticateSupervisor } from "../../utils/supervisorAssignments";
import "./Login.css";

function SupervisorLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const supervisor = authenticateSupervisor(identifier, password);
    if (!supervisor) {
      setError("Invalid supervisor email or password.");
      return;
    }

    const supervisorSession = {
      id: supervisor.id,
      email: supervisor.email,
      name: supervisor.name,
      role: "supervisor",
      loggedInAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(SUPERVISOR_SESSION_KEY, JSON.stringify(supervisorSession));
      const destination = location.state?.from?.pathname || "/supervisor/dashboard";
      navigate(destination, { replace: true });
    } catch {
      setError("Could not start your session. Please try again.");
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

        <Link to="/" className="login-brand" aria-label="Return to account selection">
          <span className="login-brand-icon">
            <GraduationCap size={27} strokeWidth={1.8} />
          </span>
          <span className="login-brand-name">Grad<span>Track</span></span>
        </Link>

        <p className="login-subtitle">Graduation Project Management System</p>

        <div className="login-heading">
          <span className="login-heading-icon"><LockKeyhole size={17} /></span>
          <h2>Academic Supervisor</h2>
        </div>
        <p className="login-description">Sign in to manage and review graduation projects.</p>

        {location.state?.registrationSuccess && (
          <p className="login-success-message" role="status">
            {location.state.registrationSuccess}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="supervisorIdentifier">University Email or Staff ID</label>
            <input
              id="supervisorIdentifier"
              name="supervisorIdentifier"
              type="text"
              value={identifier}
              onChange={(event) => { setIdentifier(event.target.value); setError(""); }}
              placeholder="Enter your email or staff ID"
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
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="login-links">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="login-submit-button">
            <span>Sign In</span>
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="register-link">
          Don&apos;t have an account? <Link to="/supervisor/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default SupervisorLogin;
