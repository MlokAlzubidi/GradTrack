import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { getAllMockStudents } from "../../data/mockData";
import { addNotification } from "../../utils/notifications";
import { getTeamMemberIds, prepareMemberLeave } from "../../utils/teamInvitationRules";
import "./MyTeam.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const STUDENT_OVERRIDES_KEY = "gradtrack-student-overrides";
const MAX_TEAM_MEMBERS = 4;

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

// قراءة بيانات الفرق المشتركة.
function readTeams() {
  try {
    const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);

    if (!savedTeams) {
      return [];
    }

    const teams = JSON.parse(savedTeams);
    return Array.isArray(teams) ? teams : [];
  } catch {
    return [];
  }
}

function restoreLocalStorage(key, value) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

function loadMyTeamData() {
  const student = readCurrentStudent();

  if (!student?.universityId) {
    return {
      student: null,
      team: null,
      members: [],
      teamStatus: "no-team",
      error: "",
    };
  }

  const teams = readTeams();

  // البحث باستخدام teamId أولًا.
  // وإذا لم يكن محفوظًا، نبحث عن الفريق الذي يحتوي على الرقم الجامعي.
  const membershipTeams = teams.filter((item) =>
    getTeamMemberIds(item).includes(String(student.universityId))
  );
  const team =
    membershipTeams.find((item) => String(item.id) === String(student.teamId)) ||
    membershipTeams[0] ||
    null;

  if (!team) {
    return {
      student,
      team: null,
      members: [],
      teamStatus: "no-team",
      error: "",
    };
  }

  // تحديد حالة الطالب من عضويته الفعلية داخل الفريق.
  const teamStatus =
    String(team.leaderId) === String(student.universityId)
      ? "leader"
      : "member";

  // أسماء الحسابات المعروفة في بيانات التجربة.
  const allStudents = getAllMockStudents();

  const savedMembers = Array.isArray(team.members)
    ? team.members
    : [];

  // بناء قائمة موحدة للأعضاء اعتمادًا على معرفاتهم الفعلية.
  const members = getTeamMemberIds(team).map((memberId) => {
    const savedMember = savedMembers.find(
      (member) =>
        String(member.universityId || member.id) === String(memberId)
    );

    const account = allStudents.find(
      (item) => String(item.universityId) === String(memberId)
    );

    const isLeader = String(memberId) === String(team.leaderId);

    return {
      id: memberId,
      universityId: memberId,
      name:
        savedMember?.name ||
        account?.name ||
        (isLeader ? team.leaderName : null) ||
        "Student",
      role: isLeader ? "Team Leader" : "Member",
    };
  });

  return {
    student,
    team,
    members,
    teamStatus,
    error: "",
  };
}

