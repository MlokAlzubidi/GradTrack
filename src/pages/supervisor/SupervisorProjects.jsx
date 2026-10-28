
import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Search,
  UsersRound,
  CalendarDays,
  FileText,
  BriefcaseBusiness,
  CircleCheck,
  LayoutList,
} from "lucide-react";
import "./SupervisorProjects.css";

const PROJECTS_KEY = "gradtrack-projects";
const TEAMS_KEY = "gradtrack-teams";

function readArray(key) {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadProjectsData() {
  return {
    projects: readArray(PROJECTS_KEY),
    teams: readArray(TEAMS_KEY),
  };
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTeamDetails(project, teams) {
  const team = teams.find(
    (item) => String(item.id) === String(project.teamId)
  );

  if (!team) {
    return {
      name: project.teamName || "Team information unavailable",
      leaderName: "Not specified",
      memberCount: 0,
    };
  }

  const members = Array.isArray(team.members) ? team.members : [];
  const memberIds = Array.isArray(team.memberIds)
    ? team.memberIds
    : [];

  const allMemberIds = new Set(
    [
      team.leaderId,
      ...memberIds,
      ...members.map((member) => member.universityId || member.id),
    ]
      .filter(Boolean)
      .map(String)
  );

  const leader = members.find(
    (member) =>
      String(member.universityId || member.id) ===
      String(team.leaderId)
  );

  return {
    name: team.name || project.teamName || "Unnamed Team",
    leaderName:
      team.leaderName ||
      leader?.name ||
      (team.leaderId ? `ID: ${team.leaderId}` : "Not specified"),
    memberCount: allMemberIds.size,
  };
}

function statusClass(status) {
  return (status || "Registered")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SupervisorProjects() {
  const [data, setData] = useState(loadProjectsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    function refreshProjects() {
      setData(loadProjectsData());
    }

    window.addEventListener("storage", refreshProjects);
    window.addEventListener("focus", refreshProjects);

    return () => {
      window.removeEventListener("storage", refreshProjects);
      window.removeEventListener("focus", refreshProjects);
    };
  }, []);

  const projects = useMemo(() => {
    return data.projects.map((project) => ({
      ...project,
      teamDetails: getTeamDetails(project, data.teams),
    }));
  }, [data]);

  const statuses = useMemo(() => {
    return [
      "All",
      ...new Set(
        projects
          .map((project) => project.status || "Registered")
          .filter(Boolean)
      ),
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesSearch = [
          project.title,
          project.domain,
          project.description,
          project.teamDetails.name,
          project.teamDetails.leaderName,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

        const projectStatus = project.status || "Registered";
        const matchesStatus =
          statusFilter === "All" || projectStatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [projects, searchTerm, statusFilter]);

  const uniqueDomains = new Set(
    projects.map((project) => project.domain).filter(Boolean)
  ).size;

  return (
    <div className="supervisor-projects-page">
      <header className="supervisor-projects-header">
        <div>
          <span className="supervisor-projects-eyebrow">
            PROJECT DIRECTORY
          </span>

          <h2>Assigned Projects</h2>

          <p>
            Explore registered graduation projects and their team
            information.
          </p>
        </div>

        <div className="supervisor-projects-header-icon">
          <FolderKanban size={27} strokeWidth={1.7} />
        </div>
      </header>

      <section
        className="supervisor-projects-stats"
        aria-label="Project statistics"
      >
        <article className="supervisor-project-stat">
          <div className="supervisor-project-stat-icon green">
            <FolderKanban size={21} />
          </div>

          <div>
            <span>Total projects</span>
            <strong>{projects.length}</strong>
            <small>Registered in GradTrack</small>
          </div>
        </article>

        <article className="supervisor-project-stat">
          <div className="supervisor-project-stat-icon sage">
            <BriefcaseBusiness size={21} />
          </div>

          <div>
            <span>Project domains</span>
            <strong>{uniqueDomains}</strong>
            <small>Distinct domains represented</small>
          </div>
        </article>

        <article className="supervisor-project-stat">
          <div className="supervisor-project-stat-icon cream">
            <CircleCheck size={21} />
          </div>

          <div>
            <span>Registered</span>
            <strong>
              {
                projects.filter(
                  (project) =>
                    (project.status || "Registered") === "Registered"
                ).length
              }
            </strong>
            <small>Projects with Registered status</small>
          </div>
        </article>
      </section>

      <section className="supervisor-projects-list-section">
        <div className="supervisor-projects-list-heading">
          <div>
            <h3>Project Directory</h3>
            <p>
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"} found
            </p>
          </div>

          <div className="supervisor-projects-list-icon">
            <LayoutList size={20} />
          </div>
        </div>

        <div className="supervisor-projects-toolbar">
          <label className="supervisor-projects-search">
            <Search size={18} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by project, domain, or team..."
              aria-label="Search projects"
            />
          </label>

          <label className="supervisor-projects-status-filter">
            <span>Status</span>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter projects by status"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All statuses" : status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="supervisor-projects-empty">
            <div className="supervisor-projects-empty-icon">
              <FolderKanban size={28} />
            </div>

            <h3>
              {projects.length === 0
                ? "No projects registered yet"
                : "No projects match your search"}
            </h3>

            <p>
              {projects.length === 0
                ? "Registered team projects will appear here when they are saved in GradTrack."
                : "Try another search term or change the status filter."}
            </p>

            {(searchTerm || statusFilter !== "All") &&
              projects.length > 0 && (
                <button
                  type="button"
                  className="supervisor-projects-reset"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                  }}
                >
                  Clear filters
                </button>
              )}
          </div>
        ) : (
          <div className="supervisor-projects-grid">
            {filteredProjects.map((project) => (
              <article
                className="supervisor-project-card"
                key={project.id || project.teamId}
              >
                <div className="supervisor-project-card-top">
                  <div className="supervisor-project-card-icon">
                    <FileText size={22} />
                  </div>

                  <span
                    className={`supervisor-project-status ${statusClass(
                      project.status || "Registered"
                    )}`}
                  >
                    {project.status || "Registered"}
                  </span>
                </div>

                <div className="supervisor-project-card-body">
                  <span className="supervisor-project-domain">
                    {project.domain || "Domain not specified"}
                  </span>

                  <h3>{project.title || "Untitled Project"}</h3>

                  <p className="supervisor-project-description">
                    {project.description ||
                      "No project description has been provided."}
                  </p>
                </div>

                <div className="supervisor-project-team">
                  <div className="supervisor-project-team-icon">
                    <UsersRound size={18} />
                  </div>

                  <div>
                    <span>Team</span>
                    <strong>{project.teamDetails.name}</strong>
                  </div>
                </div>

                <div className="supervisor-project-meta">
                  <div>
                    <UsersRound size={15} />
                    <span>
                      {project.teamDetails.memberCount}{" "}
                      {project.teamDetails.memberCount === 1
                        ? "member"
                        : "members"}
                    </span>
                  </div>

                  <div>
                    <CalendarDays size={15} />
                    <span>
                      {formatDate(project.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="supervisor-project-leader">
                  <span>Team Leader</span>
                  <strong>{project.teamDetails.leaderName}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="supervisor-projects-demo-note">
        Project information is currently read from this browser's
        local storage. Supervisor-specific project assignments and
        multi-device synchronization have not been implemented yet.
      </p>
    </div>
  );
}

export default SupervisorProjects;
