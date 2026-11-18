export const DEMO_SUPERVISOR_SESSION_KEY =
  "gradtrack-demo-supervisor-session";

export const DEMO_SUPERVISORS = [
  {
    id: "demo-supervisor",
    staffId: "00001",
    password: "12345678",
    name: "Academic Supervisor",
    role: "supervisor",
    isDemo: true,
  },
  {
    id: "demo-supervisor-2",
    staffId: "00002",
    password: "12345678",
    name: "Dr. Samira Hassan",
    department: "Computer Science",
    role: "supervisor",
    isDemo: true,
  },
  {
    id: "demo-supervisor-3",
    staffId: "00003",
    password: "12345678",
    name: "Demo Supervisor 3",
    role: "supervisor",
    isDemo: true,
  },
  {
    id: "demo-supervisor-4",
    staffId: "00004",
    password: "12345678",
    name: "Demo Supervisor 4",
    role: "supervisor",
    isDemo: true,
  },
  {
    id: "demo-supervisor-5",
    staffId: "00005",
    password: "12345678",
    name: "Demo Supervisor 5",
    role: "supervisor",
    isDemo: true,
  },
];

export function getDemoSupervisorByStaffId(staffId) {
  const normalizedStaffId = String(staffId || "").trim();

  return DEMO_SUPERVISORS.find(
    (supervisor) => supervisor.staffId === normalizedStaffId
  ) || null;
}

export function getDemoSupervisorById(id) {
  if (id == null) return null;

  return DEMO_SUPERVISORS.find(
    (supervisor) => supervisor.id === String(id)
  ) || null;
}

export function authenticateDemoSupervisor(staffId, password) {
  const supervisor = getDemoSupervisorByStaffId(staffId);

  return supervisor?.password === password ? supervisor : null;
}

export function toDemoSupervisorProfile(supervisor) {
  if (!supervisor) return null;

  return {
    id: supervisor.id,
    staffId: supervisor.staffId,
    name: supervisor.name,
    role: "supervisor",
    isDemo: true,
  };
}

export function getDemoSupervisorSession() {
  try {
    const saved = sessionStorage.getItem(
      DEMO_SUPERVISOR_SESSION_KEY
    );
    if (!saved) return null;

    const session = JSON.parse(saved);
    const supervisor = getDemoSupervisorById(session?.id);

    return toDemoSupervisorProfile(supervisor);
  } catch {
    return null;
  }
}
