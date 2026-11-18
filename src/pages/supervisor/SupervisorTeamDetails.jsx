import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { MOCK_SUPERVISOR_TEAMS } from "../../data/mockSupervisorTeams";
import { getSupervisorSession } from "../../utils/supervisorAuth";
import {
  getAllSupervisors,
  teamIsAssigned,
} from "../../utils/supervisorAssignments";
import "./SupervisorTeamDetails.css";

function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function TeamDetailsUnavailable({ title, message }) {
  return (
    <div className="supervisor-team-details-page">
      <Link
        className="supervisor-team-details-back"
        to="/supervisor/teams"
      >
        <ArrowLeft size={16} />
        Back to Teams
      </Link>

      <section className="supervisor-team-details-unavailable">
        <div className="supervisor-team-details-unavailable-icon">
          <UsersRound size={27} />
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <Link
          className="supervisor-team-details-return"
          to="/supervisor/teams"
        >
          Return to Teams Directory
        </Link>
      </section>
    </div>
  );
}

function SupervisorTeamDetails() {
  const { teamId } = useParams();
  const supervisor = getSupervisorSession();
  const team = MOCK_SUPERVISOR_TEAMS.find(
    (item) => item.id === teamId
  );

  if (!team) {
    return (
      <TeamDetailsUnavailable
        title="Team not found"
        message="The requested team could not be found."
      />
    );
  }

  if (!teamIsAssigned(team, supervisor?.id)) {
    return (
      <TeamDetailsUnavailable
        title="Access denied"
        message="This team is not assigned to your supervision."
      />
    );
  }

  const assignedSupervisor = getAllSupervisors().find(
    (item) => String(item.id) === String(team.supervisorId)
  );

  return (
    <div className="supervisor-team-details-page">
      <Link
        className="supervisor-team-details-back"
        to="/supervisor/teams"
      >
        <ArrowLeft size={16} />
        Back to Teams
      </Link>

      <header className="supervisor-team-details-header">
        <div className="supervisor-team-details-header-copy">
          <span className="supervisor-team-details-eyebrow">
            TEAM DETAILS
          </span>
          <h2>{team.name}</h2>
          <p>{team.projectTitle}</p>
        </div>

        <div className="supervisor-team-details-header-side">
          <span
            className={`supervisor-team-details-status ${getStatusClass(
              team.status
            )}`}
          >
            {team.status}
          </span>
          <div className="supervisor-team-details-header-icon">
            <UsersRound size={27} strokeWidth={1.7} />
          </div>
        </div>
      </header>

      <section
        className="supervisor-team-details-panel"
        aria-labelledby="supervisor-team-overview-title"
      >
        <div className="supervisor-team-details-panel-heading">
          <div>
            <h3 id="supervisor-team-overview-title">Team Overview</h3>
            <p>Key details about this supervised team</p>
          </div>
          <div className="supervisor-team-details-panel-icon">
            <ClipboardList size={20} />
          </div>
        </div>

        <div className="supervisor-team-overview-grid">
          <article>
            <span>Project Title</span>
            <strong>{team.projectTitle}</strong>
          </article>
          <article>
            <span>Team Status</span>
            <strong>
              <span
                className={`supervisor-team-details-status ${getStatusClass(
                  team.status
                )}`}
              >
                {team.status}
              </span>
            </strong>
          </article>
          <article>
            <span>Members</span>
            <strong>
              {team.memberCount}/{team.capacity}
            </strong>
          </article>
          <article>
            <span>Created</span>
            <strong className="supervisor-team-details-created">
              <CalendarDays size={15} />
              {formatDate(team.createdAt)}
            </strong>
          </article>
        </div>
      </section>

      <section
        className="supervisor-team-details-panel"
        aria-labelledby="supervisor-team-members-title"
      >
        <div className="supervisor-team-details-panel-heading">
          <div>
            <h3 id="supervisor-team-members-title">Team Members</h3>
            <p>
              {team.members.length}{" "}
              {team.members.length === 1 ? "student" : "students"} in
              this team
            </p>
          </div>
          <div className="supervisor-team-details-panel-icon">
            <GraduationCap size={20} />
          </div>
        </div>

        <div className="supervisor-team-members-grid">
          {team.members.map((member) => {
            const initials = member.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("");

            return (
              <article
                className="supervisor-team-member-card"
                key={member.universityId}
              >
                <div
                  className={`supervisor-team-member-avatar ${
                    member.role === "Team Leader" ? "leader" : ""
                  }`}
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div className="supervisor-team-member-copy">
                  <strong>{member.name}</strong>
                  <span>{member.universityId}</span>
                </div>
                <span
                  className={`supervisor-team-member-role ${
                    member.role === "Team Leader" ? "leader" : ""
                  }`}
                >
                  {member.role}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="supervisor-team-details-panel"
        aria-labelledby="supervisor-team-project-title"
      >
        <div className="supervisor-team-details-panel-heading">
          <div>
            <h3 id="supervisor-team-project-title">
              Project Information
            </h3>
            <p>Project overview and supervision details</p>
          </div>
          <div className="supervisor-team-details-panel-icon project">
            <FileText size={20} />
          </div>
        </div>

        <div className="supervisor-team-project-info">
          <article className="supervisor-team-project-description">
            <span>Project Description</span>
            <p>{team.projectDescription}</p>
          </article>
          <article>
            <span>Project Status</span>
            <strong
              className={`supervisor-team-project-status ${getStatusClass(
                team.projectStatus
              )}`}
            >
              {team.projectStatus}
            </strong>
          </article>
          <article>
            <span>Assigned Supervisor</span>
            <strong>
              {assignedSupervisor?.name || "Supervisor information unavailable"}
            </strong>
          </article>
        </div>
      </section>
    </div>
  );
}

export default SupervisorTeamDetails;
