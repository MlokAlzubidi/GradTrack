import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./TeamTasks.css";

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

// جلب بيانات الطالب الحالي.
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

// تجهيز الأعضاء الحقيقيين في الفريق.
function getTeamMembers(team, student) {
  if (!team) return [];

  const membersById = new Map();

  if (Array.isArray(team.members)) {
    team.members.forEach((member) => {
      const id = member.universityId || member.id;

      if (!id) return;

      membersById.set(id, {
        id,
        name:
          member.name ||
          (id === team.leaderId
            ? team.leaderName
            : "Team Member"),
      });
    });
  }

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

// تحميل المهام المحفوظة فقط، بدون إنشاء مهام تجريبية.
function loadTasks() {
  return readLocalArray(TASKS_STORAGE_KEY);
}

// تنسيق التاريخ.
function formatDate(dateString) {
  if (!dateString) return "No deadline";

  const datePart = dateString.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) return "No deadline";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function TeamTasks() {
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

  const [allTasks] = useState(loadTasks);
  const [filter, setFilter] = useState("All");

  // عرض المهام التابعة للفريق الحالي فقط.
  const tasks = currentTeam
    ? allTasks.filter(
        (task) =>
          task &&
          task.teamId === currentTeam.id
      )
    : [];

  // تحديد اسم الشخص المسؤول عن المهمة.
  function getAssigneeName(task) {
    if (
      task.assigneeId === student?.universityId &&
      student?.name
    ) {
      return `${student.name} (You)`;
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

  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter(
          (task) => (task.status || "To Do") === filter
        );

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const submissionCount = tasks.reduce(
    (total, task) => {
      const submissions = Array.isArray(task.submissions)
        ? task.submissions
        : [];

      return (
        total +
        (submissions.length > 0
          ? submissions.length
          : task.submittedFile
            ? 1
            : 0)
      );
    },
    0
  );

  return (
    <div className="team-tasks-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="team-tasks-content">
        <header className="team-tasks-header">
          <p className="team-tasks-eyebrow">
            TEAM WORKSPACE
          </p>

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
                {!currentTeam
                  ? "No Team Found"
                  : tasks.length === 0
                    ? "No team tasks yet"
                    : "No tasks in this category"}
              </h3>

              <p>
                {!currentTeam
                  ? "Create or join a team to view its shared tasks."
                  : tasks.length === 0
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

                const status = task.status || "To Do";

                return (
                  <article
                    className="team-task-card"
                    key={task.id}
                  >
                    <div className="team-task-card-heading">
                      <div>
                        <h3>{task.title}</h3>
                        <p>{task.description}</p>
                      </div>

                      <span
                        className={`team-task-status ${
                          status === "Completed"
                            ? "completed"
                            : status === "In Progress"
                              ? "in-progress"
                              : "todo"
                        }`}
                      >
                        {status}
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
                                {submission.studentName ||
                                  "Team member"}

                                {submission.submittedAt
                                  ? ` · ${formatDate(
                                      submission.submittedAt
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
                          This task has an older file reference,
                          but the file content is unavailable.
                          The file must be uploaded again to share it.
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
          Tasks are separated by team and stored locally in this
          browser. Sharing data across different devices requires
          the backend.
        </p>
      </main>
    </div>
  );
}

export default TeamTasks;