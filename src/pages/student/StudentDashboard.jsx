import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./StudentDashboard.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const TASKS_STORAGE_KEY = "gradtrack-team-tasks";
const MAX_TEAM_MEMBERS = 4;

// قراءة البيانات المشتركة المحفوظة بصيغة JSON بأمان.
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

// قراءة الحساب الحالي من جلسة هذا التبويب فقط.
function getCurrentStudent() {
  try {
    const savedStudent = sessionStorage.getItem(
      CURRENT_STUDENT_KEY
    );

    const student = savedStudent
      ? JSON.parse(savedStudent)
      : null;

    return student && typeof student === "object"
      ? student
      : null;
  } catch {
    return null;
  }
}

// توحيد معرفات أعضاء الفريق، مع منع التكرار.
function getTeamMemberIds(team) {
  if (!team) return [];

  return [
    ...new Set(
      [
        team.leaderId,
        ...(Array.isArray(team.memberIds) ? team.memberIds : []),
        ...(Array.isArray(team.members)
          ? team.members.map(
              (member) => member.universityId || member.id
            )
          : []),
      ].filter(Boolean)
    ),
  ];
}

// قراءة بيانات الطالب والفريق والمهام.
function getDashboardData() {
  const student = getCurrentStudent();

  const teams = readLocalData(TEAMS_STORAGE_KEY, []);
  const savedTasks = readLocalData(TASKS_STORAGE_KEY, []);

  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeTasks = Array.isArray(savedTasks) ? savedTasks : [];

  let team = null;

  if (student?.universityId) {
    // البحث عن الفريق باستخدام teamId أولًا.
    if (student.teamId) {
      team =
        safeTeams.find(
          (item) => item.id === student.teamId
        ) || null;
    }

    // البحث عن عضوية الطالب إذا لم يُعثر على الفريق.
    if (!team) {
      team =
        safeTeams.find((item) =>
          getTeamMemberIds(item).includes(
            student.universityId
          )
        ) || null;
    }
  }

  // تحديد صلاحية الطالب من بيانات الفريق الفعلية.
  const teamStatus = team
    ? team.leaderId === student?.universityId
      ? "leader"
      : "member"
    : student?.teamStatus === "leader" ||
        student?.teamStatus === "member"
      ? student.teamStatus
      : "no-team";

  const hasTeam =
    teamStatus === "leader" || teamStatus === "member";

  // عرض مهام الفريق الحالي فقط.
  const teamTasks = team
    ? safeTasks.filter(
        (task) => task && task.teamId === team.id
      )
    : [];

  // المهام المسندة للطالب الحالي من فريقه.
  const myTasks = teamTasks.filter(
    (task) => task.assigneeId === student?.universityId
  );

  const completedMyTasks = myTasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const teamMemberCount = team
    ? getTeamMemberIds(team).length
    : 0;

  return {
    student,
    team,
    teamStatus,
    hasTeam,
    myTasks,
    allTasks: teamTasks,
    completedMyTasks,
    teamMemberCount,
  };
}

