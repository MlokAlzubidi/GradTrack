
import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./ManageTasks.css";

// المفتاح الذي سنستخدمه لحفظ المهام التجريبية ومشاركتها
// بين صفحات إدارة المهام والمهام الشخصية لاحقًا.
const TASKS_STORAGE_KEY = "gradtrack-team-tasks";

// مهام تجريبية أولية تظهر عند استخدام الصفحة لأول مرة.
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

// جلب بيانات الطالب الذي سجّل دخوله.
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

// قراءة المهام المحفوظة.
// إذا لم تكن هناك مهام محفوظة بعد، نبدأ بالبيانات التجريبية.
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
    // نستخدم المهام الأولية إذا تعذرت قراءة البيانات المحفوظة.
  }

  return initialTasks;
}

function ManageTasks() {
  // بيانات القائد الحالي تُستخدم لتعريف مهماته الشخصية.
  const currentStudent = getCurrentStudent();

  const leaderId = currentStudent?.universityId || "team-leader";
  const leaderName = currentStudent?.name?.trim() || "Team Leader";

  // القائد جزء من الفريق، ولذلك يجب أن يظهر ضمن الأشخاص
  // الذين يمكن إسناد المهام إليهم.
  const teamMembers = [
    {
      id: leaderId,
      name: `${leaderName} (You — Team Leader)`,
    },
    { id: "student-1", name: "Ahmad Khalil" },
    { id: "student-2", name: "Lina Omar" },
    { id: "student-3", name: "Mohammad Ali" },
  ];

  // قراءة المهام المحفوظة عند فتح الصفحة.
  const [tasks, setTasks] = useState(loadTasks);

  // حالات الحقول الموجودة في نموذج إنشاء المهمة.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");

  // يحتفظ بمعرّف المهمة التي نعدّلها.
// null تعني أننا ننشئ مهمة جديدة.
const [editingTaskId, setEditingTaskId] = useState(null);

  // إنشاء مهمة جديدة وإسنادها للشخص الذي تم اختياره.
  
function handleSubmit(event) {
  event.preventDefault();
  setMessage("");

  if (
    !title.trim() ||
    !description.trim() ||
    !assigneeId ||
    !dueDate
  ) {
    setMessage("Please complete all fields.");
    return;
  }

  const isEditing = editingTaskId !== null;

  // نحدّث المهمة الحالية إذا كنا في وضع التعديل،
  // أو ننشئ مهمة جديدة إذا كنا في وضع الإنشاء.
  const newTask = {
    id: isEditing ? editingTaskId : Date.now(),
    title: title.trim(),
    description: description.trim(),
    assigneeId,
    dueDate,
    status: isEditing
      ? tasks.find((task) => task.id === editingTaskId)?.status ?? "To Do"
      : "To Do",
    createdBy: leaderId,
  };

  const updatedTasks = isEditing
    ? tasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, ...newTask }
          : task
      )
    : [...tasks, newTask];

  // نحفظ التعديلات في نفس مكان تخزين المهام المشتركة.
  try {
    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(updatedTasks)
    );
  } catch {
    setMessage("Could not save the task. Please try again.");
    return;
  }

  setTasks(updatedTasks);

  // إعادة ضبط الفورم بعد نجاح العملية.
  setTitle("");
  setDescription("");
  setAssigneeId("");
  setDueDate("");
  setEditingTaskId(null);

  setMessage(
    isEditing
      ? "Task updated successfully in this demo."
      : "Task created successfully in this demo."
  );
}

function handleEdit(task) {
  // تعبئة الفورم ببيانات المهمة التي اختارها القائد.
  setEditingTaskId(task.id);
  setTitle(task.title);
  setDescription(task.description);
  setAssigneeId(task.assigneeId);
  setDueDate(task.dueDate);
  setMessage("");

  // نقل المستخدم إلى الفورم حتى يبدأ التعديل مباشرة.
  document
    .querySelector(".manage-tasks-form-card")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleCancelEdit() {
  // إلغاء التعديل وإعادة الفورم إلى وضع إنشاء مهمة جديدة.
  setEditingTaskId(null);
  setTitle("");
  setDescription("");
  setAssigneeId("");
  setDueDate("");
  setMessage("");
}


  // إظهار اسم الشخص المكلّف بالمهمة بدلًا من رقمه الداخلي.
  function getAssigneeName(id) {
    return (
      teamMembers.find((member) => member.id === id)?.name ??
      "Unknown member"
    );
  }

  return (
    <div className="manage-tasks-page student-layout">
      <StudentNavbar teamStatus="leader" />

      <main className="manage-tasks-content">
        <header className="manage-tasks-header">
          <p className="manage-tasks-eyebrow">
            TEAM MANAGEMENT
          </p>

          <h1>Manage Tasks</h1>

          <p>
            Create tasks, assign them to yourself or your team
            members, and follow their progress.
          </p>
        </header>

        <section className="manage-tasks-form-card">
          <h2>{editingTaskId !== null ? "Edit Task" : "Create a New Task"}</h2>

          <p>
            Choose who will complete the task and set a deadline.
            You can assign tasks to yourself as Team Leader too.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="manage-tasks-field">
              <label htmlFor="taskTitle">Task Title</label>

              <input
                id="taskTitle"
                name="taskTitle"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Prepare project documentation"
                maxLength={120}
                required
              />
            </div>

            <div className="manage-tasks-field">
              <label htmlFor="taskDescription">Description</label>

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
                <label htmlFor="taskAssignee">Assign To</label>

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
                    Select who will do this task
                  </option>

                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="manage-tasks-field">
                <label htmlFor="taskDueDate">Due Date</label>

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

            <div className="manage-tasks-form-actions">
  <button type="submit" className="manage-tasks-submit">
    {editingTaskId !== null ? "Save Changes" : "Create Task"}
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
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="manage-tasks-empty">
              <h3>No tasks yet</h3>
              <p>Create your first task using the form above.</p>
            </div>
          ) : (
            <div className="manage-tasks-list">
              {tasks.map((task) => (
                <article className="manage-task-card" key={task.id}>
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
                      {task.status}
                    </span>
                  </div>

                  <p className="manage-task-description">
                    {task.description}
                  </p>

                  <div className="manage-task-meta">
                    <span>
                      <strong>Assigned to:</strong>{" "}
                      {getAssigneeName(task.assigneeId)}
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
</div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="manage-tasks-demo-note">
          Demo data is stored locally in this browser. It is not yet
          synchronized with the backend or other users.
        </p>
      </main>
    </div>
  );
}

export default ManageTasks;
