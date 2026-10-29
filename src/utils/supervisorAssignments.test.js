import test from "node:test";
import assert from "node:assert/strict";
import { authenticateSupervisor, getAllSupervisors, registerSupervisor, SUPERVISORS } from "./supervisorAssignments.js";

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
