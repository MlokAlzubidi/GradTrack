import { Link } from "react-router-dom";
import "./RoleSelection.css";

function RoleSelection() {
  return (
    <main className="role-selection-page">
      <section className="role-selection-container">
        <h1>GradTrack</h1>

        <p className="role-selection-subtitle">
          Graduation Project Management System
        </p>

        <h2>Welcome to GradTrack</h2>

        <p className="role-selection-description">
          Choose your account type to continue.
        </p>

        <div className="role-options">
          <Link to="/login" className="role-option">
            <span className="role-option-icon">🎓</span>

           <span className="role-option-title">
  Student
</span>

<span className="role-option-description">
  Sign in with your student account. Your team role depends
  on your actual team membership.
</span>
          </Link>

          <Link
            to="/supervisor/login"
            className="role-option"
          >
            <span className="role-option-icon">👩‍🏫</span>

            <span className="role-option-title">
              Academic Supervisor
            </span>

            <span className="role-option-description">
              Review proposals and monitor graduation projects.
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default RoleSelection;