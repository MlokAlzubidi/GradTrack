
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  FileCheck2,
  Files,
  CheckCircle2,
  Clock3,
  ArrowUpRight,
  GraduationCap,
  RefreshCw,
  FileText,
  UsersRound,
  ClipboardCheck,
} from "lucide-react";
import { getSupervisorSession } from "../../utils/supervisorAuth";
import "./SupervisorDashboard.css";

const PROJECTS_KEY = "gradtrack-projects";
const PROPOSALS_KEY = "gradtrack-proposals";
const TASKS_KEY = "gradtrack-team-tasks";
const TEAMS_KEY = "gradtrack-teams";

function readArray(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadDashboardData() {
  return {
    projects: readArray(PROJECTS_KEY),
    proposals: readArray(PROPOSALS_KEY),
    tasks: readArray(TASKS_KEY),
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
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getProjectTitle(project) {
  return (
    project?.title ||
    project?.projectTitle ||
    project?.name ||
    "Untitled Project"
  );
}

function getProposalTitle(proposal) {
  return (
    proposal?.projectTitle ||
    proposal?.title ||
    "Untitled Project"
  );
}

function getProposalStatus(proposal) {
  return proposal?.status || "Pending Review";
}

function getTaskSubmissions(tasks) {
  return tasks.flatMap((task) => {
    if (!Array.isArray(task.submissions)) return [];

    return task.submissions
      .filter((submission) => submission?.fileData)
      .map((submission, index) => ({
        id:
          submission.id ||
          `${task.id}-${submission.studentId || index}`,
        taskTitle: task.title || "Untitled Task",
        studentName: submission.studentName || "Team Member",
        teamId: task.teamId,
        fileName: submission.fileName || "Submitted file",
        submittedAt: submission.submittedAt || "",
        reviewStatus:
          submission.reviewStatus || "Pending Review",
      }));
  });
}

function sortNewest(items, dateField) {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField] || 0).getTime();
    const dateB = new Date(b[dateField] || 0).getTime();
    return dateB - dateA;
  });
}

