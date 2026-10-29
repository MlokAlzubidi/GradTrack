
import { useEffect, useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { getAllMockStudents } from "../../data/mockData";
import "./ManageTeam.css";
import { addNotification } from "../../utils/notifications";
import { getTeamMemberIds, prepareInvitation, prepareMemberLeave } from "../../utils/teamInvitationRules";

const TEAMS_STORAGE_KEY = "gradtrack-teams";
const INVITATIONS_STORAGE_KEY = "gradtrack-invitations";
const CURRENT_STUDENT_KEY = "gradtrack-current-student";
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
// قراءة الفرق المحفوظة.
function readTeams() {
  const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);

  if (!savedTeams) return [];

  const teams = JSON.parse(savedTeams);

  if (!Array.isArray(teams)) {
    throw new Error("Invalid team data.");
  }

  return teams;
}

// قراءة الدعوات المحفوظة.
function readInvitations() {
  const savedInvitations = localStorage.getItem(
    INVITATIONS_STORAGE_KEY
  );

  if (!savedInvitations) return [];

  const invitations = JSON.parse(savedInvitations);

  if (!Array.isArray(invitations)) {
    throw new Error("Invalid invitations data.");
  }

  return invitations;
}

// قراءة بيانات الفريق الحالي.
function loadTeamData() {
  try {
    const student = readCurrentStudent();

    if (!student?.universityId || !student.teamId) {
      return {
        team: null,
        members: [],
        error: "",
      };
    }

    const teams = readTeams();

    const team = teams.find(
      (item) => item.id === student.teamId
    );

    if (!team) {
      return {
        team: null,
        members: [],
        error: "Your team could not be found.",
      };
    }

    const members = (team.members || []).map((member) => {
      const id = member.universityId || member.id;

      return {
        ...member,
        id,
        universityId: id,
        role:
          id === team.leaderId
            ? "Team Leader"
            : "Member",
      };
    });

    return { team, members, error: "" };
  } catch {
    return {
      team: null,
      members: [],
      error: "Could not load the saved team information.",
    };
  }
}

