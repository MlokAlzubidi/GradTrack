
import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./MyTasks.css";

// يجب أن يكون هذا المفتاح نفسه في ManageTasks و TeamTasks.
const TASKS_STORAGE_KEY = "gradtrack-team-tasks";

// حد لحجم الملف التجريبي حتى لا يمتلئ تخزين المتصفح بسرعة.
const MAX_FILE_SIZE = 500 * 1024;

// المهام الأولية التي تظهر عند تشغيل التجربة لأول مرة.
const initialTasks = [
  {
    id: 1,
    title: "Research Project Requirements",
    description:
      "Research the problem and prepare the initial requirements document.",
    assigneeId: "student-1",
    dueDate: "2026-11-05",
    status: "In Progress",
    requiresSubmission: true,
    submittedFile: "",
    submissions: [],
  },
  {
    id: 2,
    title: "Prepare Project Documentation",
    description:
      "Prepare and organize the documentation assigned to you.",
    assigneeId: "student-2",
    dueDate: "2026-11-12",
    status: "To Do",
    requiresSubmission: true,
    submittedFile: "",
    submissions: [],
  },
  {
    id: 3,
    title: "Review Team Feedback",
    description:
      "Review the feedback provided by your team leader.",
    assigneeId: "student-2",
    dueDate: "2026-11-15",
    status: "To Do",
    requiresSubmission: false,
    submittedFile: "",
    submissions: [],
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

// تحميل المهام من مصدر البيانات المشترك.
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);

    if (savedTasks !== null) {
      const parsedTasks = JSON.parse(savedTasks);

      if (Array.isArray(parsedTasks)) {
        return parsedTasks;
      }
    }

    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(initialTasks)
    );

    return initialTasks;
  } catch {
    return initialTasks;
  }
}

// حفظ المهام والتسليمات في المتصفح.
function saveTasks(updatedTasks) {
  try {
    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(updatedTasks)
    );

    return true;
  } catch {
    return false;
  }
}

// قراءة محتوى الملف بصيغة يمكن لصفحة Team Tasks عرضها وتنزيلها.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File could not be read."));

    reader.readAsDataURL(file);
  });
}

