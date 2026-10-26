import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./CreateTeam.css";
function CreateTeam() {
  const [teamName, setTeamName] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!teamName.trim()) {
      setMessage("Please enter a team name.");
      return;
    }

    setMessage(
      "The form is valid. Team creation will be enabled after backend integration."
    );
  }

  return (
    <div className="create-team-page student-layout">
      <StudentNavbar teamStatus="no-team" />

      <main className="create-team-content">
        <header className="create-team-header">
          <p className="create-team-eyebrow">TEAM MANAGEMENT</p>

          <h1>Create Your Team</h1>

          <p>
            Create a team for your graduation project and start
            organizing your work with your teammates.
          </p>
        </header>

        <section className="create-team-card">
          <h2>Team Information</h2>

          <p>
            You will automatically become the Team Leader
            after the team is successfully created.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="create-team-field">
              <label htmlFor="teamName">Team Name</label>

              <input
                id="teamName"
                name="teamName"
                type="text"
                value={teamName}
                onChange={(event) => {
                  setTeamName(event.target.value);
                  setMessage("");
                }}
                placeholder="Enter your team name"
                maxLength={80}
                required
              />
            </div>

            <div className="create-team-note">
              <strong>Team size</strong>
              <p>
                Each team can have up to four students,
                including the Team Leader.
              </p>
            </div>

            <button type="submit">
              Create Team
            </button>

            {message && (
              <p className="create-team-message" role="status">
                {message}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default CreateTeam;