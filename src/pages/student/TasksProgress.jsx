import { useState } from "react";
import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./TasksProgress.css";

const TASKS_STORAGE_KEY = "gradtrack-team-tasks";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const CURRENT_STUDENT_KEY = "gradtrack-current-student";

// قراءة البيانات المحفوظة بأمان.
function readLocalArray(key) {
  try {
    const savedData = localStorage.getItem(key);
    const parsedData = savedData ? JSON.parse(savedData) : [];

    return Array.isArray(parsedData) ? parsedData : [];
  } catch {
    return [];
  }
}

// قراءة حساب الطالب الحالي.
// قراءة الحساب الحالي من التبويب الحالي فقط.
function getCurrentStudent() {
  try {
    const savedStudent = sessionStorage.getItem(
      CURRENT_STUDENT_KEY
    );

    return savedStudent ? JSON.parse(savedStudent) : null;
  } catch {
    return null;
  }
}

// تحديد الفريق الذي ينتمي إليه الطالب.
function getCurrentTeam(student) {
  if (!student?.universityId) return null;

  const teams = readLocalArray(TEAMS_STORAGE_KEY);

  return (
    teams.find((team) => team.id === student.teamId) ||
    teams.find((team) => {
      const memberIds = [
        team.leaderId,
        ...(Array.isArray(team.memberIds) ? team.memberIds : []),
        ...(Array.isArray(team.members)
          ? team.members.map(
              (member) => member.universityId || member.id
            )
          : []),
      ].filter(Boolean);

      return memberIds.includes(student.universityId);
    }) ||
    null
  );
}

// الحصول على أعضاء الفريق الحقيقيين.
function getTeamMembers(team, student) {
  if (!team) return [];

  const membersById = new Map();

  const storedMembers = Array.isArray(team.members)
    ? team.members
    : [];

  storedMembers.forEach((member) => {
    const id = member.universityId || member.id;

    if (!id) return;

    membersById.set(id, {
      id,
      name:
        member.name ||
        (id === team.leaderId
          ? team.leaderName || "Team Leader"
          : "Team Member"),
    });
  });

  const memberIds = Array.isArray(team.memberIds)
    ? team.memberIds
    : [];

  memberIds.forEach((id) => {
    if (!id || membersById.has(id)) return;

    membersById.set(id, {
      id,
      name:
        id === student?.universityId
          ? student.name || "Team Member"
          : id === team.leaderId
            ? team.leaderName || "Team Leader"
            : "Team Member",
    });
  });

  // التأكد من ظهور قائد الفريق.
  if (team.leaderId && !membersById.has(team.leaderId)) {
    membersById.set(team.leaderId, {
      id: team.leaderId,
      name:
        team.leaderId === student?.universityId
          ? student.name || team.leaderName || "Team Leader"
          : team.leaderName || "Team Leader",
    });
  }

  return [...membersById.values()];
}

// قراءة المهام المحفوظة فقط.
// لا توجد مهام افتراضية أو تجريبية.
function loadTasks() {
  return readLocalArray(TASKS_STORAGE_KEY);
}

