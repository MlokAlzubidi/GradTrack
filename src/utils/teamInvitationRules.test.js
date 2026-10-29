import test from "node:test";
import assert from "node:assert/strict";
import { getTeamMemberIds, prepareInvitation, prepareInvitationAcceptance, prepareInvitationDecline, prepareMemberLeave } from "./teamInvitationRules.js";

const student = { universityId: "s1", name: "Student One", role: "student", teamStatus: "member", teamId: "old" };
const oldTeam = { id: "old", name: "Old Team", leaderId: "leader-old", memberIds: ["leader-old", "s1"], members: [{ universityId: "leader-old" }, { universityId: "s1" }] };
const teamA = { id: "A", name: "Team A", leaderId: "leader-A", memberIds: ["leader-A"], members: [{ universityId: "leader-A" }] };
const teamB = { id: "B", name: "Team B", leaderId: "leader-B", memberIds: ["leader-B"], members: [{ universityId: "leader-B" }] };
const invitedStudent = { universityId: "s1", name: "Student One" };

function invite(team, invitations = [], additionalTeams = []) {
  return prepareInvitation({ team, student: { universityId: team.leaderId, name: team.leaderName || team.leaderId }, invitedStudent, teams: [...additionalTeams, team], invitations, now: "2026-10-29T12:00:00.000Z" });
}

test("leaders can invite students who belong to a different team", () => {
  const result = invite(teamA, [], [oldTeam]);
  assert.ok(result.invitation);
  assert.ok(getTeamMemberIds(oldTeam).includes("s1"));
});

test("one student can receive pending invitations from multiple teams", () => {
  const a = invite(teamA).invitation;
  const b = invite(teamB, [a]).invitation;
  assert.equal(a.status, "pending");
  assert.equal(b.status, "pending");
  assert.notEqual(a.teamId, b.teamId);
});

test("duplicate pending invitations from the same team are blocked", () => {
  const first = invite(teamA).invitation;
  const duplicate = invite(teamA, [first]);
  assert.match(duplicate.error, /already been sent/);
});

test("acceptance is blocked while the student belongs to any team", () => {
  const invitation = invite(teamA).invitation;
  const result = prepareInvitationAcceptance({ teams: [oldTeam, teamA], invitations: [invitation], student, invitationId: invitation.id });
  assert.equal(result.code, "already-member");
});

test("a regular member can leave and then accept while other invitations stay pending", () => {
  const a = invite(teamA).invitation;
  const b = invite(teamB, [a]).invitation;
  const leave = prepareMemberLeave({ teams: [oldTeam, teamA, teamB], student });
  const acceptance = prepareInvitationAcceptance({ teams: leave.teams, invitations: [a, b], student: leave.student, invitationId: a.id });
  assert.ok(acceptance.teams.find((team) => team.id === "old").memberIds.every((id) => id !== "s1"));
  assert.ok(acceptance.teams.find((team) => team.id === "A").memberIds.includes("s1"));
  assert.equal(getTeamMemberIds(acceptance.teams.find((team) => team.id === "A")).filter((id) => id === "s1").length, 1);
  assert.equal(acceptance.teams.filter((team) => getTeamMemberIds(team).includes("s1")).length, 1);
  assert.equal(acceptance.invitations.find((item) => item.id === b.id).status, "pending");
  assert.equal(acceptance.invitations.find((item) => item.id === a.id).status, "accepted");
  assert.equal(acceptance.student.teamId, "A");
  assert.equal(acceptance.student.teamStatus, "member");
});

test("the four-student capacity includes the Team Leader", () => {
  const full = { ...teamA, memberIds: ["leader-A", "s2", "s3", "s4"] };
  const invitation = { id: "full", teamId: "A", invitedStudentId: "s1", status: "pending" };
  const result = prepareInvitationAcceptance({ teams: [full], invitations: [invitation], student: { ...student, teamId: null, teamStatus: "no-team" }, invitationId: "full" });
  assert.equal(result.code, "team-full");
  assert.equal(invitation.status, "pending");
});

test("a Team Leader cannot leave a team", () => {
  const result = prepareMemberLeave({ teams: [teamA], student: { universityId: "leader-A", teamId: "A", teamStatus: "leader" } });
  assert.equal(result.code, "team-leader");
});

test("declining works while the student is in another team and preserves other invitations", () => {
  const a = invite(teamA).invitation;
  const b = invite(teamB, [a]).invitation;
  const result = prepareInvitationDecline({ invitations: [a, b], student, invitationId: a.id, now: "2026-10-29T13:00:00.000Z" });
  assert.equal(result.invitations.find((item) => item.id === a.id).status, "declined");
  assert.equal(result.invitations.find((item) => item.id === b.id).status, "pending");
});

test("accepting an already-responded invitation cannot add a second membership", () => {
  const invitation = { id: "already-accepted", teamId: "A", invitedStudentId: "s1", status: "accepted" };
  const result = prepareInvitationAcceptance({ teams: [teamA], invitations: [invitation], student: { ...student, teamId: null, teamStatus: "no-team" }, invitationId: invitation.id });
  assert.match(result.error, /no longer pending/);
  assert.equal(getTeamMemberIds(teamA).includes("s1"), false);
});
