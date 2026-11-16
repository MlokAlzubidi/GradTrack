
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  CalendarClock,
  Pencil,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";
import {
  getSupervisorSession,
  SUPERVISOR_SESSION_KEY,
} from "../../utils/supervisorAuth";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";
import "./SupervisorProfile.css";

function formatDate(value) {
  if (!value) return "Session date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Session date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getApiErrorMessage(error, fallback) {
  const responseData = error.response?.data;
  const validationErrors = responseData?.errors
    ?.map((item) => `${item.field}: ${item.message}`)
    .join(" ");

  return [responseData?.message, validationErrors].filter(Boolean).join(" ") || fallback;
}

function SupervisorProfile() {
  const { user: authUser, setSession } = useAuth();
  const [supervisor, setSupervisor] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileRetry, setProfileRetry] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] =
    useState("success");

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      setIsLoadingProfile(true);
      setProfileError("");

      try {
        const response = await api.get("/users/me");
        const profile = response.data?.user;

        if (!profile?._id || profile.role !== "supervisor") {
          throw new Error("The server returned an invalid supervisor profile.");
        }
        if (!isCurrent) return;

        const activeToken = sessionStorage.getItem("gradtrack-token");
        if (activeToken) setSession(activeToken, profile);

        const currentSession = getSupervisorSession();
        const currentSupervisor = {
          ...currentSession,
          id: profile._id,
          email: profile.email || "",
          staffId: profile.staffId,
          name: profile.fullName,
          role: profile.role,
        };
        setSupervisor(currentSupervisor);
        setEditedName(currentSupervisor.name || "");
        setEditedEmail(currentSupervisor.email);
      } catch (error) {
        if (isCurrent) {
          setProfileError(getApiErrorMessage(
            error,
            error.message || "Could not load your profile. Please try again."
          ));
        }
      } finally {
        if (isCurrent) setIsLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      isCurrent = false;
    };
  }, [profileRetry, setSession]);

  function handleEdit() {
    setEditedName(supervisor?.name || "");
    setEditedEmail(supervisor?.email || "");
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditing(true);
  }

  function handleCancel() {
    setEditedName(supervisor?.name || "");
    setEditedEmail(supervisor?.email || "");
    setErrorMessage("");
    setIsEditing(false);
  }

  // Update supervisor profile through the backend
  async function handleSave(event) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = editedName.trim();

    if (trimmedName.length < 2) {
      setErrorMessage(
        "Please enter a name containing at least 2 characters."
      );
      return;
    }

    if (!supervisor) {
      setErrorMessage(
        "Your supervisor session could not be found. Please sign in again."
      );
      return;
    }

    try {
      setIsSaving(true);

      const response = await api.patch("/users/me", {
        fullName: trimmedName,
        email: editedEmail.trim(),
      });

      const activeToken = sessionStorage.getItem("gradtrack-token");
      if (!setSession(activeToken, response.data.user)) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const updatedSupervisor = {
        ...supervisor,
        email: response.data.user.email || "",
        staffId: response.data.user.staffId,
        name: response.data.user.fullName,
      };

      sessionStorage.setItem(
        SUPERVISOR_SESSION_KEY,
        JSON.stringify(updatedSupervisor)
      );

      setSupervisor(updatedSupervisor);
      setEditedName(updatedSupervisor.name);
      setEditedEmail(updatedSupervisor.email);
      setIsEditing(false);
      setSuccessMessage("Your profile name has been updated.");

      // Update the shared supervisor name in the layout.
      window.dispatchEvent(
        new CustomEvent("gradtrack-supervisor-updated", {
          detail: updatedSupervisor,
        })
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Could not save your profile. Please try again."));
    } finally {
      setIsSaving(false);
    }
  }

  // Change password through the backend
  async function handleChangePassword(event) {
    event.preventDefault();

    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordMessage(
        "New password must be at least 8 characters."
      );
      setPasswordMessageType("error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New passwords do not match.");
      setPasswordMessageType("error");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage(
        "New password must be different from your current password."
      );
      setPasswordMessageType("error");
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await api.patch("/users/me/password", {
        currentPassword,
        newPassword,
      });

      // Keep AuthContext synchronized with the new token issued by the API.
      if (!setSession(response.data.token, authUser)) {
        throw new Error("Your session could not be refreshed. Please sign in again.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setPasswordMessage(
        "Your password has been changed successfully."
      );
      setPasswordMessageType("success");
    } catch (error) {
      setPasswordMessage(getApiErrorMessage(error, "Could not change your password. Please try again."));
      setPasswordMessageType("error");
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoadingProfile && !supervisor) {
    return (
      <div className="supervisor-profile-page">
        <section className="supervisor-profile-empty" role="status" aria-live="polite">
          <h2>Loading your profile…</h2>
        </section>
      </div>
    );
  }

  if (profileError && !supervisor) {
    return (
      <div className="supervisor-profile-page">
        <section className="supervisor-profile-empty" role="alert">
          <h2>Could not load your profile</h2>
          <p>{profileError}</p>
          <button type="button" onClick={() => setProfileRetry((attempt) => attempt + 1)}>
            Try again
          </button>
        </section>
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="supervisor-profile-page">
        <section className="supervisor-profile-empty">
          <UserRound size={32} />
          <h2>Supervisor session not found</h2>
          <p>Please sign in to access your profile.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="supervisor-profile-page">
      <header className="supervisor-profile-header">
        <div>
          <span className="supervisor-profile-eyebrow">
            ACCOUNT SETTINGS
          </span>

          <h2>Supervisor Profile</h2>

          <p>
            View your account information and manage your display name.
          </p>
        </div>

        <div className="supervisor-profile-header-icon">
          <UserRound size={27} strokeWidth={1.7} />
        </div>
      </header>

      {successMessage && (
        <div
          className="supervisor-profile-alert success"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="supervisor-profile-alert error"
          role="alert"
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {profileError && (
        <div className="supervisor-profile-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{profileError}</span>
        </div>
      )}

      <section className="supervisor-profile-card">
        <div className="supervisor-profile-banner">
          <div className="supervisor-profile-avatar">
            <UserRound size={36} />
          </div>

          <div className="supervisor-profile-banner-copy">
            <span>ACADEMIC SUPERVISOR</span>
            <h3>{supervisor.name || "Academic Supervisor"}</h3>
            <p>{supervisor.email}</p>
          </div>

          <span className="supervisor-profile-active-badge">
            <span />
            Active session
          </span>
        </div>

        <div className="supervisor-profile-section-heading">
          <div>
            <h3>Personal Information</h3>
              <p>Update the name and email associated with your account.</p>
          </div>

          {!isEditing && (
            <button
              type="button"
              className="supervisor-profile-edit-button"
              onClick={handleEdit}
            >
              <Pencil size={15} />
              Edit profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form
            className="supervisor-profile-form"
            onSubmit={handleSave}
          >
            <div className="supervisor-profile-field">
              <label htmlFor="supervisorDisplayName">
                Display name
              </label>

              <div className="supervisor-profile-input-wrap">
                <UserRound size={18} />

                <input
                  id="supervisorDisplayName"
                  type="text"
                  value={editedName}
                  onChange={(event) =>
                    setEditedName(event.target.value)
                  }
                  placeholder="Enter your display name"
                  maxLength={80}
                  minLength={2}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="supervisor-profile-field">
              <label htmlFor="supervisorProfileEmail">
                University email
              </label>

              <div className="supervisor-profile-input-wrap read-only">
                <Mail size={18} />

                <input
                  id="supervisorProfileEmail"
                  type="email"
                  value={editedEmail}
                  onChange={(event) => setEditedEmail(event.target.value)}
                  autoComplete="email"
                  maxLength={254}
                />
              </div>
            </div>

            <div className="supervisor-profile-field">
              <label htmlFor="supervisorProfileStaffId">Staff ID</label>
              <div className="supervisor-profile-input-wrap read-only">
                <ShieldCheck size={18} />
                <input id="supervisorProfileStaffId" value={supervisor.staffId || ""} readOnly />
              </div>
            </div>

            <div className="supervisor-profile-form-actions">
              <button
                type="button"
                className="supervisor-profile-cancel-button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="submit"
                className="supervisor-profile-save-button"
                disabled={isSaving}
              >
                <Save size={16} />
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="supervisor-profile-information-grid">
            <article className="supervisor-profile-info-item">
              <div className="supervisor-profile-info-icon">
                <UserRound size={19} />
              </div>

              <div>
                <span>Display name</span>
                <strong>
                  {supervisor.name || "Academic Supervisor"}
                </strong>
              </div>
            </article>

            <article className="supervisor-profile-info-item">
              <div className="supervisor-profile-info-icon">
                <Mail size={19} />
              </div>

              <div>
                <span>University email</span>
                <strong>{supervisor.email || "Not provided"}</strong>
              </div>
            </article>

            <article className="supervisor-profile-info-item">
              <div className="supervisor-profile-info-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <span>Staff ID</span>
                <strong>{supervisor.staffId || "Not provided"}</strong>
              </div>
            </article>

            <article className="supervisor-profile-info-item">
              <div className="supervisor-profile-info-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <span>Account role</span>
                <strong>Academic Supervisor</strong>
              </div>
            </article>

            <article className="supervisor-profile-info-item">
              <div className="supervisor-profile-info-icon">
                <CalendarClock size={19} />
              </div>

              <div>
                <span>Current session started</span>
                <strong>
                  {formatDate(supervisor.loggedInAt)}
                </strong>
              </div>
            </article>
          </div>
        )}

        {/* Change Password */}
        <div className="supervisor-profile-section-heading">
          <div>
            <h3>Change Password</h3>
            <p>Update your password to keep your account secure.</p>
          </div>

          <div className="supervisor-profile-header-icon">
            <LockKeyhole size={21} />
          </div>
        </div>

        {passwordMessage && (
          <div
            className={`supervisor-profile-alert ${passwordMessageType}`}
            role="status"
            aria-live="polite"
          >
            {passwordMessageType === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{passwordMessage}</span>
          </div>
        )}

        <form
          className="supervisor-profile-form"
          onSubmit={handleChangePassword}
        >
          <div className="supervisor-profile-field">
            <label htmlFor="supervisorCurrentPassword">
              Current Password
            </label>

            <div className="supervisor-profile-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="supervisorCurrentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="supervisor-profile-field">
            <label htmlFor="supervisorNewPassword">
              New Password
            </label>

            <div className="supervisor-profile-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="supervisorNewPassword"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <small>Password must contain at least 8 characters.</small>
          </div>

          <div className="supervisor-profile-field">
            <label htmlFor="supervisorConfirmPassword">
              Confirm New Password
            </label>

            <div className="supervisor-profile-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="supervisorConfirmPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(event) =>
                  setConfirmNewPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="supervisor-profile-form-actions">
            <button
              type="submit"
              className="supervisor-profile-save-button"
              disabled={isChangingPassword}
            >
              <LockKeyhole size={16} />
              {isChangingPassword
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default SupervisorProfile;
