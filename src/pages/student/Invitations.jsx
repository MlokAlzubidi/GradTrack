import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./Invitations.css";
import { addNotification } from "../../utils/notifications";

// مفاتيح التخزين المستخدمة بين صفحات GradTrack.
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const INVITATIONS_STORAGE_KEY = "gradtrack-invitations";
const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const STUDENT_OVERRIDES_KEY = "gradtrack-student-overrides";

const MAX_TEAM_MEMBERS = 4;

// قراءة الحساب الحالي من التبويب الحالي فقط.
function readCurrentStudent() {
  try {
    const savedStudent = sessionStorage.getItem(CURRENT_STUDENT_KEY);
    return savedStudent ? JSON.parse(savedStudent) : null;
  } catch {
    return null;
  }
}

// قراءة الفرق المحفوظة.
function readTeams() {
  try {
    const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);

    if (!savedTeams) return [];

    const teams = JSON.parse(savedTeams);
    return Array.isArray(teams) ? teams : [];
  } catch {
    return [];
  }
}

// قراءة الدعوات المرسلة في تجربة GradTrack.
function readInvitations() {
  try {
    const savedInvitations = localStorage.getItem(
      INVITATIONS_STORAGE_KEY
    );

    if (!savedInvitations) return [];

    const invitations = JSON.parse(savedInvitations);
    return Array.isArray(invitations) ? invitations : [];
  } catch {
    return [];
  }
}

// حفظ سجل الدعوات.
function saveInvitations(invitations) {
  localStorage.setItem(
    INVITATIONS_STORAGE_KEY,
    JSON.stringify(invitations)
  );
}

// توحيد معرفات أعضاء الفريق، بما فيها البيانات القديمة.
function getTeamMemberIds(team) {
  const ids = [
    ...(Array.isArray(team.memberIds) ? team.memberIds : []),
    ...(Array.isArray(team.members)
      ? team.members.map(
          (member) => member.universityId || member.id
        )
      : []),
  ].filter(Boolean);

  return [...new Set(ids)];
}

