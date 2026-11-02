import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSIGNMENT_REQUESTS_KEY,
  authenticateSupervisor,
  decideAssignment,
  getAllSupervisors,
  getAssignedTeamIds,
  notifyAssignedSupervisorOfProposal,
  PROPOSALS_STORAGE_KEY,
  registerSupervisor,
  SUPERVISORS,
  TEAMS_STORAGE_KEY,
} from "./supervisorAssignments.js";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function withStorage(callback) {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = new MemoryStorage();
  try { callback(); } finally { globalThis.localStorage = originalStorage; }
}

test("existing demo supervisors still authenticate", () => {
  withStorage(() => {
    for (const account of SUPERVISORS) {
      assert.equal(authenticateSupervisor(account.email, account.password)?.id, account.id);
    }
  });
});

test("registered supervisors authenticate and appear in supervisor data", () => {
  withStorage(() => {
    const result = registerSupervisor({ name: "New Supervisor", email: "NEW@university.edu", staffId: "ST-204", password: "secure-pass" });
    assert.equal(result.success, true);
    assert.equal(result.supervisor.role, "supervisor");
    assert.equal(authenticateSupervisor("new@university.edu", "secure-pass")?.id, result.supervisor.id);
    assert.equal(authenticateSupervisor("st-204", "secure-pass")?.id, result.supervisor.id);
    assert.ok(getAllSupervisors().some((item) => item.id === result.supervisor.id));
  });
});

test("duplicate email and staff IDs are rejected", () => {
  withStorage(() => {
    assert.equal(registerSupervisor({ name: "One", email: "one@university.edu", staffId: "STAFF-1", password: "pass" }).success, true);
    const duplicateEmail = registerSupervisor({ name: "Two", email: "ONE@university.edu", staffId: "STAFF-2", password: "pass" });
    const duplicateStaffId = registerSupervisor({ name: "Three", email: "three@university.edu", staffId: "staff-1", password: "pass" });
    assert.match(duplicateEmail.message, /email/);
    assert.match(duplicateStaffId.message, /staff ID/);
  });
});

test("proposal notifications go only to the team's accepted supervisor", () => {
  withStorage(() => {
    const supervisorA = SUPERVISORS[0];
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify([{
      id: "team-A",
      name: "Team A",
      supervisorId: supervisorA.id,
      supervisorAssignmentStatus: "accepted",
    }]));
    const proposal = {
      id: "proposal-team-A",
      teamId: "team-A",
      projectTitle: "Project A",
      submittedByName: "Leader A",
      revisionNumber: 1,
    };

    assert.deepEqual(notifyAssignedSupervisorOfProposal(proposal), {
      notified: true,
      assignmentPending: false,
    });
    assert.deepEqual(notifyAssignedSupervisorOfProposal(proposal), {
      notified: true,
      assignmentPending: false,
    });

    const notifications = JSON.parse(localStorage.getItem("gradtrack-notifications"));
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].recipientId, supervisorA.id);
    assert.equal(notifications[0].type, "proposal");
    assert.equal(notifications[0].link, "/supervisor/proposals/proposal-team-A");
    assert.equal(notifications[0].relatedId, proposal.id);
  });
});

test("pending proposals stay saved and notify the supervisor after assignment acceptance", () => {
  withStorage(() => {
    const supervisorA = SUPERVISORS[0];
    const proposal = {
      id: "proposal-team-A",
      teamId: "team-A",
      projectTitle: "Project A",
      submittedByName: "Leader A",
      status: "Pending Review",
      revisionNumber: 2,
    };
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify([{
      id: "team-A",
      name: "Team A",
      leaderId: "leader-A",
      supervisorId: null,
      requestedSupervisorId: supervisorA.id,
      supervisorAssignmentStatus: "pending",
    }]));
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify([proposal]));
    localStorage.setItem(ASSIGNMENT_REQUESTS_KEY, JSON.stringify([{
      id: "request-A",
      teamId: "team-A",
      leaderId: "leader-A",
      supervisorId: supervisorA.id,
      status: "pending",
    }]));

    assert.deepEqual(notifyAssignedSupervisorOfProposal(proposal), {
      notified: false,
      assignmentPending: true,
    });
    assert.equal(localStorage.getItem("gradtrack-notifications"), null);
    assert.deepEqual([...getAssignedTeamIds(supervisorA.id)], []);

    const result = decideAssignment("request-A", supervisorA.id, "accepted");
    assert.equal(result.status, "accepted");
    assert.deepEqual([...getAssignedTeamIds(supervisorA.id)], ["team-A"]);
    assert.deepEqual(JSON.parse(localStorage.getItem(PROPOSALS_STORAGE_KEY)), [proposal]);

    const notifications = JSON.parse(localStorage.getItem("gradtrack-notifications"));
    const proposalNotifications = notifications.filter((item) => item.type === "proposal");
    assert.equal(proposalNotifications.length, 1);
    assert.equal(proposalNotifications[0].recipientId, supervisorA.id);
    assert.equal(proposalNotifications[0].title, "Proposal Resubmitted");
  });
});

test("accepted assignment filtering isolates each supervisor and excludes pending requests", () => {
  withStorage(() => {
    const [supervisorA, supervisorB] = SUPERVISORS;
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify([
      { id: "team-A", supervisorId: supervisorA.id, supervisorAssignmentStatus: "accepted" },
      { id: "team-B", supervisorId: supervisorB.id, supervisorAssignmentStatus: "accepted" },
      { id: "team-pending", supervisorId: null, requestedSupervisorId: supervisorA.id, supervisorAssignmentStatus: "pending" },
    ]));

    assert.deepEqual([...getAssignedTeamIds(supervisorA.id)], ["team-A"]);
    assert.deepEqual([...getAssignedTeamIds(supervisorB.id)], ["team-B"]);
  });
});