function SupervisorDashboard() {
  const supervisor = getSupervisorSession();
  const [data, setData] = useState(loadDashboardData);

  function refreshData() {
    setData(loadDashboardData());
  }

  useEffect(() => {
    function handleStorage(event) {
      if (
        !event.key ||
        [
          PROJECTS_KEY,
          PROPOSALS_KEY,
          TASKS_KEY,
          TEAMS_KEY,
        ].includes(event.key)
      ) {
        refreshData();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshData);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshData);
    };
  }, []);

  const submissions = useMemo(
    () => getTaskSubmissions(data.tasks),
    [data.tasks]
  );

  const pendingProposals = data.proposals.filter(
    (proposal) => getProposalStatus(proposal) === "Pending Review"
  );

  const approvedProposals = data.proposals.filter(
    (proposal) => getProposalStatus(proposal) === "Approved"
  );

  const pendingSubmissions = submissions.filter(
    (submission) =>
      submission.reviewStatus === "Pending Review"
  );

  const revisionRequests = submissions.filter(
    (submission) =>
      submission.reviewStatus === "Changes Requested"
  );

  const recentProposals = useMemo(
    () =>
      sortNewest(
        data.proposals,
        "submittedAt"
      ).slice(0, 4),
    [data.proposals]
  );

  const recentSubmissions = useMemo(
    () =>
      sortNewest(
        submissions,
        "submittedAt"
      ).slice(0, 4),
    [submissions]
  );

  return (
    <div className="supervisor-dashboard-page">
      <header className="supervisor-dashboard-welcome">
        <div className="supervisor-dashboard-welcome-copy">
          <span className="supervisor-dashboard-eyebrow">
            OVERVIEW
          </span>

          <h2>
            Welcome back,{" "}
            {supervisor?.name || "Academic Supervisor"}
          </h2>

          <p>
            Here is an overview of graduation projects, proposal
            reviews, and student task submissions.
          </p>
        </div>

        <div className="supervisor-dashboard-welcome-art">
          <div className="supervisor-dashboard-art-glow" />
          <GraduationCap size={54} strokeWidth={1.4} />
          <span>GRADTRACK</span>
        </div>
      </header>

      <div className="supervisor-dashboard-section-heading">
        <div>
          <h3>Workspace Overview</h3>
          <p>Current activity from the saved project records</p>
        </div>

        <button
          type="button"
          className="supervisor-dashboard-refresh"
          onClick={refreshData}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <section
        className="supervisor-dashboard-stats"
        aria-label="Workspace statistics"
      >
        <article className="supervisor-dashboard-stat-card">
          <div className="supervisor-dashboard-stat-top">
            <div className="supervisor-dashboard-stat-icon projects">
              <FolderKanban size={21} />
            </div>
            <span className="supervisor-dashboard-stat-label">
              PROJECTS
            </span>
          </div>

          <strong className="supervisor-dashboard-stat-number">
            {data.projects.length}
          </strong>

          <p>Registered projects</p>

          <Link to="/supervisor/projects">
            View projects <ArrowUpRight size={14} />
          </Link>
        </article>

        <article className="supervisor-dashboard-stat-card">
          <div className="supervisor-dashboard-stat-top">
            <div className="supervisor-dashboard-stat-icon proposals">
              <FileCheck2 size={21} />
            </div>
            <span className="supervisor-dashboard-stat-label">
              PROPOSALS
            </span>
          </div>

          <strong className="supervisor-dashboard-stat-number">
            {pendingProposals.length}
          </strong>

          <p>Awaiting review</p>

          <Link to="/supervisor/proposals">
            Review proposals <ArrowUpRight size={14} />
          </Link>
        </article>

        <article className="supervisor-dashboard-stat-card">
          <div className="supervisor-dashboard-stat-top">
            <div className="supervisor-dashboard-stat-icon submissions">
              <Files size={21} />
            </div>
            <span className="supervisor-dashboard-stat-label">
              SUBMISSIONS
            </span>
          </div>

          <strong className="supervisor-dashboard-stat-number">
            {pendingSubmissions.length}
          </strong>

          <p>Task files awaiting review</p>

          <Link to="/supervisor/submissions">
            Review submissions <ArrowUpRight size={14} />
          </Link>
        </article>

        <article className="supervisor-dashboard-stat-card">
          <div className="supervisor-dashboard-stat-top">
            <div className="supervisor-dashboard-stat-icon approved">
              <CheckCircle2 size={21} />
            </div>
            <span className="supervisor-dashboard-stat-label">
              APPROVED
            </span>
          </div>

          <strong className="supervisor-dashboard-stat-number">
            {approvedProposals.length}
          </strong>

          <p>Approved proposals</p>

          <Link to="/supervisor/proposals">
            View decisions <ArrowUpRight size={14} />
          </Link>
        </article>
      </section>

      <section className="supervisor-dashboard-secondary-stats">
        <article>
          <div className="supervisor-dashboard-secondary-icon">
            <UsersRound size={20} />
          </div>
          <div>
            <span>Teams</span>
            <strong>{data.teams.length}</strong>
          </div>
        </article>

        <article>
          <div className="supervisor-dashboard-secondary-icon revision">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Revisions requested</span>
            <strong>{revisionRequests.length}</strong>
          </div>
        </article>

        <article>
          <div className="supervisor-dashboard-secondary-icon reviewed">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <span>Task submissions reviewed</span>
            <strong>
              {
                submissions.filter(
                  (item) => item.reviewStatus === "Reviewed"
                ).length
              }
            </strong>
          </div>
        </article>
      </section>

      <section className="supervisor-dashboard-activity-grid">
        <article className="supervisor-dashboard-activity-panel">
          <div className="supervisor-dashboard-panel-heading">
            <div className="supervisor-dashboard-panel-icon">
              <FileText size={19} />
            </div>

            <div>
              <h3>Recent Proposals</h3>
              <p>Latest submitted project proposals</p>
            </div>

            <Link
              to="/supervisor/proposals"
              aria-label="View all proposals"
              title="View all proposals"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>

          {recentProposals.length === 0 ? (
            <div className="supervisor-dashboard-empty">
              <FileCheck2 size={25} />
              <strong>No proposals yet</strong>
              <span>
                Submitted proposals will appear here.
              </span>
            </div>
          ) : (
            <div className="supervisor-dashboard-activity-list">
              {recentProposals.map((proposal, index) => {
                const status = getProposalStatus(proposal);

                const statusClass = status
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");

                return (
                  <div
                    className="supervisor-dashboard-activity-item"
                    key={
                      proposal.id ||
                      `${proposal.teamId || "proposal"}-${index}`
                    }
                  >
                    <div className="supervisor-dashboard-activity-file">
                      <FileText size={18} />
                    </div>

                    <div className="supervisor-dashboard-activity-copy">
                      <strong>{getProposalTitle(proposal)}</strong>
                      <span>
                        {proposal.teamName || "Team not specified"}
                        {" · "}
                        {formatDate(
                          proposal.submittedAt ||
                          proposal.updatedAt
                        )}
                      </span>
                    </div>

                    <span
                      className={`supervisor-dashboard-status ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            className="supervisor-dashboard-panel-footer"
            to="/supervisor/proposals"
          >
            Open proposal reviews
            <ArrowUpRight size={15} />
          </Link>
        </article>

        <article className="supervisor-dashboard-activity-panel">
          <div className="supervisor-dashboard-panel-heading">
            <div className="supervisor-dashboard-panel-icon submissions">
              <Files size={19} />
            </div>

            <div>
              <h3>Recent Submissions</h3>
              <p>Latest student task uploads</p>
            </div>

            <Link
              to="/supervisor/submissions"
              aria-label="View all submissions"
              title="View all submissions"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="supervisor-dashboard-empty">
              <Files size={25} />
              <strong>No submissions yet</strong>
              <span>
                Student task uploads will appear here.
              </span>
            </div>
          ) : (
            <div className="supervisor-dashboard-activity-list">
              {recentSubmissions.map((submission) => {
                const status = submission.reviewStatus;

                const statusClass = status
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");

                return (
                  <div
                    className="supervisor-dashboard-activity-item"
                    key={submission.id}
                  >
                    <div className="supervisor-dashboard-activity-file">
                      <FileText size={18} />
                    </div>

                    <div className="supervisor-dashboard-activity-copy">
                      <strong>{submission.taskTitle}</strong>
                      <span>
                        {submission.studentName}
                        {" · "}
                        {formatDate(submission.submittedAt)}
                      </span>
                    </div>

                    <span
                      className={`supervisor-dashboard-status ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            className="supervisor-dashboard-panel-footer"
            to="/supervisor/submissions"
          >
            Open task submissions
            <ArrowUpRight size={15} />
          </Link>
        </article>
      </section>

      <p className="supervisor-dashboard-data-note">
        Figures are calculated from records saved in this browser.
        Project assignments and multi-device synchronization have not
        been implemented yet.
      </p>
    </div>
  );
}

export default SupervisorDashboard;
