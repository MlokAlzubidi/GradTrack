import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./ManageTasks.css";

const TASKS_STORAGE_KEY = "gradtrack-team-tasks";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const NOTIFICATIONS_STORAGE_KEY = "gradtrack-notifications";

// قراءة البيانات المحفوظة بأمان.
function readLocalArray(key) {
  try {
    const savedValue = localStorage.getItem(key);
    const parsedValue = savedValue ? JSON.parse(savedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

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

// تحديد فريق الطالب من بيانات الفريق المحفوظة.
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

      return memberIds.some(
        (id) => String(id) === String(student.universityId)
      );
    }) ||
    null
  );
}

// تجهيز أعضاء الفريق الفعليين بدل استخدام أسماء ثابتة للتجربة.
function getTeamMembers(team, currentStudent) {
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
          ? team.leaderName
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
        id === currentStudent?.universityId
          ? currentStudent.name || "Team Member"
          : id === team.leaderId
            ? team.leaderName || "Team Leader"
            : "Team Member",
    });
  });

  // التأكد من ظهور القائد حتى لو لم يكن داخل قائمة الأعضاء.
  if (team.leaderId && !membersById.has(team.leaderId)) {
    membersById.set(team.leaderId, {
      id: team.leaderId,
      name:
        team.leaderId === currentStudent?.universityId
          ? currentStudent.name ||
            team.leaderName ||
            "Team Leader"
          : team.leaderName || "Team Leader",
    });
  }

  return [...membersById.values()].map((member) => ({
    ...member,
    name:
      String(member.id) ===
        String(currentStudent?.universityId) &&
      String(member.id) === String(team.leaderId)
        ? `${member.name} (You — Team Leader)`
        : member.name,
  }));
}

// قراءة المهام المشتركة دون حذف بيانات محفوظة.
function loadAllTasks() {
  return readLocalArray(TASKS_STORAGE_KEY);
}

