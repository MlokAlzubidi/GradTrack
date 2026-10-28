
export const SUPERVISOR_SESSION_KEY = "gradtrack-current-supervisor";

export function getSupervisorSession() {
  try {
    const savedSession = sessionStorage.getItem(
      SUPERVISOR_SESSION_KEY
    );

    if (!savedSession) {
      return null;
    }

    const supervisor = JSON.parse(savedSession);

    return supervisor?.role === "supervisor"
      ? supervisor
      : null;
  } catch {
    return null;
  }
}

export function clearSupervisorSession() {
  try {
    sessionStorage.removeItem(SUPERVISOR_SESSION_KEY);
  } catch {
    // Ignore storage errors in this frontend demo.
  }
}