function StudentDashboard() {
  const {
    student,
    team,
    teamStatus,
    hasTeam,
    myTasks,
    allTasks,
    completedMyTasks,
    teamMemberCount,
  } = getDashboardData();

  const isLeader = teamStatus === "leader";

  const studentName = student?.name?.trim() || "Student";
  const greetingName = studentName.split(/\s+/)[0];

  // الإجراءات السريعة حسب حالة الطالب وصلاحياته.
  const actions = !hasTeam
    ? [
        {
          icon: "＋",
          title: "Create a Team",
          description:
            "Start your graduation project journey by creating a team.",
          link: "/student/create-team",
          label: "Create Team",
        },
        {
          icon: "↗",
          title: "Team Invitations",
          description:
            "Review invitations sent to your university ID.",
          link: "/student/invitations",
          label: "View Invitations",
        },
      ]
    : isLeader
      ? [
          {
            icon: "♧",
            title: "Manage Team",
            description:
              "View team members and manage your team.",
            link: "/student/manage-team",
            label: "Manage Team",
          },
          {
            icon: "▤",
            title: "Team Tasks",
            description:
              "Review every task and shared deliverable.",
            link: "/student/team-tasks",
            label: "View Team Tasks",
          },
          {
            icon: "✓",
            title: "Manage Tasks",
            description:
              "Create tasks and assign them to yourself or your members.",
            link: "/student/manage-tasks",
            label: "Manage Tasks",
          },
          {
            icon: "↗",
            title: "Tasks & Progress",
            description:
              "Monitor completion, workload, and overdue tasks.",
            link: "/student/tasks-progress",
            label: "View Progress",
          },
          {
            icon: "▤",
            title: "Project Registration",
            description:
              "Open your graduation project registration.",
            link: "/student/project-registration",
            label: "Open Registration",
          },
          {
            icon: "↥",
            title: "Submit Proposal",
            description:
              "Submit or revise the project proposal.",
            link: "/student/submit-proposal",
            label: "Open Proposal",
          },
        ]
      : [
          {
            icon: "♧",
            title: "My Team",
            description:
              "View your team and its members.",
            link: "/student/team",
            label: "View Team",
          },
          {
            icon: "✓",
            title: "My Tasks",
            description:
              "Review assigned tasks and update their status.",
            link: "/student/tasks",
            label: "View My Tasks",
          },
          {
            icon: "▤",
            title: "Team Tasks",
            description:
              "Explore tasks and deliverables shared by teammates.",
            link: "/student/team-tasks",
            label: "View Team Tasks",
          },
          {
            icon: "↥",
            title: "Proposal Status & Feedback",
            description:
              "Read the proposal status and supervisor feedback.",
            link: "/student/proposal-status",
            label: "View Feedback",
          },
        ];

  const teamDescription = !hasTeam
    ? "Create a team or accept an invitation to get started."
    : team
      ? `${teamMemberCount} of ${MAX_TEAM_MEMBERS} team members`
      : "Your team workspace is ready.";

  const taskDescription = !hasTeam
    ? "Tasks become available after you join a team."
    : isLeader
      ? `${allTasks.length} tasks currently assigned to your team.`
      : `${myTasks.length} tasks assigned to you, ${completedMyTasks} completed.`;

  return (
    <div className="student-dashboard student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              STUDENT WORKSPACE
            </p>

            <h1>Welcome back, {greetingName}!</h1>

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
                  : "View your tasks, explore team deliverables, and check project feedback."}
            </p>

            {team && (
              <p>
                <strong>Team:</strong> {team.name}
              </p>
            )}
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
                  : team?.name ||
                    (isLeader ? "Team Leader" : "Team Member")}
              </h3>

              <p>{teamDescription}</p>

              <Link
                to={
                  !hasTeam
                    ? "/student/invitations"
                    : isLeader
                      ? "/student/manage-team"
                      : "/student/team"
                }
              >
                {!hasTeam
                  ? "Check invitations"
                  : isLeader
                    ? "Manage team"
                    : "View team"}{" "}
                →
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

              <h3>
                {!hasTeam
                  ? "Not started"
                  : isLeader
                    ? `${allTasks.length} team tasks`
                    : `${myTasks.length} assigned tasks`}
              </h3>

              <p>{taskDescription}</p>

              {hasTeam && (
                <Link
                  to={
                    isLeader
                      ? "/student/tasks-progress"
                      : "/student/tasks"
                  }
                >
                  {isLeader
                    ? "View progress"
                    : "View my tasks"}{" "}
                  →
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

              <h3>
                {hasTeam ? "Proposal status" : "Coming next"}
              </h3>

              <p>
                {hasTeam
                  ? "Review the proposal workflow and supervisor feedback."
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
          Development preview: some information is based on local mock
          data and will be connected to the backend later.
        </p>
      </main>
    </div>
  );
}

export default StudentDashboard;