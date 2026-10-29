import { addNotification } from "./notifications.js";

export const SUPERVISORS = [{
  id: "demo-supervisor",
  email: "supervisor@gradtrack.demo",
  password: "Supervisor123!",
  name: "Academic Supervisor",
  role: "supervisor",
}, {
  id: "demo-supervisor-2",
  email: "supervisor2@gradtrack.demo",
  password: "Supervisor123!",
  name: "Dr. Samira Hassan",
  department: "Computer Science",
  role: "supervisor",
}];

const REGISTERED_SUPERVISORS_KEY = "gradtrack-registered-supervisors";

export function getAllSupervisors() {
  try {
    const saved = JSON.parse(localStorage.getItem(REGISTERED_SUPERVISORS_KEY) || "[]");
    return [...SUPERVISORS, ...(Array.isArray(saved) ? saved : [])];
  } catch {
    return [...SUPERVISORS];
  }
}

export function authenticateSupervisor(identifier, password) {
  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
  return getAllSupervisors().find((supervisor) =>
    (String(supervisor.email || "").toLowerCase() === normalizedIdentifier ||
      String(supervisor.staffId || "").toLowerCase() === normalizedIdentifier) &&
    supervisor.password === password
  ) || null;
}

export function registerSupervisor({ name, email, staffId = "", password }) {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedStaffId = String(staffId || "").trim();
  if (!normalizedName || !normalizedEmail || !password) {
    return { success: false, message: "Please complete all required fields." };
  }

  const supervisors = getAllSupervisors();
  if (supervisors.some((item) => String(item.email || "").toLowerCase() === normalizedEmail)) {
    return { success: false, message: "An account already uses this university email." };
  }
  if (normalizedStaffId && supervisors.some((item) => String(item.staffId || "").toLowerCase() === normalizedStaffId.toLowerCase())) {
    return { success: false, message: "An account already uses this staff ID." };
  }

  const account = {
    id: `supervisor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizedName,
    email: normalizedEmail,
    ...(normalizedStaffId ? { staffId: normalizedStaffId } : {}),
    password,
    role: "supervisor",
  };

  try {
    const existing = JSON.parse(localStorage.getItem(REGISTERED_SUPERVISORS_KEY) || "[]");
    if (!Array.isArray(existing)) throw new Error("Invalid supervisor account data.");
    localStorage.setItem(REGISTERED_SUPERVISORS_KEY, JSON.stringify([...existing, account]));
    return { success: true, supervisor: account };
  } catch {
    return { success: false, message: "Could not save your account. Please try again." };
  }
}

export const ASSIGNMENT_REQUESTS_KEY = "gradtrack-supervisor-assignment-requests";
const TEAMS_KEY = "gradtrack-teams";
const PROJECTS_KEY = "gradtrack-projects";

export const sameId = (a, b) => a != null && b != null && String(a) === String(b);

export function readStorageArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function getAssignedTeamIds(supervisorId) {
  return new Set(readStorageArray(TEAMS_KEY)
    .filter((team) => team.supervisorAssignmentStatus === "accepted" && sameId(team.supervisorId, supervisorId))
    .map((team) => String(team.id)));
}

export function teamIsAssigned(team, supervisorId) {
  return team?.supervisorAssignmentStatus === "accepted" && sameId(team.supervisorId, supervisorId);
}

export function createAssignmentRequest({ team, project, supervisorId, leader }) {
  const teams = readStorageArray(TEAMS_KEY);
  const existingTeam = teams.find((item) => sameId(item.id, team.id));
  if (!existingTeam || !supervisorId) return { error: "Team or supervisor information is missing." };
  if (teamIsAssigned(existingTeam, supervisorId)) return { error: "This supervisor is already assigned to your team." };
  const requests = readStorageArray(ASSIGNMENT_REQUESTS_KEY);
  const pendingRequest = requests.find((request) => sameId(request.teamId, team.id) && request.status === "pending");
  if (pendingRequest) return sameId(pendingRequest.supervisorId, supervisorId) ? { request: pendingRequest } : { error: "Your team already has a pending supervisor request." };
  if (existingTeam.supervisorAssignmentStatus === "accepted") return { error: "Your team already has an assigned supervisor." };
  const request = { id: `assignment-${team.id}-${Date.now()}`, teamId: team.id, teamName: team.name, leaderId: leader.universityId, leaderName: leader.name, projectId: project.id, projectTitle: project.title, supervisorId: String(supervisorId), status: "pending", createdAt: new Date().toISOString() };
  const updatedTeams = teams.map((item) => sameId(item.id, team.id) ? { ...item, requestedSupervisorId: String(supervisorId), supervisorAssignmentStatus: "pending" } : item);
  const projects = readStorageArray(PROJECTS_KEY).map((item) => sameId(item.teamId, team.id) ? { ...item, requestedSupervisorId: String(supervisorId), supervisorAssignmentStatus: "pending" } : item);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams));
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  localStorage.setItem(ASSIGNMENT_REQUESTS_KEY, JSON.stringify([...requests, request]));
  addNotification({ id: `${request.id}-supervisor`, recipientId: supervisorId, type: "assignment", title: "New team assignment request", message: `${team.name} requested you as its supervisor.`, link: "/supervisor/assignments", relatedId: request.id });
  return { request };
}

export function decideAssignment(requestId, supervisorId, decision) {
  const requests = readStorageArray(ASSIGNMENT_REQUESTS_KEY);
  const request = requests.find((item) => sameId(item.id, requestId));
  if (!request || request.status !== "pending" || !sameId(request.supervisorId, supervisorId)) return { error: "This request is unavailable." };
  const status = decision === "accepted" ? "accepted" : "rejected";
  const teams = readStorageArray(TEAMS_KEY);
  if (!teams.some((team) => sameId(team.id, request.teamId))) return { error: "The requesting team could not be found." };
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams.map((team) => sameId(team.id, request.teamId) ? { ...team, supervisorId: status === "accepted" ? String(supervisorId) : null, requestedSupervisorId: null, supervisorAssignmentStatus: status } : team)));
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(readStorageArray(PROJECTS_KEY).map((project) => sameId(project.teamId, request.teamId) ? { ...project, supervisorId: status === "accepted" ? String(supervisorId) : null, requestedSupervisorId: null, supervisorAssignmentStatus: status } : project)));
  localStorage.setItem(ASSIGNMENT_REQUESTS_KEY, JSON.stringify(requests.map((item) => sameId(item.id, requestId) ? { ...item, status, decidedAt: new Date().toISOString() } : item)));
  const assignedSupervisor = getAllSupervisors().find((item) => sameId(item.id, supervisorId));
  addNotification({ id: `${request.id}-${status}`, recipientId: request.leaderId, type: "assignment", title: status === "accepted" ? "Supervisor request accepted" : "Supervisor request declined", message: status === "accepted" ? `${assignedSupervisor?.name || "Your requested supervisor"} accepted your team assignment.` : "Your supervisor request was declined. You can select another supervisor and send a new request.", link: "/student/project-registration", relatedId: request.id });
  return { request, status };
}

export function filterAssignedProjects(projects, supervisorId) {
  const ids = getAssignedTeamIds(supervisorId);
  return projects.filter((project) => ids.has(String(project.teamId)));
}
