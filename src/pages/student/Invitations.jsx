import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./Invitations.css"; 

function Invitations() {
  // Demo data for frontend testing only.
  // Real invitations will be loaded from the backend.
  const [teamStatus, setTeamStatus] = useState("no-team");

  const [invitations, setInvitations] = useState([
    {
      id: 1,
      teamName: "Graduation Project Team",
      leaderName: "Ahmad Khalil",
      memberCount: 2,
      maxMembers: 4,
    },
    {
      id: 2,
      teamName: "Innovation Team",
      leaderName: "Lina Omar",
      memberCount: 4,
      maxMembers: 4,
    },
  ]);

  const [message, setMessage] = useState("");

  function handleAccept(invitation) {
    if (teamStatus !== "no-team") {
      setMessage("You already belong to a team.");
      return;
    }

    if (invitation.memberCount >= invitation.maxMembers) {
      setMessage("This team has reached its maximum capacity.");
      return;
    }

    setTeamStatus("member");

    setInvitations((currentInvitations) =>
      currentInvitations.filter(
        (item) => item.id !== invitation.id
      )
    );

    setMessage(
      `Demo only: You accepted the invitation to ${invitation.teamName}.`
    );
  }

  function handleDecline(invitation) {
    setInvitations((currentInvitations) =>
      currentInvitations.filter(
        (item) => item.id !== invitation.id
      )
    );

    setMessage(
      `Demo only: You declined the invitation to ${invitation.teamName}.`
    );
  }

  return (
    <div className="invitations-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="invitations-content">
        <header className="invitations-header">
          <p className="invitations-eyebrow">
            TEAM MANAGEMENT
          </p>

          <h1>Team Invitations</h1>

          <p>
            Review invitations and decide which team
            you want to join.
          </p>
        </header>

        <p className="invitations-demo-note">
          These are sample invitations for interface testing.
          Real invitations will be loaded from the backend.
        </p>

        {message && (
          <p className="invitations-message" role="status">
            {message}
          </p>
        )}

        {invitations.length === 0 ? (
          <section className="invitations-empty-state">
            <h2>No pending invitations</h2>

            <p>
              When a team invites you, its invitation
              will appear here.
            </p>
          </section>
        ) : (
          <section className="invitations-list">
            {invitations.map((invitation) => {
              const isFull =
                invitation.memberCount >= invitation.maxMembers;

              return (
                <article
                  className="invitation-card"
                  key={invitation.id}
                >
                  <div className="invitation-details">
                    <h2>{invitation.teamName}</h2>

                    <p>
                      Team Leader: {invitation.leaderName}
                    </p>

                    <p>
                      Team Size: {invitation.memberCount}/
                      {invitation.maxMembers} students
                    </p>

                    {isFull && (
                      <span className="invitation-full-label">
                        Team is full
                      </span>
                    )}
                  </div>

                  <div className="invitation-actions">
                    <button
                      type="button"
                      className="invitation-accept"
                      onClick={() => handleAccept(invitation)}
                      disabled={teamStatus !== "no-team" || isFull}
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="invitation-decline"
                      onClick={() => handleDecline(invitation)}
                    >
                      Decline
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default Invitations;