function MyTasks({ teamStatus = "member" }) {
  const currentStudent = getCurrentStudent();

  const effectiveTeamStatus =
    currentStudent?.teamStatus ?? teamStatus;

  const currentStudentId = currentStudent?.universityId;

  const studentName = currentStudent?.name || "Team member";

  // دعم معرفات المهام التجريبية القديمة.
  const legacyAssignmentIds = {
    "2023001": ["student-1"],
    "2023002": ["student-2"],
  };

  const myAssignmentIds = [
    ...(currentStudentId ? [currentStudentId] : []),
    ...(legacyAssignmentIds[currentStudentId] ?? []),
  ];

  const [tasks, setTasks] = useState(loadTasks);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [messages, setMessages] = useState({});

  // لا نعرض للطالب إلا المهام المسندة إليه.
  const myTasks = tasks.filter((task) =>
    myAssignmentIds.includes(task.assigneeId)
  );

  // تحديث الحالة وحفظها حتى تظهر في بقية صفحات الفريق.
  function handleStatusChange(taskId, newStatus) {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, status: newStatus }
        : task
    );

    if (!saveTasks(updatedTasks)) {
      setMessages((current) => ({
        ...current,
        [taskId]: "Could not save the update. Browser storage may be full.",
      }));
      return;
    }

    setTasks(updatedTasks);

    setMessages((current) => ({
      ...current,
      [taskId]: "Task status updated.",
    }));
  }

  // تخزين الملف المختار مؤقتًا قبل الضغط على Submit.
  function handleFileChange(taskId, file) {
    setSelectedFiles((current) => ({
      ...current,
      [taskId]: file,
    }));

    setMessages((current) => ({
      ...current,
      [taskId]: "",
    }));
  }

  // تسجيل التسليم ومشاركته مع الفريق.
  async function handleSubmit(event, taskId) {
    event.preventDefault();

    // نحتفظ بالنموذج حتى نستطيع تفريغ حقل الملف بعد الحفظ.
    const form = event.currentTarget;
    const selectedFile = selectedFiles[taskId];

    if (!selectedFile) {
      setMessages((current) => ({
        ...current,
        [taskId]: "Please select a file before submitting.",
      }));
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setMessages((current) => ({
        ...current,
        [taskId]:
          "This demo supports files up to 500 KB. Please choose a smaller file.",
      }));
      return;
    }

    try {
      // قراءة محتوى الملف نفسه، وليس اسمه فقط.
      const fileData = await readFileAsDataUrl(selectedFile);

      const submission = {
        id: `${taskId}-${Date.now()}`,
        studentId: currentStudentId || "demo-student",
        studentName,
        fileName: selectedFile.name,
        fileType: selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        fileData,
        submittedAt: new Date().toISOString(),
      };

      const updatedTasks = tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        // عند إعادة التسليم، نستبدل تسليم الطالب السابق لهذه المهمة،
        // ونحافظ على أحدث تسليم لكل طالب.
        const previousSubmissions = Array.isArray(task.submissions)
          ? task.submissions
          : [];

        const otherSubmissions = previousSubmissions.filter(
          (item) => item.studentId !== submission.studentId
        );

        return {
          ...task,
          status: "Completed",
          submittedFile: selectedFile.name,
          submissions: [...otherSubmissions, submission],
        };
      });

      // لا نعرض النجاح إلا بعد حفظ بيانات المهمة والتسليم.
      if (!saveTasks(updatedTasks)) {
        setMessages((current) => ({
          ...current,
          [taskId]:
            "Could not save the file. Browser storage may be full. Try a smaller file.",
        }));
        return;
      }

      setTasks(updatedTasks);

      setSelectedFiles((current) => ({
        ...current,
        [taskId]: null,
      }));

      form.reset();

      setMessages((current) => ({
        ...current,
        [taskId]:
          "Submitted successfully! Your team can now view and download this file in Team Tasks.",
      }));
    } catch {
      setMessages((current) => ({
        ...current,
        [taskId]: "Could not read the file. Please try again.",
      }));
    }
  }

  return (
    <div className="my-tasks-page student-layout">
      <StudentNavbar teamStatus={effectiveTeamStatus} />

      <main className="my-tasks-content">
        <header className="my-tasks-header">
          <p className="my-tasks-eyebrow">TASK MANAGEMENT</p>

          <h1>My Tasks</h1>

          <p>
            View your assigned tasks, track their progress,
            and share your completed work with the team.
          </p>
        </header>

        <div className="my-tasks-demo-note">
          Submitted files are shared through this browser's demo storage.
          The maximum file size for this demo is 500 KB.
        </div>

        <section className="my-tasks-list">
          {myTasks.length === 0 ? (
            <article className="my-task-card">
              <h2>No tasks assigned yet</h2>
              <p className="my-task-description">
                Your assigned tasks will appear here when your
                Team Leader creates them.
              </p>
            </article>
          ) : (
            myTasks.map((task) => (
              <article className="my-task-card" key={task.id}>
                <div className="my-task-card-header">
                  <div>
                    <h2>{task.title}</h2>

                    <p className="my-task-description">
                      {task.description}
                    </p>
                  </div>

                  <span
                    className={`my-task-status ${(
                      task.status || "To Do"
                    )
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {task.status || "To Do"}
                  </span>
                </div>

                <p className="my-task-due-date">
                  <strong>Due date:</strong>{" "}
                  <time dateTime={task.dueDate}>
                    {task.dueDate}
                  </time>
                </p>

                <div className="my-task-status-control">
                  <label htmlFor={`task-status-${task.id}`}>
                    Update status
                  </label>

                  <select
                    id={`task-status-${task.id}`}
                    value={task.status || "To Do"}
                    onChange={(event) =>
                      handleStatusChange(task.id, event.target.value)
                    }
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* المهام قابلة للتسليم ما لم تُحدد على أنها لا تتطلب ملفًا. */}
                {task.requiresSubmission !== false && (
                  <form
                    className="my-task-submission"
                    onSubmit={(event) =>
                      handleSubmit(event, task.id)
                    }
                  >
                    <label htmlFor={`task-file-${task.id}`}>
                      Upload your task file
                    </label>

                    <input
                      id={`task-file-${task.id}`}
                      type="file"
                      onChange={(event) =>
                        handleFileChange(
                          task.id,
                          event.target.files?.[0] ?? null
                        )
                      }
                    />

                    <button type="submit">
                      Submit File
                    </button>

                    {task.submissions?.some(
                      (item) =>
                        item.studentId === currentStudentId
                    ) && (
                      <p className="my-task-submitted-file">
                        Your latest submission is shared with the team.
                      </p>
                    )}

                    {messages[task.id] && (
                      <p className="my-task-message" role="status">
                        {messages[task.id]}
                      </p>
                    )}
                  </form>
                )}

                {task.requiresSubmission === false &&
                  messages[task.id] && (
                    <p className="my-task-message" role="status">
                      {messages[task.id]}
                    </p>
                  )}
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default MyTasks;
