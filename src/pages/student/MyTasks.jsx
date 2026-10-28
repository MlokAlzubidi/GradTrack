import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./MyTasks.css";

const TASKS_STORAGE_KEY = "gradtrack-team-tasks";
const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const MAX_FILE_SIZE = 500 * 1024;

// قراءة بيانات الحساب الحالي من جلسة هذا التبويب.
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

// قراءة البيانات المحفوظة بأمان.
function readLocalArray(key) {
  try {
    const savedValue = localStorage.getItem(key);

    if (!savedValue) return [];

    const parsedValue = JSON.parse(savedValue);

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

// البحث عن فريق الطالب الحالي.
function getCurrentTeam(student) {
  if (!student?.universityId) return null;

  const teams = readLocalArray(TEAMS_STORAGE_KEY);

  if (student.teamId) {
    const team = teams.find(
      (item) => item.id === student.teamId
    );

    if (team) return team;
  }

  // احتياطًا إذا لم يكن teamId موجودًا في الحساب.
  return (
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
    }) || null
  );
}

// حفظ قائمة المهام المشتركة كاملة حتى لا تتأثر الفرق الأخرى.
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

// قراءة محتوى الملف حتى يظهر في Team Tasks.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = () =>
      reject(new Error("Could not read the selected file."));

    reader.readAsDataURL(file);
  });
}

function MyTasks() {
  const currentStudent = readCurrentStudent();
  const currentTeam = getCurrentTeam(currentStudent);

  const studentId = currentStudent?.universityId;
  const studentName = currentStudent?.name || "Team Member";

  const isLeader =
    Boolean(currentTeam) &&
    currentTeam.leaderId === studentId;

  const teamStatus = currentTeam
    ? isLeader
      ? "leader"
      : "member"
    : "no-team";

  const [allTasks, setAllTasks] = useState(() =>
    readLocalArray(TASKS_STORAGE_KEY)
  );

  const [selectedFiles, setSelectedFiles] = useState({});
  const [messages, setMessages] = useState({});

  // نعرض المهام التابعة للفريق الحالي فقط.
  const teamTasks = currentTeam
    ? allTasks.filter(
        (task) => task && task.teamId === currentTeam.id
      )
    : [];

  // نعرض للطالب المهام المسندة إليه باستخدام رقمه الجامعي.
  const myTasks = teamTasks.filter(
    (task) => task.assigneeId === studentId
  );

  // تحديث حالة المهمة وحفظها في المصدر المشترك.
  function handleStatusChange(taskId, newStatus) {
    if (!currentTeam || !studentId) return;

    const task = myTasks.find((item) => item.id === taskId);

    if (!task) {
      setMessages((current) => ({
        ...current,
        [taskId]: "This task is not assigned to your account.",
      }));
      return;
    }

    const updatedTasks = allTasks.map((item) =>
      item.id === taskId &&
      item.teamId === currentTeam.id
        ? { ...item, status: newStatus }
        : item
    );

    if (!saveTasks(updatedTasks)) {
      setMessages((current) => ({
        ...current,
        [taskId]:
          "Could not save the status. Browser storage may be full.",
      }));
      return;
    }

    setAllTasks(updatedTasks);

    setMessages((current) => ({
      ...current,
      [taskId]: "Task status updated.",
    }));
  }

  // اختيار ملف قبل إرساله.
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

  // إرسال الملف وتسجيله ضمن تسليمات المهمة المشتركة.
  async function handleSubmit(event, taskId) {
    event.preventDefault();

    // الاحتفاظ بمرجع النموذج قبل أي عملية async.
    const form = event.currentTarget;

    if (!currentTeam || !studentId) {
      setMessages((current) => ({
        ...current,
        [taskId]: "Please sign in and join a team first.",
      }));
      return;
    }

    const task = myTasks.find(
      (item) => item.id === taskId
    );

    if (!task) {
      setMessages((current) => ({
        ...current,
        [taskId]: "This task is not assigned to your account.",
      }));
      return;
    }

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
      const fileData = await readFileAsDataUrl(selectedFile);

      const newSubmission = {
        id: `${taskId}-${studentId}-${Date.now()}`,
        studentId,
        studentName,
        fileName: selectedFile.name,
        fileType: selectedFile.type || "application/octet-stream",
        fileSize: selectedFile.size,
        fileData,
        submittedAt: new Date().toISOString(),
      };

      const previousSubmissions = Array.isArray(task.submissions)
        ? task.submissions
        : [];

      // نحتفظ بآخر تسليم لهذا الطالب ونبقي تسليمات زملائه.
      const otherSubmissions = previousSubmissions.filter(
        (submission) => submission.studentId !== studentId
      );

      const updatedTasks = allTasks.map((item) =>
        item.id === taskId &&
        item.teamId === currentTeam.id
          ? {
              ...item,
              status: "Completed",
              submittedFile: selectedFile.name,
              submissions: [
                ...otherSubmissions,
                newSubmission,
              ],
            }
          : item
      );

      if (!saveTasks(updatedTasks)) {
        setMessages((current) => ({
          ...current,
          [taskId]:
            "Could not save the submission. Try a smaller file.",
        }));
        return;
      }

      setAllTasks(updatedTasks);

      setSelectedFiles((current) => ({
        ...current,
        [taskId]: null,
      }));

      // تفريغ حقل الملف بعد نجاح الحفظ.
      form.reset();

      setMessages((current) => ({
        ...current,
        [taskId]:
          "Submitted successfully! Your team can view and download the file in Team Tasks.",
      }));
    } catch {
      setMessages((current) => ({
        ...current,
        [taskId]:
          "Could not read the selected file. Please try again.",
      }));
    }
  }

  return (
    <div className="my-tasks-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

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
          Your tasks are filtered by your team and your account.
          Files are stored locally for this demo; the upload limit is 500 KB.
        </div>

        {!currentTeam ? (
          <section className="my-task-card">
            <h2>You are not in a team yet</h2>

            <p className="my-task-description">
              Join or create a team before accessing team tasks.
            </p>
          </section>
        ) : myTasks.length === 0 ? (
          <section className="my-task-card">
            <h2>No tasks assigned yet</h2>

            <p className="my-task-description">
              When your Team Leader assigns a task to you, it will
              appear here.
            </p>
          </section>
        ) : (
          <section className="my-tasks-list">
            {myTasks.map((task) => (
              <article className="my-task-card" key={task.id}>
                <div className="my-task-card-header">
                  <div>
                    <h2>{task.title}</h2>

                    <p className="my-task-description">
                      {task.description}
                    </p>
                  </div>

                  <span
                    className={`my-task-status ${(task.status || "To Do")
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {task.status || "To Do"}
                  </span>
                </div>

                <p className="my-task-due-date">
                  <strong>Due date:</strong>{" "}
                  <time dateTime={task.dueDate || ""}>
                    {task.dueDate || "Not specified"}
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
                      handleStatusChange(
                        task.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

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
                      (submission) =>
                        submission.studentId === studentId
                    ) && (
                      <p className="my-task-submitted-file">
                        Your latest submission is shared with the team.
                      </p>
                    )}

                    {messages[task.id] && (
                      <p
                        className="my-task-message"
                        role="status"
                      >
                        {messages[task.id]}
                      </p>
                    )}
                  </form>
                )}

                {task.requiresSubmission === false &&
                  messages[task.id] && (
                    <p
                      className="my-task-message"
                      role="status"
                    >
                      {messages[task.id]}
                    </p>
                  )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default MyTasks;