const idEquals = (a, b) => a != null && b != null && String(a) === String(b);

export function getTeamMemberIds(team) {
  return [...new Set([
    team?.leaderId,
    ...(Array.isArray(team?.memberIds) ? team.memberIds : []),
    ...(Array.isArray(team?.members) ? team.members.map((member) => member.universityId || member.id) : []),
  ].filter((id) => id != null && id !== "").map(String))];
}

export function prepareInvitation({ team, student, invitedStudent, teams, invitations, now = new Date().toISOString() }) {
  if (!team || !idEquals(team.leaderId, student?.universityId)) return { error: "Only the current Team Leader can send invitations." };
  if (!invitedStudent?.universityId) return { error: "No registered student was found with that university ID." };
  if (idEquals(invitedStudent.universityId, student.universityId)) return { error: "You cannot invite yourself to your own team." };
  const currentTeam = teams.find((item) => idEquals(item.id, team.id));
  if (!currentTeam || !idEquals(currentTeam.leaderId, student.universityId)) return { error: "Only the current Team Leader can send invitations." };
  const memberIds = getTeamMemberIds(currentTeam);
  if (memberIds.length >= 4) return { error: "Your team is full. A team can have up to four students." };
  if (memberIds.includes(String(invitedStudent.universityId))) return { error: "This student is already a member of your team." };
  if (invitations.some((item) => idEquals(item.teamId, currentTeam.id) && idEquals(item.invitedStudentId, invitedStudent.universityId) && item.status === "pending")) return { error: "An invitation has already been sent to this student." };
  return { invitation: {
    id: `inv-${currentTeam.id}-${invitedStudent.universityId}-${Date.now()}`,
    teamId: currentTeam.id,
    teamName: currentTeam.name,
    leaderId: student.universityId,
    leaderName: student.name || "Team Leader",
    invitedStudentId: String(invitedStudent.universityId),
    invitedStudentName: invitedStudent.name || "Student",
    memberCount: memberIds.length,
    maxMembers: 4,
    status: "pending",
    createdAt: now,
  } };
}

export function prepareInvitationAcceptance({ teams, invitations, student, invitationId, now = new Date().toISOString() }) {
  if (!student?.universityId) return { error: "Please sign in to accept an invitation." };
  const invitation = invitations.find((item) => idEquals(item.id, invitationId));
  if (!invitation || invitation.status !== "pending" || !idEquals(invitation.invitedStudentId, student.universityId)) return { error: "This invitation is no longer pending. The list has been refreshed." };
  const activeTeam = teams.find((team) => getTeamMemberIds(team).includes(String(student.universityId)));
  if (activeTeam) return { error: `You are currently a member of ${activeTeam.name || "another team"}. Leave that team before accepting an invitation.`, code: "already-member", activeTeam, invitation };
  const team = teams.find((item) => idEquals(item.id, invitation.teamId));
  if (!team) return { error: "This team is no longer available. Please contact the Team Leader.", code: "missing-team", invitation };
  const memberIds = getTeamMemberIds(team);
  if (memberIds.length >= 4) return { error: "This team has reached its maximum capacity of four students. Your invitation remains pending.", code: "team-full", invitation, team };
  const newMember = { id: String(student.universityId), universityId: String(student.universityId), name: student.name || "Student", role: "member", joinedAt: now };
  const updatedTeam = {
    ...team,
    memberIds: [...new Set([...(Array.isArray(team.memberIds) ? team.memberIds : []), team.leaderId, student.universityId].filter(Boolean).map(String))],
    members: [...(Array.isArray(team.members) ? team.members.filter((member) => !idEquals(member.universityId || member.id, student.universityId)) : []), newMember],
  };
  return {
    team: updatedTeam,
    teams: teams.map((item) => idEquals(item.id, team.id) ? updatedTeam : item),
    invitations: invitations.map((item) => idEquals(item.id, invitation.id) ? { ...item, status: "accepted", respondedAt: now } : item),
    student: { ...student, role: "student", teamStatus: "member", teamId: team.id },
    invitation,
  };
}

export function prepareMemberLeave({ teams, student }) {
  if (!student?.universityId) return { error: "Please sign in before leaving a team." };
  const team = teams.find((item) => getTeamMemberIds(item).includes(String(student.universityId)));
  if (!team) return { error: "Your team membership has changed. Refresh the page and check your team." };
  if (idEquals(team.leaderId, student.universityId)) return { error: "Team Leaders cannot leave while they are responsible for the team. Transfer leadership first; leadership transfer is not available yet.", code: "team-leader", team };
  const updatedTeam = {
    ...team,
    memberIds: (Array.isArray(team.memberIds) ? team.memberIds : []).filter((id) => !idEquals(id, student.universityId)),
    members: (Array.isArray(team.members) ? team.members : []).filter((member) => !idEquals(member.universityId || member.id, student.universityId)),
  };
  const updatedStudent = { ...student, teamStatus: "no-team", teamId: null };
  return { team, updatedTeam, teams: teams.map((item) => idEquals(item.id, team.id) ? updatedTeam : item), student: updatedStudent };
}

export function prepareInvitationDecline({ invitations, student, invitationId, now = new Date().toISOString() }) {
  if (!student?.universityId) return { error: "Please sign in before responding to an invitation." };
  const invitation = invitations.find((item) => idEquals(item.id, invitationId));
  if (!invitation || invitation.status !== "pending" || !idEquals(invitation.invitedStudentId, student.universityId)) return { error: "This invitation is no longer pending. The list has been refreshed." };
  return {
    invitation,
    invitations: invitations.map((item) => idEquals(item.id, invitation.id) ? { ...item, status: "declined", respondedAt: now } : item),
  };
}
