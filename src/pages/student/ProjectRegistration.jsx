
import { useState } from "react";
import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { getAllSupervisors, createAssignmentRequest } from "../../utils/supervisorAssignments";
import "./ProjectRegistration.css";

// مفاتيح البيانات المشتركة في GradTrack.
const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const PROJECTS_STORAGE_KEY = "gradtrack-projects";

// قراءة الحساب الحالي من التبويب الحالي فقط.
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

// قراءة JSON من localStorage بأمان.
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

// تحميل الحساب الحالي والفريق والمشروع الخاص به.
function loadProjectPageData() {
  const student = readCurrentStudent();
  const teams = readLocalData(TEAMS_STORAGE_KEY, []);
  const projects = readLocalData(PROJECTS_STORAGE_KEY, []);

  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  if (!student?.universityId) {
    return {
      student: null,
      team: null,
      project: null,
      teamStatus: "no-team",
      isLeader: false,
    };
  }

  // البحث عن الفريق الذي ينتمي إليه الحساب الحالي.
  let team = null;

  if (student.teamId) {
    team =
      safeTeams.find((item) => item.id === student.teamId) || null;
  }

  // احتياطًا إذا لم يكن teamId محفوظًا في الحساب.
  if (!team) {
    team =
      safeTeams.find((item) => {
        const memberIds = [
          item.leaderId,
          ...(Array.isArray(item.memberIds) ? item.memberIds : []),
          ...(Array.isArray(item.members)
            ? item.members.map(
                (member) => member.universityId || member.id
              )
            : []),
        ].filter(Boolean);

        return memberIds.includes(student.universityId);
      }) || null;
  }

  const isLeader =
    Boolean(team) &&
    team.leaderId === student.universityId;

  const teamStatus = team
    ? isLeader
      ? "leader"
      : "member"
    : student.teamStatus === "leader" ||
        student.teamStatus === "member"
      ? student.teamStatus
      : "no-team";

  // كل فريق يملك سجل مشروع مستقلًا.
  const project = team
    ? safeProjects.find((item) => item.teamId === team.id) || null
    : null;

  return {
    student,
    team,
    project,
    teamStatus,
    isLeader,
  };
}

