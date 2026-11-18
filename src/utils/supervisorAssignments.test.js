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
  TEAMS_STORAGE_KEY,
} from "./supervisorAssignments.js";
import {
  authenticateDemoSupervisor,
  DEMO_SUPERVISOR_SESSION_KEY,
  DEMO_SUPERVISORS,
} from "./demoSupervisors.js";
import {
  getSupervisorSession,
  SUPERVISOR_SESSION_KEY,
} from "./supervisorAuth.js";

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

function withSessionStorage(callback) {
  const originalStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = new MemoryStorage();
  try { callback(); } finally { globalThis.sessionStorage = originalStorage; }
}

test("all five demo supervisors authenticate by Staff ID and reject wrong passwords", () => {
  assert.deepEqual(
    DEMO_SUPERVISORS.map((supervisor) => supervisor.staffId),
    ["00001", "00002", "00003", "00004", "00005"]
  );
  assert.deepEqual(
    DEMO_SUPERVISORS.slice(0, 2).map((supervisor) => supervisor.id),
    ["demo-supervisor", "demo-supervisor-2"]
  );

  for (const account of DEMO_SUPERVISORS) {
    assert.equal(
      authenticateDemoSupervisor(account.staffId, "12345678")?.id,
      account.id
    );
    assert.equal(
      authenticateDemoSupervisor(account.staffId, "incorrect"),
      null
    );
  }

  assert.equal(
    authenticateDemoSupervisor(
      "supervisor@gradtrack.demo",
      "12345678"
    ),
    null
  );
});

test("demo account profiles stay separate from registered supervisor authentication", () => {
  withStorage(() => {
    const demoProfiles = getAllSupervisors().filter(
      (supervisor) => supervisor.isDemo
    );

    assert.equal(demoProfiles.length, 5);
    assert.ok(
      demoProfiles.every(
        (supervisor) => !("password" in supervisor)
      )
    );
    assert.equal(
      authenticateSupervisor("00001", "12345678"),
      null
    );
  });
});

test("demo sessions use a separate key and restore a canonical supervisor identity", () => {
  withSessionStorage(() => {
    const account = DEMO_SUPERVISORS[2];
    sessionStorage.setItem(
      DEMO_SUPERVISOR_SESSION_KEY,
      JSON.stringify({
        id: account.id,
        staffId: "99999",
        name: "Untrusted Name",
        role: "student",
      })
    );

    assert.deepEqual(getSupervisorSession(), {
      id: account.id,
      staffId: account.staffId,
      name: account.name,
      role: "supervisor",
      isDemo: true,
    });
    assert.equal(
      sessionStorage.getItem(SUPERVISOR_SESSION_KEY),
      null
    );
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
    const supervisorA = DEMO_SUPERVISORS[0];
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
    const supervisorA = DEMO_SUPERVISORS[0];
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
    const assignedTeams = DEMO_SUPERVISORS.map(
      (supervisor, index) => ({
        id: `team-${index + 1}`,
        supervisorId: supervisor.id,
        supervisorAssignmentStatus: "accepted",
      })
    );
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify([
      ...assignedTeams,
      {
        id: "team-pending",
        supervisorId: DEMO_SUPERVISORS[0].id,
        requestedSupervisorId: DEMO_SUPERVISORS[0].id,
        supervisorAssignmentStatus: "pending",
      },
    ]));

    DEMO_SUPERVISORS.forEach((supervisor, index) => {
      assert.deepEqual(
        [...getAssignedTeamIds(supervisor.id)],
        [`team-${index + 1}`]
      );
    });
  });
});