function MyTeam() {
  const [teamData, setTeamData] = useState(loadMyTeamData);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const { student, team, members, teamStatus, error } = teamData;

  useEffect(() => {
    function refreshTeam() {
      setTeamData(loadMyTeamData());
    }
    window.addEventListener("storage", refreshTeam);
    window.addEventListener("focus", refreshTeam);
    return () => {
      window.removeEventListener("storage", refreshTeam);
      window.removeEventListener("focus", refreshTeam);
    };
  }, []);

  function handleLeaveTeam() {
    const latestStudent = readCurrentStudent();
    if (!latestStudent?.universityId || String(latestStudent.universityId) !== String(student?.universityId)) {
      setMessageType("error");
      setMessage("Your student session changed. Refresh the page before leaving the team.");
      return;
    }

    let teams;
    try {
      teams = readTeams();
    } catch {
      setMessageType("error");
      setMessage("Could not read the saved team data. Please try again.");
      return;
    }

    const prepared = prepareMemberLeave({ teams, student: latestStudent });
    if (prepared.error) {
      setMessageType("error");
      setMessage(prepared.error);
      return;
    }

    if (!window.confirm(`Leave ${prepared.team.name || "this team"}? Your pending invitations will remain available.`)) return;

    try {
      const rawOverrides = localStorage.getItem(STUDENT_OVERRIDES_KEY);
      const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
        throw new Error("Invalid student override data.");
      }

      const updatedOverrides = {
        ...overrides,
        [latestStudent.universityId]: {
          ...(overrides[latestStudent.universityId] || {}),
          teamStatus: "no-team",
          teamId: null,
        },
      };
      const previousTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
      const previousOverrides = localStorage.getItem(STUDENT_OVERRIDES_KEY);
      const previousSession = sessionStorage.getItem(CURRENT_STUDENT_KEY);

      try {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(prepared.teams));
        localStorage.setItem(STUDENT_OVERRIDES_KEY, JSON.stringify(updatedOverrides));
        sessionStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(prepared.student));
      } catch (storageError) {
        restoreLocalStorage(TEAMS_STORAGE_KEY, previousTeams);
        restoreLocalStorage(STUDENT_OVERRIDES_KEY, previousOverrides);
        if (previousSession === null) sessionStorage.removeItem(CURRENT_STUDENT_KEY);
        else sessionStorage.setItem(CURRENT_STUDENT_KEY, previousSession);
        throw storageError;
      }

      setTeamData(loadMyTeamData());
      const notificationSaved = addNotification({
        id: `team-member-left-${prepared.team.id}-${latestStudent.universityId}-${Date.now()}`,
        recipientId: prepared.team.leaderId,
        type: "invitation",
        title: "Team member left",
        message: `${latestStudent.name || "A student"} left ${prepared.team.name || "your team"}.`,
        link: "/student/team",
        relatedId: prepared.team.id,
      });
      setMessageType(notificationSaved ? "success" : "error");
      setMessage(notificationSaved
        ? `You left ${prepared.team.name || "the team"}. Your pending invitations are still available.`
        : `You left ${prepared.team.name || "the team"}, but the Team Leader notification could not be saved.`);
    } catch {
      setMessageType("error");
      setMessage("Could not leave the team. No membership changes were saved; please try again.");
    }
  }

  const leaderName =
    team?.leaderName ||
    members.find((member) => member.role === "Team Leader")?.name ||
    "Team Leader";

  return (
    <div className="my-team-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="my-team-content">
        <header className="my-team-header">
          <p className="my-team-eyebrow">TEAM MANAGEMENT</p>

          <h1>My Team</h1>

          <p>
            View your graduation team, its members, and team
            information.
          </p>
        </header>

        {message && <p className={`my-team-feedback ${messageType}`} role="status">{message}</p>}

        {error ? (
          <section className="my-team-details">
            <h2>Unable to Load Team</h2>
            <p>{error}</p>
          </section>
        ) : !team ? (
          <section className="my-team-empty">
            <div
              className="my-team-empty-icon"
              aria-hidden="true"
            >
              🎓
            </div>

            <h2>You are not part of a team yet</h2>

            <p>
              Create a new team or check your invitations to get
              started with your graduation project.
            </p>

            <div className="my-team-actions">
              {student?.teamStatus !== "leader" &&
                student?.teamStatus !== "member" && (
                  <Link
                    to="/student/create-team"
                    className="my-team-secondary-link"
                  >
                    Create Team
                  </Link>
                )}

              <Link
                to="/student/invitations"
                className="my-team-secondary-link"
              >
                View Invitations
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="my-team-details">
              <div className="my-team-details-heading">
                <div>
                  <p className="my-team-eyebrow">YOUR TEAM</p>
                  <h2>{team.name}</h2>
                  <p>Team Leader: {leaderName}</p>
                </div>

                <div className="my-team-capacity">
                  <span>Team Size</span>
                  <strong>
                    {members.length} / {MAX_TEAM_MEMBERS}
                  </strong>
                </div>
              </div>

              <div className="my-team-role-note">
                You are{" "}
                <strong>
                  {teamStatus === "leader"
                    ? "the Team Leader"
                    : "a Team Member"}
                </strong>
                .
              </div>

              {teamStatus === "member" && (
                <button type="button" className="my-team-leave-button" onClick={handleLeaveTeam}>
                  <LogOut size={16} strokeWidth={2} aria-hidden="true" />
                  Leave Team
                </button>
              )}

              {teamStatus === "leader" && members.length > 1 && (
                <p className="my-team-leader-leave-note" role="note">
                  Team Leaders cannot leave while other members depend on them. Transfer leadership before leaving; leadership transfer is not available yet.
                </p>
              )}
            </section>

            <section className="my-team-members-section">
              <div className="my-team-members-heading">
                <h2>Team Members</h2>

                <span>
                  {members.length}{" "}
                  {members.length === 1 ? "student" : "students"}
                </span>
              </div>

              <div className="my-team-members-list">
                {members.map((member) => (
                  <article
                    className="my-team-member-card"
                    key={member.universityId}
                  >
                    <div
                      className="my-team-member-avatar"
                      aria-hidden="true"
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="my-team-member-info">
                      <h3>{member.name}</h3>
                      <p>
                        University ID: {member.universityId}
                      </p>
                    </div>

                    <span
                      className={
                        member.role === "Team Leader"
                          ? "my-team-member-role leader"
                          : "my-team-member-role"
                      }
                    >
                      {member.role}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default MyTeam;
