
import { useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  CalendarClock,
  Pencil,
  Save,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  getSupervisorSession,
  SUPERVISOR_SESSION_KEY,
} from "../../utils/supervisorAuth";
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

function SupervisorProfile() {
  const [supervisor, setSupervisor] = useState(
    getSupervisorSession
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(
    supervisor?.name || ""
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleEdit() {
    setEditedName(supervisor?.name || "");
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditing(true);
  }

  function handleCancel() {
    setEditedName(supervisor?.name || "");
    setErrorMessage("");
    setIsEditing(false);
  }

  function handleSave(event) {
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
      const updatedSupervisor = {
        ...supervisor,
        name: trimmedName,
      };

      sessionStorage.setItem(
        SUPERVISOR_SESSION_KEY,
        JSON.stringify(updatedSupervisor)
      );

      setSupervisor(updatedSupervisor);
      setEditedName(trimmedName);
      setIsEditing(false);
      setSuccessMessage("Your profile name has been updated.");

      // Update the shared supervisor name in the layout.
      window.dispatchEvent(
        new CustomEvent("gradtrack-supervisor-updated", {
          detail: updatedSupervisor,
        })
      );
    } catch {
      setErrorMessage(
        "Could not save your profile. Please try again."
      );
    }
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
          <span>{errorMessage}</span>
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
            <p>Update the display name associated with your account.</p>
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
                  value={supervisor.email || ""}
                  readOnly
                />
              </div>

              <small>
                The university email cannot be changed here.
              </small>
            </div>

            <div className="supervisor-profile-form-actions">
              <button
                type="button"
                className="supervisor-profile-cancel-button"
                onClick={handleCancel}
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="submit"
                className="supervisor-profile-save-button"
              >
                <Save size={16} />
                Save changes
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
      </section>

    </div>
  );
}

export default SupervisorProfile;