function ProjectRegistration() {
  const [pageData, setPageData] = useState(loadProjectPageData);

  const [projectTitle, setProjectTitle] = useState(
    () => pageData.project?.title || ""
  );

  const [projectDomain, setProjectDomain] = useState(
    () => pageData.project?.domain || ""
  );

  const [projectDescription, setProjectDescription] = useState(
    () => pageData.project?.description || ""
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [supervisorId, setSupervisorId] = useState(() => pageData.team?.requestedSupervisorId || pageData.team?.supervisorId || "");

  const { student, team, project, teamStatus, isLeader } = pageData;

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    // لا يمكن تسجيل مشروع قبل تسجيل الدخول والانضمام لفريق.
    if (!student?.universityId || !team) {
      showMessage(
        "Please sign in and make sure you belong to a team first.",
        "error"
      );
      return;
    }

    // التسجيل والتعديل من صلاحية قائد الفريق فقط.
    if (!isLeader) {
      showMessage(
        "Only the Team Leader can register or edit the project.",
        "error"
      );
      return;
    }

    const title = projectTitle.trim();
    const description = projectDescription.trim();

    if (!title || !projectDomain || !description) {
      showMessage("Please complete all required fields.", "error");
      return;
    }

    if (!supervisorId || !getAllSupervisors().some((item) => String(item.id) === String(supervisorId))) {
      showMessage("Please select an academic supervisor.", "error");
      return;
    }

    const savedProjects = readLocalData(PROJECTS_STORAGE_KEY, []);

    if (!Array.isArray(savedProjects)) {
      showMessage(
        "Could not read the saved project information.",
        "error"
      );
      return;
    }

    const existingProject = savedProjects.find(
      (item) => item.teamId === team.id
    );

    const now = new Date().toISOString();

    // نحافظ على معرّف المشروع وتاريخ إنشائه عند تعديله.
    const updatedProject = {
      id: existingProject?.id || `project-${team.id}`,
      teamId: team.id,
      teamName: team.name,
      title,
      domain: projectDomain,
      description,
      supervisorId: team.supervisorId || null,
      requestedSupervisorId: team.requestedSupervisorId || null,
      supervisorAssignmentStatus: team.supervisorAssignmentStatus || "unassigned",
      registeredBy: student.universityId,
      createdAt: existingProject?.createdAt || now,
      updatedAt: now,
      status: existingProject?.status || "Registered",
    };

    const updatedProjects = existingProject
      ? savedProjects.map((item) =>
          item.teamId === team.id ? updatedProject : item
        )
      : [...savedProjects, updatedProject];

    try {
      localStorage.setItem(
        PROJECTS_STORAGE_KEY,
        JSON.stringify(updatedProjects)
      );

      if (team.supervisorAssignmentStatus !== "accepted") {
        const result = createAssignmentRequest({ team, project: updatedProject, supervisorId, leader: student });
        if (result.error) {
          showMessage(result.error, "error");
          return;
        }
      }

      // تحديث حالة الصفحة حتى تظهر البيانات المحفوظة مباشرة.
      setPageData((currentData) => ({
        ...currentData,
        team: currentData.team?.supervisorAssignmentStatus === "accepted"
          ? currentData.team
          : { ...currentData.team, requestedSupervisorId: String(supervisorId), supervisorAssignmentStatus: "pending" },
        project: currentData.team?.supervisorAssignmentStatus === "accepted"
          ? updatedProject
          : { ...updatedProject, requestedSupervisorId: String(supervisorId), supervisorAssignmentStatus: "pending" },
      }));

      showMessage(
          "Project saved. Your supervisor assignment request is pending approval.",
        "success"
      );
    } catch {
      showMessage(
        "Could not save the project in this browser. Please try again.",
        "error"
      );
    }
  }

  return (
    <div className="project-registration-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="project-registration-content">
        <header className="project-registration-header">
          <p className="project-registration-eyebrow">
            GRADUATION PROJECT
          </p>

          <h1>Project Registration</h1>

          <p>
            Register your team's graduation project before
            submitting the proposal for supervisor review.
          </p>
        </header>

        {!team ? (
          <section className="project-registration-card">
            <h2>You need to join a team first</h2>

            <p>
              Project registration is available to Team Leaders
              after a team has been created.
            </p>

            <Link to="/student/create-team">
              Go to Create Team →
            </Link>
          </section>
        ) : !isLeader ? (
          <section className="project-registration-card">
            <h2>{project?.title || "Project Information"}</h2>

            {project ? (
              <>
                <p>
                  <strong>Project Domain:</strong> {project.domain}
                </p>

                <p>{project.description}</p>

                <p>
                  <strong>Status:</strong> {project.status}
                </p>
              </>
            ) : (
              <p>
                Your Team Leader has not registered the project yet.
              </p>
            )}

            <p>
              You can view your team's project information here.
              Only the Team Leader can register or edit it.
            </p>
          </section>
        ) : (
          <section className="project-registration-card">
            <h2>Project Information</h2>

            <p>
              Enter the basic information about your team's project.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="project-registration-field">
                <label htmlFor="projectTitle">
                  Project Title
                </label>

                <input
                  id="projectTitle"
                  type="text"
                  value={projectTitle}
                  onChange={(event) => {
                    setProjectTitle(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Enter your project title"
                  maxLength={150}
                  required
                />
              </div>

              <div className="project-registration-field">
                <label htmlFor="projectDomain">
                  Project Domain
                </label>

                <select
                  id="projectDomain"
                  value={projectDomain}
                  onChange={(event) => {
                    setProjectDomain(event.target.value);
                    setMessage("");
                  }}
                  required
                >
                  <option value="">Select a domain</option>
                  <option value="Web Development">
                    Web Development
                  </option>
                  <option value="Mobile Development">
                    Mobile Development
                  </option>
                  <option value="Software Engineering">
                    Software Engineering
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="project-registration-field">
                <label htmlFor="projectSupervisor">Academic Supervisor</label>
                <select id="projectSupervisor" value={supervisorId} onChange={(event) => { setSupervisorId(event.target.value); setMessage(""); }} required disabled={team?.supervisorAssignmentStatus === "accepted"}>
                  <option value="">Select a supervisor</option>
                  {getAllSupervisors().map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{supervisor.name} · {supervisor.email}{supervisor.department ? ` · ${supervisor.department}` : ""}</option>)}
                </select>
                {(team?.supervisorAssignmentStatus === "pending") && <small>Your request is awaiting supervisor approval.</small>}
                {(team?.supervisorAssignmentStatus === "rejected") && <small>Your previous request was declined. Select a supervisor to request again.</small>}
              </div>

              <div className="project-registration-field">
                <label htmlFor="projectDescription">
                  Project Description
                </label>

                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(event) => {
                    setProjectDescription(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Describe the project idea and the problem it addresses"
                  rows={5}
                  maxLength={3000}
                  required
                />
              </div>

              <button type="submit">
                {project ? "Save Changes" : "Register Project"}
              </button>

              {message && (
                <p
                  className={`project-registration-message ${messageType}`}
                  role="status"
                >
                  {message}
                </p>
              )}

              {project && (
                <p className="project-registration-saved-note">
                  Registered on{" "}
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              )}
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default ProjectRegistration;
