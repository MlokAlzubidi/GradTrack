
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SUPERVISOR_SESSION_KEY } from "../../utils/supervisorAuth";
import "./SupervisorLogin.css";

const DEMO_SUPERVISOR = {
  email: "supervisor@gradtrack.demo",
  password: "Supervisor123!",
  name: "Academic Supervisor",
  role: "supervisor",
};

function SupervisorLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [supervisorPassword, setSupervisorPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const email = supervisorEmail.trim();
    const password = supervisorPassword;

    if (
      email.toLowerCase() !== DEMO_SUPERVISOR.email.toLowerCase() ||
      password !== DEMO_SUPERVISOR.password
    ) {
      setErrorMessage(
        "Invalid demo credentials. Please check the details below."
      );
      return;
    }

    const supervisorSession = {
      id: "demo-supervisor",
      email: DEMO_SUPERVISOR.email,
      name: DEMO_SUPERVISOR.name,
      role: DEMO_SUPERVISOR.role,
      loggedInAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(
        SUPERVISOR_SESSION_KEY,
        JSON.stringify(supervisorSession)
      );

      const destination =
        location.state?.from?.pathname || "/supervisor/dashboard";

      navigate(destination, { replace: true });
    } catch {
      setErrorMessage(
        "Could not start the session in this browser. Please try again."
      );
    }
  }

  return (
    <main className="supervisor-login-page">
      <section className="supervisor-login-container">
        <Link to="/" className="supervisor-back-link">
          ← Back to account selection
        </Link>

        <h1>GradTrack</h1>

        <p className="supervisor-login-subtitle">
          Graduation Project Management System
        </p>

        <div className="supervisor-heading">
          <h2>Academic Supervisor</h2>
          <p>Sign in to manage and review graduation projects.</p>
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
              value={supervisorEmail}
              onChange={(event) => {
                setSupervisorEmail(event.target.value);
                setErrorMessage("");
              }}
              placeholder="Enter your email or staff ID"
              autoComplete="username"
              required
            />
          </div>

          <div className="supervisor-form-group">
            <label htmlFor="supervisorPassword">Password</label>

            <input
              id="supervisorPassword"
              name="supervisorPassword"
              type="password"
              value={supervisorPassword}
              onChange={(event) => {
                setSupervisorPassword(event.target.value);
                setErrorMessage("");
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="supervisor-forgot-link">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {errorMessage && (
            <p
              className="supervisor-login-message"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <button type="submit">Sign In</button>
        </form>

        <aside className="supervisor-demo-credentials">
          <strong>Demo account — frontend prototype</strong>
          <p>
            <span>Email:</span> supervisor@gradtrack.demo
          </p>
          <p>
            <span>Password:</span> Supervisor123!
          </p>
        </aside>
      </section>
    </main>
  );
}

export default SupervisorLogin;
