import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./ManageTeam.css";

function ManageTeam() {
  // Temporary demo data.
  // Real team data will come from the backend later.
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Malak Mohammad",
      universityId: "STU001",
      role: "Team Leader",
    },
    {
      id: 2,
      name: "Ahmad Khalil",
      universityId: "STU002",
      role: "Member",
    },
    {
      id: 3,
      name: "Lina Omar",
      universityId: "STU003",
      role: "Member",
    },
  ]);

  const [message, setMessage] = useState("");

  function handleRemoveMember(member) {
    if (member.role === "Team Leader") {
      setMessage("The Team Leader cannot be removed here.");
      return;
    }

    setMembers((currentMembers) =>
      currentMembers.filter((item) => item.id !== member.id)
    );

    setMessage(
      `${member.name} was removed in this demo.`
    );
  }

  return (
    <div className="manage-team-page student-layout">
      <StudentNavbar teamStatus="leader" />

      <main className="manage-team-content">
        <header className="manage-team-header">
          <p className="manage-team-eyebrow">
            TEAM MANAGEMENT
          </p>

          <h1>Manage Team</h1>

          <p>
            View your team members and manage team membership.
          </p>
        </header>

        <section className="manage-team-summary">
          <div>
            <h2>Graduation Project Team</h2>
            <p>Team Leader: Malak Mohammad</p>
          </div>

          <div className="manage-team-capacity">
            <span>Team Size</span>
            <strong>{members.length} / 4</strong>
          </div>
        </section>

        {message && (
          <p className="manage-team-message" role="status">
            {message}
          </p>
        )}

        <section className="manage-team-members">
          <div className="manage-team-section-header">
            <h2>Team Members</h2>
            <span>{members.length} students</span>
          </div>

          {members.map((member) => (
            <article
              className="manage-team-member"
              key={member.id}
            >
              <div className="manage-team-avatar" aria-hidden="true">
                {member.name.charAt(0)}
              </div>

              <div className="manage-team-member-info">
                <h3>{member.name}</h3>
                <p>University ID: {member.universityId}</p>
              </div>

              <span
                className={
                  member.role === "Team Leader"
                    ? "manage-team-role leader"
                    : "manage-team-role"
                }
              >
                {member.role}
              </span>

              {member.role !== "Team Leader" && (
                <button
                  type="button"
                  className="manage-team-remove"
                  onClick={() => handleRemoveMember(member)}
                >
                  Remove
                </button>
              )}
            </article>
          ))}
        </section>

        <p className="manage-team-demo-note">
          Demo data only. Team membership changes will be
          processed and authorized by the backend later.
        </p>
      </main>
    </div>
  );
}

export default ManageTeam;