import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./TasksProgress.css";

// نفس المفتاح المستخدم في ManageTasks و MyTasks.
const TASKS_STORAGE_KEY = "gradtrack-team-tasks";

// بيانات تجريبية تُستخدم إذا لم توجد مهام محفوظة.
const initialTasks = [
  {
    id: 1,
    title: "Research Project Requirements",
    description: "Prepare the initial requirements document.",
    assigneeId: "student-1",
    dueDate: "2026-11-05",
    status: "In Progress",
  },
  {
    id: 2,
    title: "Prepare Project Documentation",
    description: "Organize the project documentation.",
    assigneeId: "student-2",
    dueDate: "2026-11-12",
    status: "To Do",
  },
];

// قراءة حساب الطالب الحالي.
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

// قراءة المهام المشتركة التي تحفظها الصفحات الأخرى.
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);

    if (savedTasks !== null) {
      const parsedTasks = JSON.parse(savedTasks);

      if (Array.isArray(parsedTasks)) {
        return parsedTasks;
      }
    }
  } catch {
    // نستخدم البيانات التجريبية إذا تعذرت قراءة التخزين.
  }

  return initialTasks;
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

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function TasksProgress() {
  const student = getCurrentStudent();
  const [tasks] = useState(loadTasks);
  const [filter, setFilter] = useState("All");

  const currentStudentId = student?.universityId;

  // أسماء تجريبية للمعرفات القديمة المستخدمة في بعض المهام.
  const memberNames = {
    "student-1": "Ahmad Khalil",
    "student-2": "Lina Omar",
    "student-3": "Mohammad Ali",
  };

  // حساب الأعداد من المهام الفعلية المتاحة في التخزين المحلي.
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "To Do"
  ).length;

  const today = getTodayString();

  const overdueTasks = tasks.filter(
    (task) =>
      task.status !== "Completed" &&
      task.dueDate &&
      task.dueDate < today
  ).length;

  const completionRate =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  // عرض اسم الشخص المسؤول عن كل مهمة.
  function getAssigneeName(assigneeId) {
    if (
      currentStudentId &&
      assigneeId === currentStudentId
    ) {
      return `${student.name} (You)`;
    }

    if (
      assigneeId === "team-leader" &&
      student?.name
    ) {
      return `${student.name} (You)`;
    }

    return memberNames[assigneeId] ?? "Team member";
  }

  // تحديد ما إذا كان موعد المهمة قد فات.
  function isOverdue(task) {
    return (
      task.status !== "Completed" &&
      Boolean(task.dueDate) &&
      task.dueDate < today
    );
  }

  // تصفية المهام حسب الحالة المحددة.
  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter((task) => task.status === filter);

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
      <StudentNavbar teamStatus="leader" />

      <main className="tasks-progress-content">
        {/* عنوان الصفحة */}
        <header className="tasks-progress-header">
          <div>
            <p className="tasks-progress-eyebrow">
              TEAM MANAGEMENT
            </p>

            <h1>Tasks &amp; Progress</h1>

            <p>
              Monitor your team&apos;s workload, deadlines,
              and overall task completion.
            </p>
          </div>

          <span className="tasks-progress-role">
            Team Leader
          </span>
        </header>

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
            <span className="tasks-progress-stat-icon">▤</span>

            <p>Total Tasks</p>

            <h3>{totalTasks}</h3>

            <span className="tasks-progress-stat-note">
              Across the team
            </span>
          </article>

          <article className="tasks-progress-stat-card active">
            <span className="tasks-progress-stat-icon">↗</span>

            <p>In Progress</p>

            <h3>{inProgressTasks}</h3>

            <span className="tasks-progress-stat-note">
              Currently being worked on
            </span>
          </article>

          <article className="tasks-progress-stat-card completed">
            <span className="tasks-progress-stat-icon">✓</span>

            <p>Completed</p>

            <h3>{completedTasks}</h3>

            <span className="tasks-progress-stat-note">
              Successfully finished
            </span>
          </article>

          <article className="tasks-progress-stat-card overdue">
            <span className="tasks-progress-stat-icon">!</span>

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
              <p>See how work is progressing across the team.</p>
            </div>
          </div>

          <div className="tasks-progress-breakdown-list">
            {statusBreakdown.map((item) => {
              const percentage =
                totalTasks > 0
                  ? Math.round((item.count / totalTasks) * 100)
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
                Review the status and deadlines of every assigned task.
              </p>
            </div>

            <span className="tasks-progress-task-count">
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"}
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
              <span className="tasks-progress-empty-icon">✓</span>

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
              {filteredTasks.map((task) => (
                <article
                  className="tasks-progress-task-card"
                  key={task.id}
                >
                  <div className="tasks-progress-task-main">
                    <div className="tasks-progress-task-title-row">
                      <h3>{task.title}</h3>

                      <span
                        className={`tasks-progress-status ${
                          task.status === "In Progress"
                            ? "in-progress"
                            : task.status === "Completed"
                              ? "completed"
                              : "todo"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <p>{task.description}</p>

                    <div className="tasks-progress-task-meta">
                      <span>
                        <span aria-hidden="true">♙</span>
                        <strong>Assigned to:</strong>{" "}
                        {getAssigneeName(task.assigneeId)}
                      </span>

                      <span
                        className={
                          isOverdue(task)
                            ? "tasks-progress-due overdue"
                            : "tasks-progress-due"
                        }
                      >
                        <span aria-hidden="true">▦</span>
                        <strong>Due:</strong>{" "}
                        {formatDate(task.dueDate)}
                        {isOverdue(task) && (
                          <em>Overdue</em>
                        )}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="tasks-progress-demo-note">
          This page uses shared demo data saved in this browser.
          It will be connected to the backend later.
        </p>
      </main>
    </div>
  );
}

export default TasksProgress;