
import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { getAllMockStudents } from "../../data/mockData";
import "./ManageTeam.css";
import { addNotification } from "../../utils/notifications";

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

// توحيد معرفات أعضاء الفريق ومنع تكرارها.
function getTeamMemberIds(team) {
  const ids = [
    team.leaderId,
    ...(Array.isArray(team.memberIds) ? team.memberIds : []),
    ...(Array.isArray(team.members)
      ? team.members.map(
          (member) => member.universityId || member.id
        )
      : []),
  ].filter(Boolean);

  return [...new Set(ids)];
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
  const [currentStudent] = useState(readCurrentStudent);
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
    team.leaderId === studentId;

  const memberIds = team ? getTeamMemberIds(team) : [];

  // الدعوات المعلّقة لهذا الفريق فقط.
  const pendingInvitations = invitations.filter(
    (invitation) =>
      invitation.teamId === team?.id &&
      invitation.status === "pending"
  );

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

    if (targetId === studentId) {
      showMessage("You cannot invite yourself to your own team.", "error");
      return;
    }

    if (memberIds.length >= MAX_TEAM_MEMBERS) {
      showMessage("Your team is full. A team can have up to four students.", "error");
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
      showMessage("Could not read the saved demo data.", "error");
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

    // نعتبر سجلات الفرق الفعلية مصدر الحقيقة للعضوية،
    // ونتجاهل حالة عضوية قديمة لا يشير إليها أي فريق محفوظ.
    const alreadyInTeam = teams.some((savedTeam) =>
      getTeamMemberIds(savedTeam).includes(targetId)
    );

    if (alreadyInTeam) {
      showMessage(
        "This student is already a member of a team.",
        "error"
      );
      return;
    }

    // منع تكرار الدعوة المعلّقة لنفس الطالب والفريق.
    const alreadyInvited = allInvitations.some(
      (invitation) =>
        invitation.teamId === team.id &&
        invitation.invitedStudentId === targetId &&
        invitation.status === "pending"
    );

    if (alreadyInvited) {
      showMessage(
        "An invitation has already been sent to this student.",
        "error"
      );
      return;
    }

    const invitation = {
      id: `inv-${Date.now()}`,
      teamId: team.id,
      teamName: team.name,
      leaderId: studentId,
      leaderName: currentStudent.name || "Team Leader",
      invitedStudentId: targetId,
      invitedStudentName: invitedStudent.name || "Student",
      memberCount: memberIds.length,
      maxMembers: MAX_TEAM_MEMBERS,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

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
          (id) => id !== memberId
        ),
        members: (team.members || []).filter(
          (item) =>
            (item.universityId || item.id) !== memberId
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

        <p className="manage-team-demo-note">
          Invitations and team membership are stored locally for this
          demo. Cross-device synchronization will require the backend.
        </p>
      </main>
    </div>
  );
}

export default ManageTeam;
