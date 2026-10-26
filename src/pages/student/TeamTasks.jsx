
import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./TeamTasks.css";

const TASKS_STORAGE_KEY = "gradtrack-team-tasks";

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

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);

    if (savedTasks !== null) {
      const parsedTasks = JSON.parse(savedTasks);
      return Array.isArray(parsedTasks) ? parsedTasks : [];
    }
  } catch {
    // نعرض قائمة فارغة إذا تعذّرت قراءة البيانات.
  }

  return [];
}

function formatDate(dateString) {
  if (!dateString) return "No deadline";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function TeamTasks() {
  const student = getCurrentStudent();
  const [tasks] = useState(loadTasks);
  const [filter, setFilter] = useState("All");

  const memberNames = {
    "student-1": "Ahmad Khalil",
    "student-2": "Lina Omar",
    "student-3": "Mohammad Ali",
  };

  function getAssigneeName(task) {
    if (
      task.assigneeId === student?.universityId &&
      student?.name
    ) {
      return `${student.name} (You)`;
    }

    if (task.assigneeName) {
      return task.assigneeName;
    }

    return memberNames[task.assigneeId] ?? "Team member";
  }

  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter((task) => task.status === filter);

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const submissionCount = tasks.reduce(
    (total, task) =>
      total +
      (Array.isArray(task.submissions)
        ? task.submissions.length
        : task.submittedFile
          ? 1
          : 0),
    0
  );

  return (
    <div className="team-tasks-page student-layout">
      <StudentNavbar
        teamStatus={student?.teamStatus ?? "member"}
      />

      <main className="team-tasks-content">
        <header className="team-tasks-header">
          <p className="team-tasks-eyebrow">TEAM WORKSPACE</p>

          <h1>Team Tasks</h1>

          <p>
            See what everyone is working on and explore the
            deliverables shared by your team.
          </p>
        </header>

        <section className="team-tasks-summary">
          <article className="team-tasks-summary-card">
            <span className="team-tasks-summary-icon">▤</span>
            <div>
              <p>Total Tasks</p>
              <strong>{tasks.length}</strong>
            </div>
          </article>

          <article className="team-tasks-summary-card">
            <span className="team-tasks-summary-icon">✓</span>
            <div>
              <p>Completed</p>
              <strong>{completedCount}</strong>
            </div>
          </article>

          <article className="team-tasks-summary-card">
            <span className="team-tasks-summary-icon">↥</span>
            <div>
              <p>Submissions</p>
              <strong>{submissionCount}</strong>
            </div>
          </article>
        </section>

        <section className="team-tasks-list-section">
          <div className="team-tasks-section-heading">
            <div>
              <h2>All Team Tasks</h2>
              <p>
                Each task shows its owner, deadline, status, and
                available submissions.
              </p>
            </div>
          </div>

          <div
            className="team-tasks-filters"
            aria-label="Filter team tasks"
          >
            {["All", "To Do", "In Progress", "Completed"].map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  className={
                    filter === status
                      ? "team-tasks-filter active"
                      : "team-tasks-filter"
                  }
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                >
                  {status}
                </button>
              )
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="team-tasks-empty">
              <span className="team-tasks-empty-icon">▤</span>

              <h3>
                {tasks.length === 0
                  ? "No team tasks yet"
                  : "No tasks in this category"}
              </h3>

              <p>
                {tasks.length === 0
                  ? "Tasks created by your Team Leader will appear here."
                  : "Choose another status to view other tasks."}
              </p>
            </div>
          ) : (
            <div className="team-tasks-list">
              {filteredTasks.map((task) => {
                const submissions = Array.isArray(task.submissions)
                  ? task.submissions
                  : [];

                return (
                  <article className="team-task-card" key={task.id}>
                    <div className="team-task-card-heading">
                      <div>
                        <h3>{task.title}</h3>

                        <p>{task.description}</p>
                      </div>

                      <span
                        className={`team-task-status ${
                          task.status === "Completed"
                            ? "completed"
                            : task.status === "In Progress"
                              ? "in-progress"
                              : "todo"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div className="team-task-meta">
                      <span>
                        <strong>Assigned to:</strong>{" "}
                        {getAssigneeName(task)}
                      </span>

                      <span>
                        <strong>Due:</strong>{" "}
                        {formatDate(task.dueDate)}
                      </span>
                    </div>

                    <div className="team-task-submissions">
                      <h4>
                        <span aria-hidden="true">↥</span>
                        Shared Deliverables
                      </h4>

                      {submissions.length > 0 ? (
                        submissions.map((submission) => (
                          <div
                            className="team-task-submission"
                            key={submission.id}
                          >
                            <div className="team-task-file-icon">
                              ↗
                            </div>

                            <div className="team-task-file-info">
                              <strong>
                                {submission.fileName}
                              </strong>

                              <span>
                                Submitted by{" "}
                                {submission.studentName || "Team member"}
                                {submission.submittedAt
                                  ? ` · ${formatDate(
                                      submission.submittedAt.slice(0, 10)
                                    )}`
                                  : ""}
                              </span>
                            </div>

                            {submission.fileData && (
                              <a
                                className="team-task-file-link"
                                href={submission.fileData}
                                download={submission.fileName}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            )}
                          </div>
                        ))
                      ) : task.submittedFile ? (
                        <p className="team-task-no-submission">
                          {task.submittedFile} was recorded in an older
                          demo, but its file content is not available.
                          Upload the file again to share it with the team.
                        </p>
                      ) : (
                        <p className="team-task-no-submission">
                          No files submitted yet.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="team-tasks-demo-note">
          This page currently reads local demo data in this browser.
          Shared access across different devices will require the backend.
        </p>
      </main>
    </div>
  );
}

export default TeamTasks;
