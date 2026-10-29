
import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./ProposalStatus.css";

// مفاتيح البيانات المشتركة بين صفحات GradTrack.
const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const PROJECTS_STORAGE_KEY = "gradtrack-projects";
const PROPOSALS_STORAGE_KEY = "gradtrack-proposals";

// قراءة البيانات المحفوظة من المتصفح بأمان.
function readLocalData(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);

    return savedValue === null
      ? fallback
      : JSON.parse(savedValue);
  } catch {
    return fallback;
  }
}

// قراءة الحساب الحالي من التبويب الحالي فقط.
function readCurrentStudent() {
  try {
    const savedStudent = sessionStorage.getItem(
      CURRENT_STUDENT_KEY
    );

    return savedStudent ? JSON.parse(savedStudent) : null;
  } catch {
    return null;
  }
}

// تحديد الطالب وفريقه والمشروع والمقترح المرتبط بالفريق.
function loadProposalStatusData() {
  const student = readCurrentStudent();
  const savedTeams = readLocalData(TEAMS_STORAGE_KEY, []);
  const savedProjects = readLocalData(PROJECTS_STORAGE_KEY, []);
  const savedProposals = readLocalData(PROPOSALS_STORAGE_KEY, []);

  const teams = Array.isArray(savedTeams) ? savedTeams : [];
  const projects = Array.isArray(savedProjects) ? savedProjects : [];
  const proposals = Array.isArray(savedProposals)
    ? savedProposals
    : [];

  if (!student?.universityId) {
    return {
      student: null,
      team: null,
      project: null,
      proposal: null,
      teamStatus: "no-team",
    };
  }

  // البحث عن الفريق باستخدام teamId أو عضوية الطالب الفعلية.
  let team = null;

  if (student.teamId) {
    team =
      teams.find((item) => item.id === student.teamId) || null;
  }

  if (!team) {
    team =
      teams.find((item) => {
        const memberIds = [
          item.leaderId,
          ...(Array.isArray(item.memberIds) ? item.memberIds : []),
          ...(Array.isArray(item.members)
            ? item.members.map(
                (member) => member.universityId || member.id
              )
            : []),
        ].filter(Boolean);

        return memberIds.includes(student.universityId);
      }) || null;
  }

  const isLeader =
    Boolean(team) &&
    team.leaderId === student.universityId;

  const teamStatus = team
    ? isLeader
      ? "leader"
      : "member"
    : student.teamStatus === "leader" ||
        student.teamStatus === "member"
      ? student.teamStatus
      : "no-team";

  // المشروع والمقترح خاصان بفريق الطالب الحالي.
  const project = team
    ? projects.find((item) => item.teamId === team.id) || null
    : null;

  const proposal = team
    ? proposals.find((item) => item.teamId === team.id) || null
    : null;

  return {
    student,
    team,
    project,
    proposal,
    teamStatus,
  };
}