// الحصول على تاريخ اليوم بصيغة YYYY-MM-DD.
function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// تنسيق تاريخ التسليم للعرض.
function formatDate(dateString) {
  if (!dateString) return "No due date";

  const datePart = dateString.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) return "No due date";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function TasksProgress() {
  const student = getCurrentStudent();
  const currentTeam = getCurrentTeam(student);
  const teamMembers = getTeamMembers(currentTeam, student);

  const isLeader =
    Boolean(currentTeam) &&
    currentTeam.leaderId === student?.universityId;

  const teamStatus = currentTeam
    ? isLeader
      ? "leader"
      : "member"
    : student?.teamStatus || "no-team";

  // قراءة المهام المحفوظة عند فتح الصفحة.
  const [allTasks] = useState(loadTasks);
  const [filter, setFilter] = useState("All");

  // عرض مهام الفريق الحالي فقط.
  const tasks = currentTeam
    ? allTasks.filter(
        (task) =>
          task &&
          task.teamId === currentTeam.id
      )
    : [];

  const today = getTodayString();

  // تحويل حالة المهمة إلى قيمة موحدة للعرض والإحصائيات.
  function getTaskStatus(task) {
    const allowedStatuses = [
      "To Do",
      "In Progress",
      "Completed",
    ];

    return allowedStatuses.includes(task.status)
      ? task.status
      : "To Do";
  }

  // اسم الشخص المكلّف بالمهمة من بيانات الفريق الفعلية.
  function getAssigneeName(task) {
    if (
      student?.universityId &&
      task.assigneeId === student.universityId
    ) {
      return `${student.name || "You"} (You)`;
    }

    const member = teamMembers.find(
      (teamMember) => teamMember.id === task.assigneeId
    );

    return (
      member?.name ||
      task.assigneeName ||
      "Team member"
    );
  }

  // حساب الأعداد من مهام الفريق الحالي فقط.
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => getTaskStatus(task) === "Completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => getTaskStatus(task) === "In Progress"
  ).length;

  const todoTasks = tasks.filter(
    (task) => getTaskStatus(task) === "To Do"
  ).length;

  const overdueTasks = tasks.filter(
    (task) =>
      getTaskStatus(task) !== "Completed" &&
      Boolean(task.dueDate) &&
      task.dueDate.slice(0, 10) < today
  ).length;

  const completionRate =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  // تحديد ما إذا كان موعد المهمة قد فات.
  function isOverdue(task) {
    return (
      getTaskStatus(task) !== "Completed" &&
      Boolean(task.dueDate) &&
      task.dueDate.slice(0, 10) < today
    );
  }

  // تصفية المهام حسب الحالة المحددة.
  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter(
          (task) => getTaskStatus(task) === filter
        );

  const filters = [
    { label: "All", count: totalTasks },
    { label: "To Do", count: todoTasks },
    { label: "In Progress", count: inProgressTasks },
    { label: "Completed", count: completedTasks },
  ];

  const statusBreakdown = [
    {
      label: "To Do",
      count: todoTasks,
      className: "todo",
      color: "#b6a16d",
    },
    {
      label: "In Progress",
      count: inProgressTasks,
      className: "in-progress",
      color: "#6d9274",
    },
    {
      label: "Completed",
      count: completedTasks,
      className: "completed",
      color: "#355b43",
    },
  ];

  return (
    <div className="tasks-progress-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="tasks-progress-content">
        {/* عنوان الصفحة */}
        <header className="tasks-progress-header">
          <div>
            <p className="tasks-progress-eyebrow">
              TEAM MANAGEMENT
            </p>

            <h1>Tasks &amp; Progress</h1>

            <p>
              Monitor your team's workload, deadlines,
              and overall task completion.
            </p>
          </div>

          {isLeader && (
            <span className="tasks-progress-role">
              Team Leader
            </span>
          )}
        </header>

        {!currentTeam ? (
          <section className="tasks-progress-list-section">
            <div className="tasks-progress-empty">
              <span className="tasks-progress-empty-icon">
                ✓
              </span>

              <h3>No Team Found</h3>

              <p>
                Create or join a team before tracking its
                task progress.
              </p>
            </div>
          </section>
        ) : !isLeader ? (
          <section className="tasks-progress-list-section">
            <div className="tasks-progress-empty">
              <span className="tasks-progress-empty-icon" aria-hidden="true">
                🔒
              </span>
              <h3>Team Leader access required</h3>
              <p>
                Detailed team-wide progress is available to the Team Leader.
                You can still browse shared tasks and deliverables.
              </p>
              <Link to="/student/team-tasks">View Team Tasks →</Link>
            </div>
          </section>
        ) : (
          <>
            {/* ملخص التقدم العام */}
            <section className="tasks-progress-hero">
              <div className="tasks-progress-hero-copy">
                <p className="tasks-progress-small-label">
                  OVERALL COMPLETION
                </p>

                <h2>{completionRate}%</h2>

                <p>
                  {completedTasks} of {totalTasks}{" "}
                  {totalTasks === 1 ? "task has" : "tasks have"}{" "}
                  been completed.
                </p>
              </div>

              <div
                className="tasks-progress-ring"
                style={{
                  "--progress-value": `${completionRate}%`,
                }}
                role="img"
                aria-label={`${completionRate}% of tasks completed`}
              >
                <div className="tasks-progress-ring-inner">
                  <strong>{completionRate}%</strong>
                  <span>Complete</span>
                </div>
              </div>
            </section>

            {/* بطاقات الإحصائيات */}
            <section
              className="tasks-progress-stats"
              aria-label="Task statistics"
            >
              <article className="tasks-progress-stat-card total">
                <span className="tasks-progress-stat-icon">
                  ▤
                </span>

                <p>Total Tasks</p>

                <h3>{totalTasks}</h3>

                <span className="tasks-progress-stat-note">
                  Across the team
                </span>
              </article>

              <article className="tasks-progress-stat-card active">
                <span className="tasks-progress-stat-icon">
                  ↗
                </span>

                <p>In Progress</p>

                <h3>{inProgressTasks}</h3>

                <span className="tasks-progress-stat-note">
                  Currently being worked on
                </span>
              </article>

              <article className="tasks-progress-stat-card completed">
                <span className="tasks-progress-stat-icon">
                  ✓
                </span>

                <p>Completed</p>

                <h3>{completedTasks}</h3>

                <span className="tasks-progress-stat-note">
                  Successfully finished
                </span>
              </article>

              <article className="tasks-progress-stat-card overdue">
                <span className="tasks-progress-stat-icon">
                  !
                </span>

                <p>Overdue</p>

                <h3>{overdueTasks}</h3>

                <span className="tasks-progress-stat-note">
                  Past their deadline
                </span>
              </article>
            </section>

            {/* توزيع المهام حسب الحالة */}
            <section className="tasks-progress-breakdown">
              <div className="tasks-progress-section-heading">
                <div>
                  <h2>Task Breakdown</h2>

                  <p>
                    See how work is progressing across the team.
                  </p>
                </div>
              </div>

              <div className="tasks-progress-breakdown-list">
                {statusBreakdown.map((item) => {
                  const percentage =
                    totalTasks > 0
                      ? Math.round(
                          (item.count / totalTasks) * 100
                        )
                      : 0;

                  return (
                    <div
                      className="tasks-progress-breakdown-item"
                      key={item.label}
                    >
                      <div className="tasks-progress-breakdown-meta">
                        <span>
                          <span
                            className={`tasks-progress-dot ${item.className}`}
                          />

                          {item.label}
                        </span>

                        <strong>
                          {item.count}
                          <span> ({percentage}%)</span>
                        </strong>
                      </div>

                      <div
                        className="tasks-progress-bar-track"
                        role="progressbar"
                        aria-label={`${item.label} tasks`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percentage}
                      >
                        <div
                          className="tasks-progress-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* قائمة المهام مع الفلاتر */}
            <section className="tasks-progress-list-section">
              <div className="tasks-progress-section-heading">
                <div>
                  <h2>Team Tasks</h2>

                  <p>
                    Review the status and deadlines of every
                    assigned task.
                  </p>
                </div>

                <span className="tasks-progress-task-count">
                  {filteredTasks.length}{" "}
                  {filteredTasks.length === 1
                    ? "task"
                    : "tasks"}
                </span>
              </div>

              <div
                className="tasks-progress-filters"
                aria-label="Filter tasks by status"
              >
                {filters.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={
                      filter === item.label
                        ? "tasks-progress-filter active"
                        : "tasks-progress-filter"
                    }
                    onClick={() => setFilter(item.label)}
                    aria-pressed={filter === item.label}
                  >
                    {item.label}
                    <span>{item.count}</span>
                  </button>
                ))}
              </div>

              {filteredTasks.length === 0 ? (
                <div className="tasks-progress-empty">
                  <span className="tasks-progress-empty-icon">
                    ✓
                  </span>

                  <h3>
                    {tasks.length === 0
                      ? "No team tasks yet"
                      : "No tasks in this category"}
                  </h3>

                  <p>
                    {tasks.length === 0
                      ? "Create a task in Manage Tasks to start tracking progress."
                      : "Try selecting another status to view more tasks."}
                  </p>
                </div>
              ) : (
                <div className="tasks-progress-task-list">
                  {filteredTasks.map((task) => {
                    const status = getTaskStatus(task);
                    const overdue = isOverdue(task);

                    return (
                      <article
                        className="tasks-progress-task-card"
                        key={task.id}
                      >
                        <div className="tasks-progress-task-main">
                          <div className="tasks-progress-task-title-row">
                            <h3>{task.title}</h3>

                            <span
                              className={`tasks-progress-status ${
                                status === "In Progress"
                                  ? "in-progress"
                                  : status === "Completed"
                                    ? "completed"
                                    : "todo"
                              }`}
                            >
                              {status}
                            </span>
                          </div>

                          <p>{task.description}</p>

                          <div className="tasks-progress-task-meta">
                            <span>
                              <span aria-hidden="true">♙</span>
                              <strong>Assigned to:</strong>{" "}
                              {getAssigneeName(task)}
                            </span>

                            <span
                              className={
                                overdue
                                  ? "tasks-progress-due overdue"
                                  : "tasks-progress-due"
                              }
                            >
                              <span aria-hidden="true">▦</span>
                              <strong>Due:</strong>{" "}
                              {formatDate(task.dueDate)}

                              {overdue && <em>Overdue</em>}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default TasksProgress;
