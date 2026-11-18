import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import {
  DEMO_SUPERVISOR_SESSION_KEY,
  getDemoSupervisorById,
  getDemoSupervisorSession,
  toDemoSupervisorProfile,
} from "../utils/demoSupervisors.js";

export const TOKEN_KEY = "gradtrack-token";
export const STUDENT_SESSION_KEY = "gradtrack-current-student";
export const SUPERVISOR_SESSION_KEY = "gradtrack-current-supervisor";
const AuthContext = createContext(null);
let profileRequest = null;
let profileRequestToken = null;

function clearStoredSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(STUDENT_SESSION_KEY);
  sessionStorage.removeItem(SUPERVISOR_SESSION_KEY);
  sessionStorage.removeItem(DEMO_SUPERVISOR_SESSION_KEY);
}

function syncRoleSession(user) {
  if (!user?._id || !["student", "supervisor"].includes(user.role)) {
    clearStoredSession();
    return;
  }

  sessionStorage.removeItem(DEMO_SUPERVISOR_SESSION_KEY);

  if (user.role === "student") {
    sessionStorage.removeItem(SUPERVISOR_SESSION_KEY);
    sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify({
      id: user._id,
      universityId: user.universityId,
      name: user.fullName,
      role: user.role,
    }));
  } else {
    sessionStorage.removeItem(STUDENT_SESSION_KEY);
    let previous = null;
    try {
      previous = JSON.parse(sessionStorage.getItem(SUPERVISOR_SESSION_KEY) || "null");
    } catch {
      // Replace malformed legacy session data with the verified profile.
    }
    sessionStorage.setItem(SUPERVISOR_SESSION_KEY, JSON.stringify({
      id: user._id,
      email: user.email,
      staffId: user.staffId,
      name: user.fullName,
      role: user.role,
      loggedInAt: previous?.id === user._id ? previous.loggedInAt : new Date().toISOString(),
    }));
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [demoUser, setDemoUser] = useState(() =>
    sessionStorage.getItem(TOKEN_KEY)
      ? null
      : getDemoSupervisorSession()
  );
  const [isLoading, setIsLoading] = useState(Boolean(sessionStorage.getItem(TOKEN_KEY)));
  const [authCheckError, setAuthCheckError] = useState(null);
  const requestGeneration = useRef(0);

  const endSession = useCallback(() => {
    requestGeneration.current += 1;
    clearStoredSession();
    setToken(null);
    setUser(null);
    setDemoUser(null);
    setIsLoading(false);
    setAuthCheckError(null);
  }, []);

  const setSession = useCallback((newToken, newUser) => {
    if (!newToken || !newUser?._id || !["student", "supervisor"].includes(newUser.role)) {
      endSession();
      return false;
    }
    sessionStorage.setItem(TOKEN_KEY, newToken);
    requestGeneration.current += 1;
    syncRoleSession(newUser);
    setToken(newToken);
    setUser(newUser);
    setDemoUser(null);
    setIsLoading(false);
    setAuthCheckError(null);
    return true;
  }, [endSession]);

  const startDemoSession = useCallback((demoSupervisor) => {
    const verifiedSupervisor = getDemoSupervisorById(
      demoSupervisor?.id
    );
    if (!verifiedSupervisor) return false;

    const demoProfile = toDemoSupervisorProfile(verifiedSupervisor);
    requestGeneration.current += 1;
    clearStoredSession();
    sessionStorage.setItem(
      DEMO_SUPERVISOR_SESSION_KEY,
      JSON.stringify(demoProfile)
    );
    setToken(null);
    setUser(null);
    setDemoUser(demoProfile);
    setIsLoading(false);
    setAuthCheckError(null);
    return true;
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = sessionStorage.getItem(TOKEN_KEY);
    if (!activeToken) {
      if (demoUser) return demoUser;
      endSession();
      return null;
    }
    if (profileRequest && profileRequestToken === activeToken) return profileRequest;
    const generation = ++requestGeneration.current;
    setIsLoading(true);
    setAuthCheckError(null);
    profileRequestToken = activeToken;
    profileRequest = (async () => {
      try {
        const response = await api.get("/users/me");
        if (requestGeneration.current !== generation || sessionStorage.getItem(TOKEN_KEY) !== activeToken) return null;
        const currentUser = response.data?.user;
        if (!currentUser?._id || !["student", "supervisor"].includes(currentUser.role)) {
          endSession();
          return null;
        }
        syncRoleSession(currentUser);
        setToken(activeToken);
        setUser(currentUser);
        setDemoUser(null);
        return currentUser;
      } catch (error) {
        if (requestGeneration.current === generation && sessionStorage.getItem(TOKEN_KEY) === activeToken) {
          if (error.response?.status === 401) {
            endSession();
          } else {
            setUser(null);
            setAuthCheckError(error.response?.status >= 500 || !error.response
              ? "We couldn't verify your session because the server is unavailable. Please try again."
              : "We couldn't verify your session. Please try again.");
          }
        }
        return null;
      } finally {
        if (profileRequestToken === activeToken) {
          profileRequest = null;
          profileRequestToken = null;
        }
        if (requestGeneration.current === generation) setIsLoading(false);
      }
    })();
    return profileRequest;
  }, [demoUser, endSession]);

  useEffect(() => {
    if (token) refreshUser();
    else if (!demoUser) endSession();
  // Bootstrap once; login updates state through setSession.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleInvalidSession = () => endSession();
    window.addEventListener("gradtrack-session-invalid", handleInvalidSession);
    return () => window.removeEventListener("gradtrack-session-invalid", handleInvalidSession);
  }, [endSession]);

  const logout = useCallback(async () => {
    try {
      if (sessionStorage.getItem(TOKEN_KEY)) await api.post("/auth/logout");
    } catch {
      // Local logout must still complete when the server cannot be reached.
    } finally {
      endSession();
    }
  }, [endSession]);

  const currentUser = user || demoUser;
  const value = useMemo(() => ({
    user: currentUser,
    token,
    isAuthenticated: Boolean((user && token) || demoUser),
    isLoading,
    authCheckError,
    logout,
    refreshUser,
    setSession,
    startDemoSession,
  }), [currentUser, user, token, demoUser, isLoading, authCheckError, logout, refreshUser, setSession, startDemoSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