// تنسيق التاريخ للعرض.
function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ProposalStatus() {
  const {
    student,
    team,
    project,
    proposal,
    teamStatus,
  } = loadProposalStatusData();

  const status = proposal?.status || "Pending Review";

  const statusClass = status
    .toLowerCase()
    .replace(/\s+/g, "-");

  const projectTitle =
    proposal?.projectTitle ||
    project?.title ||
    "Untitled Project";

  return (
    <div className="proposal-status-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="proposal-status-content">
        <header className="proposal-status-header">
          <p className="proposal-status-eyebrow">
            PROJECT & PROPOSAL
          </p>

          <h1>Proposal Status & Feedback</h1>

          <p>
            Track your graduation project proposal and review
            feedback provided by your academic supervisor.
          </p>
        </header>

        {!student ? (
          <section className="proposal-status-card">
            <h2>Please sign in first</h2>

            <p>
              Sign in to view your team's proposal status.
            </p>

            <Link to="/login">
              Go to Login →
            </Link>
          </section>
        ) : !team ? (
          <section className="proposal-status-card">
            <h2>You are not in a team yet</h2>

            <p>
              Proposal status will be available after you create
              or join a graduation project team.
            </p>

            <Link to="/student/invitations">
              View Invitations →
            </Link>
          </section>
        ) : !proposal ? (
          <section className="proposal-status-card proposal-status-empty">
            <div className="proposal-status-card-heading">
              <div>
                <p className="proposal-status-label">
                  PROJECT TITLE
                </p>

                <h2>
                  {project?.title || "No project registered yet"}
                </h2>
              </div>

              <span className="proposal-status-badge not-submitted">
                Not Submitted
              </span>
            </div>

            <p>
              {project
                ? "Your project is registered, but your Team Leader has not submitted a proposal for supervisor review yet."
                : "Your team has not registered its project yet. Project registration comes before proposal submission."}
            </p>

            {teamStatus === "leader" && (
              <Link
                to={
                  project
                    ? "/student/submit-proposal"
                    : "/student/project-registration"
                }
              >
                {project
                  ? "Submit Proposal →"
                  : "Register Project →"}
              </Link>
            )}
          </section>
        ) : (
          <>
            <section className="proposal-status-card">
              <div className="proposal-status-card-heading">
                <div>
                  <p className="proposal-status-label">
                    PROJECT TITLE
                  </p>

                  <h2>{projectTitle}</h2>

                  <p className="proposal-status-team-name">
                    Team: {team.name}
                  </p>
                </div>

                <span
                  className={`proposal-status-badge ${statusClass}`}
                >
                  {status}
                </span>
              </div>

              <div className="proposal-status-meta">
                <span>Submitted on</span>

                <time dateTime={proposal.submittedAt || ""}>
                  {formatDate(proposal.submittedAt)}
                </time>
              </div>

              {proposal.fileName && (
                <div className="proposal-status-file">
                  <div className="proposal-status-file-info">
                    <strong>Proposal Document</strong>
                    <span>{proposal.fileName}</span>
                  </div>

                  {proposal.fileData && (
                    <a
                      href={proposal.fileData}
                      download={proposal.fileName}
                      className="proposal-status-download"
                    >
                      Download
                    </a>
                  )}
                </div>
              )}

              {proposal.notes && (
                <div className="proposal-status-notes">
                  <h3>Notes Submitted to Supervisor</h3>
                  <p>{proposal.notes}</p>
                </div>
              )}
            </section>

            <section className="proposal-feedback-card">
              <div className="proposal-feedback-heading">
                <span
                  className="proposal-feedback-icon"
                  aria-hidden="true"
                >
                  💬
                </span>

                <div>
                  <h2>Supervisor Feedback</h2>

                  <p>
                    Review the feedback provided for your proposal.
                  </p>
                </div>
              </div>

              {proposal.supervisorFeedback ? (
                <div className="proposal-feedback-content">
                  <p>{proposal.supervisorFeedback}</p>
                </div>
              ) : (
                <div className="proposal-feedback-empty">
                  <p>
                    {status === "Pending Review"
                      ? "Your proposal is waiting for supervisor review. Feedback will appear here when the supervisor responds."
                      : "No feedback has been recorded for this proposal yet."}
                  </p>
                </div>
              )}
            </section>

            {status === "Changes Requested" && (
              <section className="proposal-revision-notice">
                <h2>Revision Required</h2>

                <p>
                  The Team Leader should update the proposal
                  according to the supervisor's feedback and
                  submit the revised version for review.
                </p>

                {teamStatus === "leader" && (
                  <Link to="/student/submit-proposal">
                    Submit Revised Proposal →
                  </Link>
                )}
              </section>
            )}

            {status === "Approved" && (
              <section className="proposal-revision-notice">
                <h2>Proposal Approved</h2>

                <p>
                  Your supervisor has approved the current proposal.
                </p>
              </section>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default ProposalStatus;
