import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./MyTeam.css";

function MyTeam() {
  // Team information will come from the backend later.
  const team = null;

  return (
    <div className="my-team-page">
      <StudentNavbar teamStatus="no-team" />

      <main className="my-team-content">
        <header className="my-team-header">
          <p className="my-team-eyebrow">TEAM MANAGEMENT</p>

          <h1>My Team</h1>

          <p>
            View your graduation team, its members,
            and team information.
          </p>
        </header>

        {!team ? (
          <section className="my-team-page student-layout">
            <div className="my-team-empty-icon" aria-hidden="true">
              🎓
            </div>

            <h2>You are not part of a team yet</h2>

            <p>
              Create a new team or check your invitations
              to get started with your graduation project.
            </p>

            <div className="my-team-actions">
  <Link
    to="/student/invitations"
    className="my-team-secondary-link"
  >
    View Invitations
  </Link>
</div>
          </section>
        ) : (
          <section className="my-team-details">
            <h2>{team.name}</h2>
            <p>Team details and members will appear here.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default MyTeam;