function Invitations() {
  const [currentStudent, setCurrentStudent] = useState(
    readCurrentStudent
  );

  const [invitations, setInvitations] = useState(
    readInvitations
  );

  const [message, setMessage] = useState("");

  const studentId = currentStudent?.universityId;

  const teamStatus = currentStudent?.teamStatus || "no-team";

  const hasTeam =
    Boolean(currentStudent?.teamId) ||
    teamStatus === "member" ||
    teamStatus === "leader";

  // الطالب يشوف الدعوات الموجهة إلى رقمه الجامعي فقط.
  const pendingInvitations = invitations.filter(
    (invitation) =>
      invitation.status === "pending" &&
      String(invitation.invitedStudentId) === String(studentId)
  );

  // قبول الدعوة وإضافة الطالب إلى الفريق.
  function handleAccept(invitation) {
    setMessage("");

    if (!currentStudent || !studentId) {
      setMessage("Please sign in to accept an invitation.");
      return;
    }

    if (hasTeam) {
      setMessage(
        "You already belong to a team. You cannot join another team."
      );
      return;
    }

    try {
      const teams = readTeams();

      const team = teams.find(
        (item) => item.id === invitation.teamId
      );

      if (!team) {
        setMessage(
          "This team is no longer available. Please contact the Team Leader."
        );
        return;
      }

      const memberIds = getTeamMemberIds(team);

      // التأكد من أن الطالب ليس عضوًا بالفريق مسبقًا.
      if (
        memberIds.some((id) => String(id) === String(studentId))
      ) {
        setMessage("You are already a member of this team.");
        return;
      }

      // الحد الأقصى يشمل القائد وجميع الأعضاء.
      if (memberIds.length >= MAX_TEAM_MEMBERS) {
        setMessage(
          "This team has reached its maximum capacity of four students."
        );
        return;
      }

      // قراءة معلومات الطالب الحالي وإضافته كعضو.
      const joinedAt = new Date().toISOString();

      const newMember = {
        id: studentId,
        universityId: studentId,
        name: currentStudent.name || "Student",
        role: "member",
        joinedAt,
      };

      const updatedTeam = {
        ...team,
        memberIds: [...memberIds, studentId],
        members: [
          ...(Array.isArray(team.members) ? team.members : []),
          newMember,
        ],
      };

      const updatedTeams = teams.map((item) =>
        item.id === team.id ? updatedTeam : item
      );

      const updatedStudent = {
        ...currentStudent,
        role: "student",
        teamStatus: "member",
        teamId: team.id,
      };

      // تحديث حالة العضوية الدائمة للحساب التجريبي.
      const savedOverrides = localStorage.getItem(
        STUDENT_OVERRIDES_KEY
      );

      const overrides = savedOverrides
        ? JSON.parse(savedOverrides)
        : {};

      const updatedOverrides = {
        ...overrides,
        [studentId]: {
          ...(overrides[studentId] || {}),
          teamStatus: "member",
          teamId: team.id,
        },
      };

      // تحديث حالة الدعوة حتى لا تُقبل مرة أخرى.
      const updatedInvitations = invitations.map((item) =>
        item.id === invitation.id
          ? {
              ...item,
              status: "accepted",
              respondedAt: new Date().toISOString(),
            }
          : item
      );

      // حفظ الفريق والعضوية والدعوة والحساب الحالي.
      localStorage.setItem(
        TEAMS_STORAGE_KEY,
        JSON.stringify(updatedTeams)
      );

      localStorage.setItem(
        STUDENT_OVERRIDES_KEY,
        JSON.stringify(updatedOverrides)
      );

      saveInvitations(updatedInvitations);

      sessionStorage.setItem(
        CURRENT_STUDENT_KEY,
        JSON.stringify(updatedStudent)
      );

      // تحديث الشاشة فورًا بعد نجاح الحفظ.
      setCurrentStudent(updatedStudent);
      setInvitations(updatedInvitations);

      // إرسال إشعار لقائد الفريق عند قبول الدعوة.
      addNotification({
        id: `invitation-response-${invitation.id}-accepted`,
        recipientId: invitation.leaderId,
        type: "invitation",
        title: "Invitation Accepted",
        message: `${currentStudent.name || "A student"} accepted your invitation to join ${team.name || invitation.teamName}.`,
        link: "/student/manage-team",
        relatedId: invitation.id,
      });

      setMessage(`You joined ${team.name} successfully.`);
    } catch {
      setMessage(
        "Could not save your response. Please try again."
      );
    }
  }

  // رفض الدعوة دون تغيير عضوية الطالب.
  function handleDecline(invitation) {
    setMessage("");

    try {
      const updatedInvitations = invitations.map((item) =>
        item.id === invitation.id
          ? {
              ...item,
              status: "declined",
              respondedAt: new Date().toISOString(),
            }
          : item
      );

      // حفظ حالة الرفض أولًا.
      saveInvitations(updatedInvitations);
      setInvitations(updatedInvitations);

      // إرسال إشعار لقائد الفريق عند رفض الدعوة.
      addNotification({
        id: `invitation-response-${invitation.id}-declined`,
        recipientId: invitation.leaderId,
        type: "invitation",
        title: "Invitation Declined",
        message: `${currentStudent?.name || "A student"} declined your invitation to join ${invitation.teamName || "your team"}.`,
        link: "/student/manage-team",
        relatedId: invitation.id,
      });

      setMessage(
        `You declined the invitation to ${invitation.teamName}.`
      );
    } catch {
      setMessage(
        "Could not save your response. Please try again."
      );
    }
  }

  // نقرأ أسماء الفرق وحجمها الحالي من البيانات المحفوظة.
  const teams = readTeams();

  return (
    <div className="invitations-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="invitations-content">
        <header className="invitations-header">
          <p className="invitations-eyebrow">
            TEAM MANAGEMENT
          </p>

          <h1>Team Invitations</h1>

          <p>
            Review invitations sent to your university ID
            and decide whether to join a team.
          </p>
        </header>

        <p className="invitations-demo-note">
          Invitations are stored locally for this demo.
        </p>

        {message && (
          <p className="invitations-message" role="status">
            {message}
          </p>
        )}

        {hasTeam && (
          <p className="invitations-message" role="status">
            You already belong to a team. You must leave your current
            team before joining another one.
          </p>
        )}

        {pendingInvitations.length === 0 ? (
          <section className="invitations-empty-state">
            <h2>No pending invitations</h2>

            <p>
              When a Team Leader invites your university ID,
              the invitation will appear here.
            </p>
          </section>
        ) : (
          <section className="invitations-list">
            {pendingInvitations.map((invitation) => {
              const team = teams.find(
                (item) => item.id === invitation.teamId
              );

              const memberCount = team
                ? getTeamMemberIds(team).length
                : invitation.memberCount || 0;

              const isFull =
                memberCount >= MAX_TEAM_MEMBERS;

              const teamExists = Boolean(team);

              return (
                <article
                  className="invitation-card"
                  key={invitation.id}
                >
                  <div className="invitation-details">
                    <h2>{invitation.teamName}</h2>

                    <p>
                      Team Leader: {invitation.leaderName}
                    </p>

                    <p>
                      Team Size: {memberCount}/{MAX_TEAM_MEMBERS} students
                    </p>

                    {isFull && (
                      <span className="invitation-full-label">
                        Team is full
                      </span>
                    )}

                    {!teamExists && (
                      <span className="invitation-full-label">
                        Team is no longer available
                      </span>
                    )}
                  </div>

                  <div className="invitation-actions">
                    <button
                      type="button"
                      className="invitation-accept"
                      onClick={() => handleAccept(invitation)}
                      disabled={
                        hasTeam || isFull || !teamExists
                      }
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="invitation-decline"
                      onClick={() => handleDecline(invitation)}
                    >
                      Decline
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default Invitations;