// حفظ جميع المهام حتى لا تتأثر مهام الفرق الأخرى.
function saveAllTasks(tasks) {
  try {
    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(tasks)
    );

    return true;
  } catch {
    return false;
  }
}
// إرسال إشعار إلى الطالب عند إسناد مهمة جديدة إليه.
function createTaskAssignmentNotification({
  recipientId,
  leaderName,
  task,
  teamId,
}) {
  try {
    // قراءة الإشعارات السابقة حتى لا نفقد إشعارات المستخدمين الآخرين.
    const notifications = readLocalArray(
      NOTIFICATIONS_STORAGE_KEY
    );

    const notification = {
      id: `task-${teamId}-${task.id}-${recipientId}-${Date.now()}`,
      recipientId: String(recipientId),
      type: "task",
      title: "New task assigned to you",
      message: `${leaderName} assigned "${task.title}" to you. Due date: ${task.dueDate}.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      link: "/student/tasks",
      teamId,
      taskId: task.id,
    };

    // حفظ الإشعار مع بقية إشعارات النظام.
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify([...notifications, notification])
    );

    // إعلام المكونات التي تتابع عداد الإشعارات بالتحديث.
    window.dispatchEvent(
      new Event("gradtrack-notifications-updated")
    );

    return true;
  } catch {
    return false;
  }
}

function ManageTasks() {
  const currentStudent = getCurrentStudent();
  const currentTeam = getCurrentTeam(currentStudent);

  const currentStudentId = currentStudent?.universityId || "";

  const isLeader = Boolean(
    currentTeam &&
      currentStudentId &&
      String(currentTeam.leaderId) === String(currentStudentId)
  );

  const teamMembers = getTeamMembers(
    currentTeam,
    currentStudent
  );

  // تحميل المهام المحفوظة دون إنشاء مهام افتراضية.
  const [allTasks, setAllTasks] = useState(() =>
    loadAllTasks()
  );

  // عرض مهام الفريق الحالي فقط.
  const tasks = currentTeam
    ? allTasks.filter(
        (task) => task?.teamId === currentTeam.id
      )
    : [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [requiresSupervisorReview, setRequiresSupervisorReview] =
    useState(false);
  const [message, setMessage] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);

  // إنشاء مهمة جديدة أو تعديل مهمة موجودة.
  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!currentTeam || !isLeader) {
      setMessage(
        "Only the Team Leader can create or edit team tasks."
      );
      return;
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !assigneeId ||
      !dueDate
    ) {
      setMessage("Please complete all fields.");
      return;
    }

    // التأكد من أن الشخص المختار عضو حالي في الفريق.
    const assignee = teamMembers.find(
      (member) => String(member.id) === String(assigneeId)
    );

    if (!assignee) {
      setMessage(
        "Please select a current member of your team."
      );
      return;
    }

    const existingTask =
      editingTaskId !== null
        ? allTasks.find(
            (task) =>
              task.id === editingTaskId &&
              task.teamId === currentTeam.id
          )
        : null;

    if (editingTaskId !== null && !existingTask) {
      setMessage(
        "This task could not be found in your team."
      );
      return;
    }

    const isEditing = Boolean(existingTask);

    const updatedTask = {
      ...(existingTask || {}),
      id: isEditing ? existingTask.id : Date.now(),
      teamId: currentTeam.id,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      assigneeName: assignee.name,
      dueDate,
      status: existingTask?.status || "To Do",
      createdBy: existingTask?.createdBy || currentStudentId,
      createdAt:
        existingTask?.createdAt || new Date().toISOString(),

      // المحافظة على بيانات التسليم عند تعديل المهمة.
      submissions: Array.isArray(existingTask?.submissions)
        ? existingTask.submissions
        : [],

      submittedFile: existingTask?.submittedFile || "",

      requiresSubmission:
        existingTask?.requiresSubmission ?? true,
      // The leader can enable or disable supervisor review while editing a task.
      requiresSupervisorReview,
    };

    const updatedAllTasks = isEditing
      ? allTasks.map((task) =>
          task.id === existingTask.id &&
          task.teamId === currentTeam.id
            ? updatedTask
            : task
        )
      : [...allTasks, updatedTask];

    if (!saveAllTasks(updatedAllTasks)) {
      setMessage(
        "Could not save the task. Browser storage may be full."
      );
      return;
    }

    setAllTasks(updatedAllTasks);
    // نرسل إشعارًا عند إنشاء مهمة أو تغيير الشخص المكلّف بها.
// لا نرسل إشعارًا إذا كان القائد قد أسند المهمة لنفسه.
const assigneeChanged =
  !isEditing ||
  String(existingTask?.assigneeId ?? "") !==
    String(assigneeId);

const shouldNotifyAssignee =
  assigneeChanged &&
  String(assigneeId) !== String(currentStudentId);

let notificationSaved = true;

if (shouldNotifyAssignee) {
  notificationSaved = createTaskAssignmentNotification({
    recipientId: assigneeId,
    leaderName: currentStudent?.name || "Your Team Leader",
    task: updatedTask,
    teamId: currentTeam.id,
  });
}

    setTitle("");
    setDescription("");
    setAssigneeId("");
    setDueDate("");
    setRequiresSupervisorReview(false);
    setEditingTaskId(null);

    setMessage(
  shouldNotifyAssignee && !notificationSaved
    ? "Task saved, but the notification could not be saved."
    : isEditing
      ? "Task updated successfully."
      : "Task created and saved for your team."
);
  }

  // تعبئة النموذج ببيانات المهمة المطلوب تعديلها.
  function handleEdit(task) {
    if (!isLeader || task.teamId !== currentTeam?.id) {
      setMessage("You cannot edit this task.");
      return;
    }

    setEditingTaskId(task.id);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setAssigneeId(String(task.assigneeId || ""));
    setDueDate(task.dueDate || "");
    setRequiresSupervisorReview(
      task.requiresSupervisorReview === true
    );
    setMessage("");

    document
      .querySelector(".manage-tasks-form-card")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // حذف المهمة بعد تأكيد القائد، مع الحفاظ على مهام الفرق الأخرى.
  function handleRemoveTask(task) {
    setMessage("");

    if (
      !currentTeam ||
      !isLeader ||
      task.teamId !== currentTeam.id
    ) {
      setMessage("You cannot remove this task.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove "${task.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    const updatedAllTasks = allTasks.filter(
      (item) =>
        !(
          item.id === task.id &&
          item.teamId === currentTeam.id
        )
    );

    if (updatedAllTasks.length === allTasks.length) {
      setMessage("This task could not be found.");
      return;
    }

    if (!saveAllTasks(updatedAllTasks)) {
      setMessage(
        "Could not remove the task. Please try again."
      );
      return;
    }

    // تحديث قائمة المهام بعد نجاح الحذف.
    setAllTasks(updatedAllTasks);

    // إذا كانت المهمة قيد التعديل، إعادة النموذج لوضع الإنشاء.
    if (editingTaskId === task.id) {
      setEditingTaskId(null);
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setDueDate("");
      setRequiresSupervisorReview(false);
    }

    setMessage(`"${task.title}" was removed successfully.`);
  }

  // إلغاء التعديل وإعادة النموذج إلى وضع الإنشاء.
  function handleCancelEdit() {
    setEditingTaskId(null);
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setDueDate("");
    setRequiresSupervisorReview(false);
    setMessage("");
  }

  // عرض اسم الشخص المكلّف بالمهمة.
  function getAssigneeName(task) {
    return (
      teamMembers.find(
        (member) =>
          String(member.id) === String(task.assigneeId)
      )?.name ||
      task.assigneeName ||
      "Team Member"
    );
  }

  const teamStatus = currentTeam
    ? isLeader
      ? "leader"
      : "member"
    : currentStudent?.teamStatus || "no-team";

  return (
    <div className="manage-tasks-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="manage-tasks-content">
        <header className="manage-tasks-header">
          <p className="manage-tasks-eyebrow">
            TEAM MANAGEMENT
          </p>

          <h1>Manage Tasks</h1>

          <p>
            {currentTeam
              ? `Create and assign tasks for ${currentTeam.name}.`
              : "Manage tasks for your graduation project team."}
          </p>
        </header>

        {!currentTeam ? (
          <section className="manage-tasks-form-card">
            <h2>No Team Found</h2>

            <p>
              Create or join a team before managing its tasks.
            </p>

            <Link to="/student/create-team">
              Go to Create Team →
            </Link>
          </section>
        ) : !isLeader ? (
          <section className="manage-tasks-form-card">
            <h2>Team Leader Access Required</h2>

            <p>
              Only your Team Leader can create, assign, edit, or
              remove tasks. You can view your personal tasks and
              shared team tasks.
            </p>

            <Link to="/student/tasks">
              View My Tasks →
            </Link>
          </section>
        ) : (
          <>
            <section className="manage-tasks-form-card">
              <h2>
                {editingTaskId !== null
                  ? "Edit Task"
                  : "Create a New Task"}
              </h2>

              <p>
                Assign a task to any team member, including yourself.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="manage-tasks-field">
                  <label htmlFor="taskTitle">
                    Task Title
                  </label>

                  <input
                    id="taskTitle"
                    name="taskTitle"
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="e.g. Prepare project documentation"
                    maxLength={120}
                    required
                  />
                </div>

                <div className="manage-tasks-field">
                  <label htmlFor="taskDescription">
                    Description
                  </label>

                  <textarea
                    id="taskDescription"
                    name="taskDescription"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Describe what needs to be completed"
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>

                <div className="manage-tasks-form-row">
                  <div className="manage-tasks-field">
                    <label htmlFor="taskAssignee">
                      Assign To
                    </label>

                    <select
                      id="taskAssignee"
                      name="taskAssignee"
                      value={assigneeId}
                      onChange={(event) =>
                        setAssigneeId(event.target.value)
                      }
                      required
                    >
                      <option value="">
                        Select a team member
                      </option>

                      {teamMembers.map((member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="manage-tasks-field">
                    <label htmlFor="taskDueDate">
                      Due Date
                    </label>

                    <input
                      id="taskDueDate"
                      name="taskDueDate"
                      type="date"
                      value={dueDate}
                      onChange={(event) =>
                        setDueDate(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="manage-tasks-review-option">
                  <label htmlFor="requiresSupervisorReview">
                    <input
                      id="requiresSupervisorReview"
                      name="requiresSupervisorReview"
                      type="checkbox"
                      checked={requiresSupervisorReview}
                      onChange={(event) =>
                        setRequiresSupervisorReview(
                          event.target.checked
                        )
                      }
                    />
                    <span>
                      <strong>Requires supervisor review</strong>
                      <small>
                        Only submissions for this task will appear in the supervisor review inbox.
                      </small>
                    </span>
                  </label>
                </div>

                <div className="manage-tasks-form-actions">
                  <button
                    type="submit"
                    className="manage-tasks-submit"
                  >
                    {editingTaskId !== null
                      ? "Save Changes"
                      : "Create Task"}
                  </button>

                  {editingTaskId !== null && (
                    <button
                      type="button"
                      className="manage-tasks-cancel"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {message && (
                  <p
                    className="manage-tasks-message"
                    role="status"
                    aria-live="polite"
                  >
                    {message}
                  </p>
                )}
              </form>
            </section>

            <section className="manage-tasks-list-section">
              <div className="manage-tasks-list-header">
                <h2>Team Tasks</h2>

                <span>
                  {tasks.length}{" "}
                  {tasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="manage-tasks-empty">
                  <h3>No tasks yet</h3>

                  <p>
                    Create the first task for your team using
                    the form above.
                  </p>
                </div>
              ) : (
                <div className="manage-tasks-list">
                  {tasks.map((task) => (
                    <article
                      className="manage-task-card"
                      key={`${task.teamId}-${task.id}`}
                    >
                      <div className="manage-task-card-header">
                        <h3>{task.title}</h3>

                        <span
                          className={`manage-task-status ${
                            task.status === "In Progress"
                              ? "in-progress"
                              : task.status === "Completed"
                                ? "completed"
                                : "to-do"
                          }`}
                        >
                          {task.status || "To Do"}
                        </span>
                      </div>

                      <p className="manage-task-description">
                        {task.description}
                      </p>

                      <div className="manage-task-meta">
                        <span>
                          <strong>Assigned to:</strong>{" "}
                          {getAssigneeName(task)}
                        </span>

                        <span>
                          <strong>Due:</strong> {task.dueDate}
                        </span>
                      </div>

                      <div className="manage-task-actions">
                        <button
                          type="button"
                          className="manage-task-edit"
                          onClick={() => handleEdit(task)}
                        >
                          Edit Task
                        </button>

                        <button
                          type="button"
                          className="manage-task-delete"
                          onClick={() => handleRemoveTask(task)}
                        >
                          <Trash2 size={15} />
                          Remove Task
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <p className="manage-tasks-demo-note">
          Tasks are separated by team and saved locally in this
          browser. Backend synchronization will be added later.
        </p>
      </main>
    </div>
  );
}

export default ManageTasks;