function ManageTeam() {
  const [currentStudent, setCurrentStudent] = useState(readCurrentStudent);
  const [teamData, setTeamData] = useState(loadTeamData);

  const [inviteUniversityId, setInviteUniversityId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [invitations, setInvitations] = useState(() => {
    try {
      return readInvitations();
    } catch {
      return [];
    }
  });

  const team = teamData.team;
  const members = teamData.members;
  const studentId = currentStudent?.universityId;

  const isLeader =
    Boolean(team) &&
    String(team.leaderId) === String(studentId);

  const memberIds = team ? getTeamMemberIds(team) : [];

  // الدعوات المعلّقة لهذا الفريق فقط.
  const pendingInvitations = invitations.filter(
    (invitation) =>
      invitation.teamId === team?.id &&
      invitation.status === "pending"
  );

  useEffect(() => {
    function refreshInvitations() {
      try { setInvitations(readInvitations()); } catch { /* Keep current view if storage is temporarily invalid. */ }
    }
    window.addEventListener("storage", refreshInvitations);
    window.addEventListener("focus", refreshInvitations);
    return () => {
      window.removeEventListener("storage", refreshInvitations);
      window.removeEventListener("focus", refreshInvitations);
    };
  }, []);

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  // إرسال دعوة باستخدام الرقم الجامعي للطالب.
  function handleSendInvitation(event) {
    event.preventDefault();
    showMessage("");

    const targetId = inviteUniversityId.trim();

    if (!targetId) {
      showMessage("Please enter the student's university ID.", "error");
      return;
    }

    if (!team || !isLeader) {
      showMessage("Only the Team Leader can send invitations.", "error");
      return;
    }

    let students;
    let teams;
    let allInvitations;

    try {
      students = getAllMockStudents();
      teams = readTeams();
      allInvitations = readInvitations();
    } catch {
      showMessage("Could not read the saved team information.", "error");
      return;
    }

    // نتأكد أن الرقم الجامعي مرتبط بحساب موجود.
    const invitedStudent = students.find(
      (student) =>
        String(student.universityId).trim() === targetId
    );

    if (!invitedStudent) {
      showMessage(
        "No registered student was found with that university ID.",
        "error"
      );
      return;
    }

    const prepared = prepareInvitation({
      team,
      student: currentStudent,
      invitedStudent,
      teams,
      invitations: allInvitations,
    });
    if (prepared.error) {
      showMessage(prepared.error, "error");
      return;
    }
    const invitation = prepared.invitation;

    const updatedInvitations = [
      ...allInvitations,
      invitation,
    ];

    try {
      localStorage.setItem(
        INVITATIONS_STORAGE_KEY,
        JSON.stringify(updatedInvitations)
      );

      setInvitations(updatedInvitations);
setInviteUniversityId("");

const notificationSaved = addNotification({
  id: `invitation-${invitation.id}-${targetId}`,
  recipientId: targetId,
  type: "invitation",
  title: "New Team Invitation",
  message: `${currentStudent.name || "A Team Leader"} invited you to join ${team.name}.`,
  link: "/student/invitations",
  relatedId: invitation.id,
});

showMessage(
  notificationSaved
    ? `Invitation sent to ${invitation.invitedStudentName} (${targetId}).`
    : "The invitation was sent, but its notification could not be saved.",
  notificationSaved ? "success" : "error"
);
    } catch {
      showMessage(
        "Could not save the invitation in this browser.",
        "error"
      );
    }
  }

  // إزالة عضو عادي وتحديث بيانات العضوية.
  function handleRemoveMember(member) {
    if (!team || !isLeader) {
      showMessage("Only the Team Leader can remove members.", "error");
      return;
    }

    if (member.role === "Team Leader") {
      showMessage("The Team Leader cannot be removed.", "error");
      return;
    }

    const memberId = member.universityId;

    if (!memberId) {
      showMessage("Could not identify this student.", "error");
      return;
    }

    if (
      !window.confirm(
        `Remove ${member.name} from ${team.name}?`
      )
    ) {
      return;
    }

    try {
      const teams = readTeams();

      const updatedTeam = {
        ...team,
      memberIds: getTeamMemberIds(team).filter(
          (id) => String(id) !== String(memberId)
        ),
        members: (team.members || []).filter(
          (item) =>
            String(item.universityId || item.id) !== String(memberId)
        ),
      };

      const updatedTeams = teams.map((item) =>
        item.id === team.id ? updatedTeam : item
      );

      const savedOverrides = localStorage.getItem(
        STUDENT_OVERRIDES_KEY
      );

      const overrides = savedOverrides
        ? JSON.parse(savedOverrides)
        : {};

      const updatedOverrides = {
        ...overrides,
        [memberId]: {
          ...(overrides[memberId] || {}),
          teamStatus: "no-team",
          teamId: null,
        },
      };

      localStorage.setItem(
        TEAMS_STORAGE_KEY,
        JSON.stringify(updatedTeams)
      );

      localStorage.setItem(
        STUDENT_OVERRIDES_KEY,
        JSON.stringify(updatedOverrides)
      );

      setTeamData({
        team: updatedTeam,
        members: updatedTeam.members.map((item) => {
          const id = item.universityId || item.id;

          return {
            ...item,
            id,
            universityId: id,
            role:
              id === updatedTeam.leaderId
                ? "Team Leader"
                : "Member",
          };
        }),
        error: "",
      });

      showMessage(
        `${member.name} was removed from the team.`,
        "success"
      );
    } catch {
      showMessage("Could not update the team.", "error");
    }
  }

  function handleLeaveTeam() {
    if (!team || !studentId) return;
    if (String(team.leaderId) === String(studentId)) {
      showMessage("Team Leaders cannot leave while they are responsible for the team. Transfer leadership first; leadership transfer is not available yet.", "error");
      return;
    }
    if (!window.confirm(`Leave ${team.name}? You can accept a pending invitation after leaving.`)) return;
    try {
      const teams = readTeams();
      const prepared = prepareMemberLeave({ teams, student: currentStudent });
      if (prepared.error) {
        showMessage(prepared.error, "error");
        return;
      }
      const { teams: updatedTeams, student: updatedStudent } = prepared;
      const savedOverrides = localStorage.getItem(STUDENT_OVERRIDES_KEY);
      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};
      if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) throw new Error("Invalid student overrides.");
      const updatedOverrides = { ...overrides, [studentId]: { ...(overrides[studentId] || {}), teamStatus: "no-team", teamId: null } };
      const oldTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
      const oldOverrides = localStorage.getItem(STUDENT_OVERRIDES_KEY);
      const oldSession = sessionStorage.getItem(CURRENT_STUDENT_KEY);
      try {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updatedTeams));
        localStorage.setItem(STUDENT_OVERRIDES_KEY, JSON.stringify(updatedOverrides));
        sessionStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(updatedStudent));
      } catch (error) {
        if (oldTeams === null) localStorage.removeItem(TEAMS_STORAGE_KEY); else localStorage.setItem(TEAMS_STORAGE_KEY, oldTeams);
        if (oldOverrides === null) localStorage.removeItem(STUDENT_OVERRIDES_KEY); else localStorage.setItem(STUDENT_OVERRIDES_KEY, oldOverrides);
        if (oldSession === null) sessionStorage.removeItem(CURRENT_STUDENT_KEY); else sessionStorage.setItem(CURRENT_STUDENT_KEY, oldSession);
        throw error;
      }
      setCurrentStudent(updatedStudent);
      setTeamData({ team: null, members: [], error: "" });
      addNotification({ id: `team-member-left-${team.id}-${studentId}-${Date.now()}`, recipientId: team.leaderId, type: "invitation", title: "Team member left", message: `${currentStudent.name || "A student"} left ${team.name}.`, link: "/student/manage-team", relatedId: team.id });
      showMessage(`You left ${team.name}. Your pending invitations are still available.`, "success");
    } catch {
      showMessage("Could not leave the team. No membership changes were saved; please try again.", "error");
    }
  }

  const teamStatus = team
    ? isLeader
      ? "leader"
      : "member"
    : currentStudent?.teamStatus || "no-team";

  return (
    <div className="manage-team-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="manage-team-content">
        <header className="manage-team-header">
          <p className="manage-team-eyebrow">TEAM MANAGEMENT</p>

          <h1>Manage Team</h1>

          <p>
            View your team members and manage team membership.
          </p>
        </header>

        {message && (
          <p
            className={`manage-team-message ${messageType}`}
            role="status"
          >
            {message}
          </p>
        )}

        {teamData.error ? (
          <section className="manage-team-summary">
            <h2>Unable to Load Team</h2>
            <p>{teamData.error}</p>
          </section>
        ) : !team ? (
          <section className="manage-team-summary">
            <div>
              <h2>You are not in a team yet</h2>
              <p>Create a team to start managing your project.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="manage-team-summary">
              <div>
                <h2>{team.name}</h2>
                <p>Team Leader: {team.leaderName}</p>
              </div>

              <div className="manage-team-capacity">
                <span>Team Size</span>
                <strong>{memberIds.length} / {MAX_TEAM_MEMBERS}</strong>
              </div>
            </section>

            {isLeader ? (
              <p className="manage-team-leader-leave-note">Team Leaders cannot leave while they are responsible for this team. Leadership transfer is not available.</p>
            ) : (
              <button type="button" className="manage-team-leave" onClick={handleLeaveTeam}>Leave Team</button>
            )}

            <section className="manage-team-members">
              <div className="manage-team-section-header">
                <h2>Team Members</h2>
                <span>
                  {members.length}{" "}
                  {members.length === 1 ? "student" : "students"}
                </span>
              </div>

              {members.map((member) => (
                <article
                  className="manage-team-member"
                  key={member.universityId}
                >
                  <div className="manage-team-avatar" aria-hidden="true">
                    {(member.name || "?").charAt(0).toUpperCase()}
                  </div>

                  <div className="manage-team-member-info">
                    <h3>{member.name || "Unnamed student"}</h3>
                    <p>University ID: {member.universityId}</p>
                  </div>

                  <span
                    className={
                      member.role === "Team Leader"
                        ? "manage-team-role leader"
                        : "manage-team-role"
                    }
                  >
                    {member.role}
                  </span>

                  {isLeader &&
                    member.role !== "Team Leader" && (
                      <button
                        type="button"
                        className="manage-team-remove"
                        onClick={() => handleRemoveMember(member)}
                      >
                        Remove
                      </button>
                    )}
                </article>
              ))}
            </section>

            {isLeader && (
              <section className="manage-team-invite-card">
                <div>
                  <p className="manage-team-eyebrow">
                    BUILD YOUR TEAM
                  </p>

                  <h2>Invite Team Members</h2>

                  <p>
                    Enter a registered student's university ID.
                    Invitations are only accepted after the student
                    responds from their own account.
                  </p>

                  <p className="manage-team-invite-capacity">
                    {MAX_TEAM_MEMBERS - memberIds.length} team{" "}
                    {MAX_TEAM_MEMBERS - memberIds.length === 1
                      ? "place"
                      : "places"}{" "}
                    remaining.
                  </p>
                </div>

                <form
                  className="manage-team-invite-form"
                  onSubmit={handleSendInvitation}
                >
                  <label htmlFor="inviteUniversityId">
                    Student University ID
                  </label>

                  <div className="manage-team-invite-controls">
                    <input
                      id="inviteUniversityId"
                      name="inviteUniversityId"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="e.g. 2023002"
                      value={inviteUniversityId}
                      onChange={(event) => {
                        setInviteUniversityId(event.target.value);
                        setMessage("");
                      }}
                      disabled={memberIds.length >= MAX_TEAM_MEMBERS}
                      required
                    />

                    <button
                      type="submit"
                      disabled={memberIds.length >= MAX_TEAM_MEMBERS}
                    >
                      Send Invitation
                    </button>
                  </div>
                </form>

                {pendingInvitations.length > 0 && (
                  <div className="manage-team-pending">
                    <h3>Pending Invitations</h3>

                    {pendingInvitations.map((invitation) => (
                      <div
                        className="manage-team-pending-item"
                        key={invitation.id}
                      >
                        <div>
                          <strong>
                            {invitation.invitedStudentName}
                          </strong>
                          <span>
                            University ID: {invitation.invitedStudentId}
                          </span>
                        </div>

                        <span className="manage-team-role">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default ManageTeam;
