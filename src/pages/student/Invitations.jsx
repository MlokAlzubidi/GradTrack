import { useEffect, useMemo, useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./Invitations.css";
import { addNotification } from "../../utils/notifications";
import { getTeamMemberIds, prepareInvitationAcceptance, prepareInvitationDecline } from "../../utils/teamInvitationRules";

const TEAMS_KEY = "gradtrack-teams";
const INVITATIONS_KEY = "gradtrack-invitations";
const STUDENT_KEY = "gradtrack-current-student";
const OVERRIDES_KEY = "gradtrack-student-overrides";
const MAX_TEAM_MEMBERS = 4;

function readSessionStudent() {
  try { return JSON.parse(sessionStorage.getItem(STUDENT_KEY) || "null"); } catch { return null; }
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function restoreStorage(key, value) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

function timestampNow() {
  return new Date().toISOString();
}

export default function Invitations() {
  const [student, setStudent] = useState(readSessionStudent);
  const [teams, setTeams] = useState(() => readArray(TEAMS_KEY));
  const [invitations, setInvitations] = useState(() => readArray(INVITATIONS_KEY));
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const studentId = student?.universityId;
  const currentTeam = useMemo(() => teams.find((team) => getTeamMemberIds(team).includes(String(studentId))), [teams, studentId]);
  const hasTeam = Boolean(currentTeam);
  const pending = useMemo(() => invitations.filter((item) => item.status === "pending" && String(item.invitedStudentId) === String(studentId)), [invitations, studentId]);

  useEffect(() => {
    const refresh = () => {
      setStudent(readSessionStudent());
      setTeams(readArray(TEAMS_KEY));
      setInvitations(readArray(INVITATIONS_KEY));
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (!currentTeam || !studentId) return;
    pending.forEach((invitation) => addNotification({
      id: `invitation-response-${invitation.id}-blocked-membership`,
      recipientId: invitation.leaderId,
      type: "invitation",
      title: "Invitation cannot be accepted yet",
      message: `${student?.name || "The invited student"} is currently a member of ${currentTeam.name || "another team"} and must leave before accepting your invitation.`,
      link: "/student/manage-team",
      relatedId: invitation.id,
    }));
  }, [currentTeam, pending, student?.name, studentId]);

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function handleAccept(invitation) {
    setMessage("");
    const latestStudent = readSessionStudent();
    if (!latestStudent?.universityId || String(latestStudent.universityId) !== String(invitation.invitedStudentId)) {
      showMessage("Please sign in to the invited student's account before accepting.", "error");
      return;
    }
    try {
      const latestTeams = readArray(TEAMS_KEY);
      const latestInvitations = readArray(INVITATIONS_KEY);
      const currentInvitation = latestInvitations.find((item) => String(item.id) === String(invitation.id));
      if (!currentInvitation || currentInvitation.status !== "pending" || String(currentInvitation.invitedStudentId) !== String(latestStudent.universityId)) {
        setInvitations(latestInvitations);
        setTeams(latestTeams);
        showMessage("This invitation is no longer pending. The list has been refreshed.", "error");
        return;
      }

      const prepared = prepareInvitationAcceptance({ teams: latestTeams, invitations: latestInvitations, student: latestStudent, invitationId: invitation.id, now: timestampNow() });
      if (prepared.code === "already-member") {
        const activeTeam = prepared.activeTeam;
        addNotification({
          id: `invitation-response-${currentInvitation.id}-blocked-membership`,
          recipientId: currentInvitation.leaderId,
          type: "invitation",
          title: "Invitation cannot be accepted yet",
          message: `${latestStudent.name || "The invited student"} is currently a member of ${activeTeam.name || "another team"} and must leave before accepting your invitation.`,
          link: "/student/manage-team",
          relatedId: currentInvitation.id,
        });
        setTeams(latestTeams);
        showMessage("You are currently a member of another team. Leave that team first, then return to accept this invitation.", "error");
        return;
      }

      if (prepared.error) {
        setTeams(latestTeams);
        showMessage(prepared.error, "error");
        return;
      }
      const { team: targetTeam, teams: updatedTeams, invitations: updatedInvitations, student: updatedStudent } = prepared;
      const rawOverrides = localStorage.getItem(OVERRIDES_KEY);
      const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) throw new Error("Invalid student membership data.");
      const updatedOverrides = { ...overrides, [latestStudent.universityId]: { ...(overrides[latestStudent.universityId] || {}), teamStatus: "member", teamId: targetTeam.id } };

      const previousTeams = localStorage.getItem(TEAMS_KEY);
      const previousOverrides = localStorage.getItem(OVERRIDES_KEY);
      const previousInvitations = localStorage.getItem(INVITATIONS_KEY);
      const previousSession = sessionStorage.getItem(STUDENT_KEY);
      try {
        localStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams));
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(updatedOverrides));
        localStorage.setItem(INVITATIONS_KEY, JSON.stringify(updatedInvitations));
        sessionStorage.setItem(STUDENT_KEY, JSON.stringify(updatedStudent));
      } catch (error) {
        restoreStorage(TEAMS_KEY, previousTeams);
        restoreStorage(OVERRIDES_KEY, previousOverrides);
        restoreStorage(INVITATIONS_KEY, previousInvitations);
        if (previousSession === null) sessionStorage.removeItem(STUDENT_KEY); else sessionStorage.setItem(STUDENT_KEY, previousSession);
        throw error;
      }

      setStudent(updatedStudent);
      setTeams(updatedTeams);
      setInvitations(updatedInvitations);
      addNotification({
        id: `invitation-response-${currentInvitation.id}-accepted`,
        recipientId: currentInvitation.leaderId,
        type: "invitation",
        title: "Invitation Accepted",
        message: `${latestStudent.name || "A student"} accepted your invitation to join ${targetTeam.name || currentInvitation.teamName}.`,
        link: "/student/manage-team",
        relatedId: currentInvitation.id,
      });
      showMessage(`You joined ${targetTeam.name} successfully. Other pending invitations remain available.`, "success");
    } catch {
      showMessage("Could not save your response. No membership changes were retained; please try again.", "error");
    }
  }

  function handleDecline(invitation) {
    setMessage("");
    try {
      const latestStudent = readSessionStudent();
      const latestInvitations = readArray(INVITATIONS_KEY);
      const prepared = prepareInvitationDecline({ invitations: latestInvitations, student: latestStudent, invitationId: invitation.id, now: timestampNow() });
      if (prepared.error) {
        setInvitations(latestInvitations);
        showMessage(prepared.error, "error");
        return;
      }
      const { invitation: latest, invitations: updated } = prepared;
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(updated));
      setInvitations(updated);
      addNotification({ id: `invitation-response-${latest.id}-declined`, recipientId: latest.leaderId, type: "invitation", title: "Invitation Declined", message: `${latestStudent.name || "A student"} declined your invitation to join ${latest.teamName || "your team"}.`, link: "/student/manage-team", relatedId: latest.id });
      showMessage(`You declined the invitation to ${latest.teamName || "this team"}.`);
    } catch {
      showMessage("Could not save your response. Please try again.", "error");
    }
  }

  return (
    <div className="invitations-page student-layout">
      <StudentNavbar teamStatus={hasTeam ? (String(currentTeam.leaderId) === String(studentId) ? "leader" : "member") : (student?.teamStatus || "no-team")} />
      <main className="invitations-content">
        <header className="invitations-header">
          <p className="invitations-eyebrow">TEAM MANAGEMENT</p>
          <h1>Team Invitations</h1>
          <p>Review invitations sent to your university ID and decide whether to join a team.</p>
        </header>
        {message && <p className={`invitations-message ${messageType}`} role="status">{message}</p>}
        {hasTeam && <p className="invitations-message" role="status">You are currently in {currentTeam.name || "a team"}. Accept is disabled until you leave your current team. Other invitations will remain pending.</p>}
        {pending.length === 0 ? (
          <section className="invitations-empty-state"><h2>No pending invitations</h2><p>When a Team Leader invites your university ID, the invitation will appear here.</p></section>
        ) : (
          <section className="invitations-list">
            {pending.map((invitation) => {
              const team = teams.find((item) => String(item.id) === String(invitation.teamId));
              const memberCount = team ? getTeamMemberIds(team).length : invitation.memberCount || 0;
              const isFull = memberCount >= MAX_TEAM_MEMBERS;
              return (
                <article className="invitation-card" key={invitation.id}>
                  <div className="invitation-details">
                    <h2>{team?.name || invitation.teamName || "Team invitation"}</h2>
                    <p>Invited by: {invitation.leaderName || (team?.leaderName || "Team Leader")}</p>
                    <p>Team Leader: {team?.leaderName || invitation.leaderName || "Not specified"}</p>
                    <p>Team Size: {memberCount}/{MAX_TEAM_MEMBERS} students</p>
                    {hasTeam && <span className="invitation-full-label">Leave your current team before accepting</span>}
                    {isFull && <span className="invitation-full-label">Team is full</span>}
                    {!team && <span className="invitation-full-label">Team is no longer available</span>}
                  </div>
                  <div className="invitation-actions">
                    <button type="button" className="invitation-accept" onClick={() => handleAccept(invitation)} disabled={hasTeam || isFull || !team}>Accept</button>
                    <button type="button" className="invitation-decline" onClick={() => handleDecline(invitation)}>Decline</button>
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
