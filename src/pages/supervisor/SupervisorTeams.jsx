import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Search,
  UsersRound,
} from "lucide-react";
import { getSupervisorSession } from "../../utils/supervisorAuth";
import { teamIsAssigned } from "../../utils/supervisorAssignments";
import { MOCK_SUPERVISOR_TEAMS } from "../../data/mockSupervisorTeams";
import "./SupervisorTeams.css";

const TEAM_STATUSES = ["Active", "Pending", "Dissolved"];

function SupervisorTeams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const supervisor = getSupervisorSession();

  const assignedTeams = MOCK_SUPERVISOR_TEAMS.filter((team) =>
    teamIsAssigned(team, supervisor?.id)
  );
  const query = searchTerm.trim().toLowerCase();
  const filteredTeams = assignedTeams.filter((team) => {
    const matchesSearch = [
      team.name,
      team.projectTitle,
      team.leaderName,
    ].some((value) => value.toLowerCase().includes(query));

    return (
      matchesSearch &&
      (statusFilter === "All" || team.status === statusFilter)
    );
  });

  return (
    <div className="supervisor-teams-page">
      <header className="supervisor-teams-header">
        <div>
          <span className="supervisor-teams-eyebrow">
            TEAM DIRECTORY
          </span>

          <h2>Teams Management</h2>

          <p>
            Find a clear overview of the student teams in your
            graduation project workspace.
          </p>
        </div>

        <div className="supervisor-teams-header-icon">
          <UsersRound size={27} strokeWidth={1.7} />
        </div>
      </header>

      <section
        className="supervisor-teams-directory"
        aria-labelledby="supervisor-teams-directory-title"
      >
        <div className="supervisor-teams-directory-heading">
          <div>
            <h3 id="supervisor-teams-directory-title">
              Team Directory
            </h3>
            <p>Teams associated with your supervision</p>
          </div>
        </div>

        <div className="supervisor-teams-toolbar">
          <label className="supervisor-teams-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search teams, projects, or team leaders..."
              aria-label="Search by team name, project title, or team leader"
            />
          </label>

          <label className="supervisor-teams-status-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter teams by status"
            >
              <option value="All">All statuses</option>
              {TEAM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="supervisor-teams-empty">
            <div className="supervisor-teams-empty-icon">
              <UsersRound size={28} />
            </div>

            <h3>
              {assignedTeams.length === 0
                ? "No teams are associated with your supervision"
                : "No teams match your search"}
            </h3>

            <p>
              {assignedTeams.length === 0
                ? "Teams with an accepted supervision assignment will appear here."
                : "Try another search term or change the status filter."}
            </p>
          </div>
        ) : (
          <>
            <p className="supervisor-teams-scroll-hint">
              Scroll horizontally to view all team details
            </p>
            <div className="supervisor-teams-table-scroll">
              <table className="supervisor-teams-table">
                <thead>
                  <tr>
                    <th scope="col">Team Name</th>
                    <th scope="col">Project Title</th>
                    <th scope="col">Team Leader</th>
                    <th scope="col">Members Count</th>
                    <th scope="col">Team Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team) => (
                    <tr key={team.id}>
                      <td data-label="Team Name">
                        <strong className="supervisor-teams-name">
                          {team.name}
                        </strong>
                      </td>
                      <td data-label="Project Title">
                        {team.projectTitle}
                      </td>
                      <td data-label="Team Leader">
                        {team.leaderName}
                      </td>
                      <td data-label="Members Count">
                        {team.memberCount}/{team.capacity}
                      </td>
                      <td data-label="Team Status">
                        <span
                          className={`supervisor-teams-status ${team.status.toLowerCase()}`}
                        >
                          {team.status}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <Link
                          to={`/supervisor/teams/${encodeURIComponent(team.id)}`}
                          className="supervisor-teams-view-button"
                          aria-label={`View details for ${team.name}`}
                        >
                          <Eye size={15} />
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default SupervisorTeams;
