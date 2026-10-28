
import { useState } from "react";
import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./CreateTeam.css";

// مفاتيح التخزين المستخدمة في تجربة GradTrack.
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const STUDENT_OVERRIDES_KEY = "gradtrack-student-overrides";

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

// قراءة الفرق الموجودة في التخزين المحلي.
function readTeams() {
  const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);

  if (!savedTeams) {
    return [];
  }

  const teams = JSON.parse(savedTeams);

  if (!Array.isArray(teams)) {
    throw new Error("Invalid saved teams data.");
  }

  return teams;
}

function CreateTeam() {
  const [currentStudent, setCurrentStudent] = useState(
    readCurrentStudent
  );

  const [teamStatus, setTeamStatus] = useState(
    currentStudent?.teamStatus ?? "no-team"
  );

  const [teamName, setTeamName] = useState("");
  const [message, setMessage] = useState("");
  const [createdTeamName, setCreatedTeamName] = useState("");

  // الطالب الذي لديه فريق لا يستطيع إنشاء فريق ثانٍ.
  const hasTeam =
    teamStatus !== "no-team" ||
    Boolean(currentStudent?.teamId);

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const trimmedTeamName = teamName.trim();

    if (!trimmedTeamName) {
      setMessage("Please enter a team name.");
      return;
    }

    // نتأكد أن المستخدم سجّل دخوله أولًا.
    if (!currentStudent?.universityId) {
      setMessage("Please sign in before creating a team.");
      return;
    }

    // لا نسمح بإنشاء فريق آخر إذا كان الحساب مرتبطًا بفريق.
    if (
      currentStudent.teamId ||
      currentStudent.teamStatus === "member" ||
      currentStudent.teamStatus === "leader"
    ) {
      setMessage("You are already part of a team.");
      return;
    }

    let teams;

    try {
      teams = readTeams();
    } catch {
      setMessage(
        "Could not read the saved team data. Please try again."
      );
      return;
    }

    const studentId = currentStudent.universityId;

    // نتحقق أيضًا من الفرق المحفوظة لمنع العضوية المكررة.
    const alreadyInTeam = teams.some(
      (team) =>
        team.leaderId === studentId ||
        (Array.isArray(team.memberIds) &&
          team.memberIds.includes(studentId)) ||
        (Array.isArray(team.members) &&
          team.members.some(
            (member) =>
              member.universityId === studentId ||
              member.id === studentId
          ))
    );

    if (alreadyInTeam) {
      setMessage(
        "You are already part of a saved team. Please check My Team."
      );
      return;
    }

    // إنشاء معرّف جديد للفريق.
    const teamId = `team-${Date.now()}`;
    const now = new Date().toISOString();

    // القائد هو أول عضو في الفريق.
    // memberIds يسهل علينا التحقق من العضوية لاحقًا،
    // وmembers يحتفظ بتفاصيل الأعضاء لإدارة الفريق.
    const newTeam = {
      id: teamId,
      name: trimmedTeamName,
      leaderId: studentId,
      leaderName: currentStudent.name || "Student",
      memberIds: [studentId],
      members: [
        {
          id: studentId,
          universityId: studentId,
          name: currentStudent.name || "Student",
          role: "leader",
          joinedAt: now,
        },
      ],
      invitations: [],
      createdAt: now,
    };

    const updatedStudent = {
      ...currentStudent,
      role: "student",
      teamStatus: "leader",
      teamId,
    };

    try {
      // قراءة حالات الحساب التي يجب أن تبقى محفوظة بعد تسجيل الخروج.
      const savedOverrides = localStorage.getItem(
        STUDENT_OVERRIDES_KEY
      );

      const overrides = savedOverrides
        ? JSON.parse(savedOverrides)
        : {};

      if (
        !overrides ||
        typeof overrides !== "object" ||
        Array.isArray(overrides)
      ) {
        throw new Error("Invalid student overrides.");
      }

      // حفظ حالة القائد في سجل الحالات الدائم للحسابات التجريبية.
      const updatedOverrides = {
        ...overrides,
        [studentId]: {
          ...(overrides[studentId] || {}),
          teamStatus: "leader",
          teamId,
        },
      };

      // حفظ الفريق، ثم حالة العضوية، ثم الجلسة الحالية.
      localStorage.setItem(
        TEAMS_STORAGE_KEY,
        JSON.stringify([...teams, newTeam])
      );

      localStorage.setItem(
        STUDENT_OVERRIDES_KEY,
        JSON.stringify(updatedOverrides)
      );

      sessionStorage.setItem(
        CURRENT_STUDENT_KEY,
        JSON.stringify(updatedStudent)
      );
      // تحديث الواجهة فورًا دون الحاجة إلى تسجيل الخروج.
      setCurrentStudent(updatedStudent);
      setTeamStatus("leader");
      setCreatedTeamName(trimmedTeamName);
      setTeamName("");
      setMessage("");
    } catch {
      setMessage(
        "Could not save your team in this browser. Please try again."
      );
    }
  }

  return (
    <div className="create-team-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="create-team-content">
        <header className="create-team-header">
          <p className="create-team-eyebrow">
            TEAM MANAGEMENT
          </p>

          <h1>{hasTeam ? "Your Team" : "Create Your Team"}</h1>

          <p>
            {hasTeam
              ? "Manage your graduation project team and organize your work."
              : "Create a team for your graduation project and start organizing your work with your teammates."}
          </p>
        </header>

        <section className="create-team-card">
          {hasTeam ? (
            <>
              <h2>
                {teamStatus === "leader"
                  ? "Your Team Is Ready"
                  : "You Are Already in a Team"}
              </h2>

              <p>
                {createdTeamName
                  ? `Your team "${createdTeamName}" has been created successfully.`
                  : teamStatus === "leader"
                    ? "You are the Team Leader. You can now manage your team and invite members."
                    : "You can view your team details and continue working with your teammates."}
              </p>

              <div className="create-team-note">
                <strong>Team size</strong>
                <p>
                  Each team can have up to four students,
                  including the Team Leader.
                </p>
              </div>

              <Link
                className="create-team-manage-link"
                to={
                  teamStatus === "leader"
                    ? "/student/manage-team"
                    : "/student/team"
                }
              >
                {teamStatus === "leader"
                  ? "Manage Your Team"
                  : "View My Team"}
                <span aria-hidden="true"> →</span>
              </Link>
            </>
          ) : (
            <>
              <h2>Team Information</h2>

              <p>
                You will automatically become the Team Leader
                after the team is successfully created.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="create-team-field">
                  <label htmlFor="teamName">Team Name</label>

                  <input
                    id="teamName"
                    name="teamName"
                    type="text"
                    value={teamName}
                    onChange={(event) => {
                      setTeamName(event.target.value);
                      setMessage("");
                    }}
                    placeholder="Enter your team name"
                    maxLength={80}
                    required
                  />
                </div>

                <div className="create-team-note">
                  <strong>Team size</strong>
                  <p>
                    Each team can have up to four students,
                    including the Team Leader.
                  </p>
                </div>

                <button type="submit">
                  Create Team
                </button>

                {message && (
                  <p
                    className="create-team-message"
                    role="alert"
                  >
                    {message}
                  </p>
                )}
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default CreateTeam;
