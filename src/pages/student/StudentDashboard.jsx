
import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./StudentDashboard.css";

function getCurrentStudent() {
  try {
    const savedStudent = localStorage.getItem(
      "gradtrack-current-student"
    );

    return savedStudent ? JSON.parse(savedStudent) : null;
  } catch {
    return null;
  }
}

function StudentDashboard() {
  const student = getCurrentStudent();
  const teamStatus = student?.teamStatus || "no-team";

  const isLeader = teamStatus === "leader";
  const hasTeam = teamStatus === "leader" || teamStatus === "member";

  const studentName = student?.name || "Student";
  const greetingName = studentName.split(" ")[0];

  const actions = !hasTeam
    ? [
        {
          icon: "＋",
          title: "Create a Team",
          description: "Start your graduation project journey.",
          link: "/student/create-team",
          label: "Create Team",
        },
        {
          icon: "↗",
          title: "Team Invitations",
          description: "Check invitations from other team leaders.",
          link: "/student/invitations",
          label: "View Invitations",
        },
      ]
    : isLeader
    ? [
        {
          icon: "♧",
          title: "Manage Team",
          description: "View members and manage your team.",
          link: "/student/manage-team",
          label: "Manage Team",
        },
        {
          icon: "✓",
          title: "Manage Tasks",
          description: "Create tasks and track team progress.",
          link: "/student/manage-tasks",
          label: "Manage Tasks",
        },
        {
          icon: "▤",
          title: "Project Registration",
          description: "Review or complete project details.",
          link: "/student/project-registration",
          label: "Open Registration",
        },
        {
          icon: "↥",
          title: "Submit Proposal",
          description: "Submit your project proposal for review.",
          link: "/student/submit-proposal",
          label: "Open Proposal",
        },
      ]
    : [
        {
          icon: "♧",
          title: "My Team",
          description: "View your team and its members.",
          link: "/student/team",
          label: "View Team",
        },
        {
          icon: "✓",
          title: "My Tasks",
          description: "Review your assigned tasks and updates.",
          link: "/student/tasks",
          label: "View Tasks",
        },
        {
          icon: "▤",
          title: "Proposal Status",
          description: "Read the latest proposal status and feedback.",
          link: "/student/proposal-status",
          label: "View Feedback",
        },
      ];

  return (
    <div className="student-dashboard student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              STUDENT WORKSPACE
            </p>

            <h1>
              Welcome back, {greetingName}!
            </h1>

            <p className="dashboard-subtitle">
              Your graduation project journey, organized in one place.
            </p>
          </div>

          <span className={`dashboard-role ${teamStatus}`}>
            {isLeader
              ? "Team Leader"
              : hasTeam
              ? "Team Member"
              : "Student"}
          </span>
        </header>

        <section className="dashboard-status">
          <div className="dashboard-status-icon">
            {hasTeam ? "✓" : "＋"}
          </div>

          <div className="dashboard-status-copy">
            <p className="dashboard-card-label">
              YOUR TEAM STATUS
            </p>

            <h2>
              {!hasTeam
                ? "You haven't joined a team yet"
                : isLeader
                ? "You're leading a team"
                : "You're part of a team"}
            </h2>

            <p>
              {!hasTeam
                ? "Create a team or check your invitations to get started."
                : isLeader
                ? "Manage your team, coordinate tasks, and follow your project proposal."
                : "View your tasks, stay updated, and check your project's feedback."}
            </p>
          </div>

          <Link
            className="dashboard-status-link"
            to={
              !hasTeam
                ? "/student/create-team"
                : isLeader
                ? "/student/manage-team"
                : "/student/team"
            }
          >
            {!hasTeam
              ? "Get Started"
              : isLeader
              ? "Manage Team"
              : "View My Team"}
            <span aria-hidden="true"> →</span>
          </Link>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Your Overview</h2>
              <p>A quick look at your current progress.</p>
            </div>
          </div>

          <div className="dashboard-overview-grid">
            <article className="dashboard-overview-card">
              <div className="dashboard-overview-top">
                <span className="dashboard-overview-icon">
                  ♧
                </span>
                <span className="dashboard-muted-label">
                  TEAM
                </span>
              </div>

              <h3>
                {!hasTeam
                  ? "Not joined"
                  : isLeader
                  ? "Team Leader"
                  : "Team Member"}
              </h3>

              <p>
                {!hasTeam
                  ? "Create or join a team"
                  : "Your team is ready to explore"}
              </p>

              <Link
                to={
                  !hasTeam
                    ? "/student/invitations"
                    : "/student/team"
                }
              >
                {!hasTeam ? "Check invitations" : "View team"} →
              </Link>
            </article>

            <article className="dashboard-overview-card">
              <div className="dashboard-overview-top">
                <span className="dashboard-overview-icon">
                  ✓
                </span>
                <span className="dashboard-muted-label">
                  TASKS
                </span>
              </div>

              <h3>{hasTeam ? "Track tasks" : "Not started"}</h3>

              <p>
                {hasTeam
                  ? "Review assignments and their status."
                  : "Tasks become available after you join a team."}
              </p>

              {hasTeam && (
                <Link
                  to={
                    isLeader
                      ? "/student/manage-tasks"
                      : "/student/tasks"
                  }
                >
                  {isLeader ? "Manage tasks" : "View my tasks"} →
                </Link>
              )}
            </article>

            <article className="dashboard-overview-card">
              <div className="dashboard-overview-top">
                <span className="dashboard-overview-icon">
                  ▤
                </span>
                <span className="dashboard-muted-label">
                  PROJECT
                </span>
              </div>

              <h3>{hasTeam ? "Proposal status" : "Coming next"}</h3>

              <p>
                {hasTeam
                  ? "Check the project proposal and supervisor feedback."
                  : "Your project proposal comes after team formation."}
              </p>

              {hasTeam && (
                <Link to="/student/proposal-status">
                  View proposal status →
                </Link>
              )}
            </article>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>
                {isLeader
                  ? "Shortcuts to your team leadership responsibilities."
                  : hasTeam
                  ? "The pages you'll use most often."
                  : "Start here to set up your workspace."}
              </p>
            </div>
          </div>

          <div className="dashboard-actions-grid">
            {actions.map((action) => (
              <article
                className="dashboard-action-card"
                key={action.title}
              >
                <span
                  className="dashboard-action-icon"
                  aria-hidden="true"
                >
                  {action.icon}
                </span>

                <h3>{action.title}</h3>
                <p>{action.description}</p>

                <Link to={action.link}>
                  {action.label}
                  <span aria-hidden="true"> →</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <footer className="dashboard-footer">
          <span className="dashboard-footer-icon">✦</span>

          <p>
            <strong>Stay organized, one step at a time.</strong>
            <br />
            Keep your team, tasks, and graduation project on track with
            GradTrack.
          </p>
        </footer>

        <p className="dashboard-demo-note">
          Development preview: some information is currently based on
          mock data and will be connected to the backend later.
        </p>
      </main>
    </div>
  );
}

export default StudentDashboard;
