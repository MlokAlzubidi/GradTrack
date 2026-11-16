
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  Mail,
  Pencil,
  Save,
  X,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Profile.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TOKEN_KEY = "gradtrack-token";
const TEAMS_STORAGE_KEY = "gradtrack-teams";

function readCurrentStudent() {
  try {
    const saved = sessionStorage.getItem(CURRENT_STUDENT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function readLocalArray(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCurrentTeam(student) {
  if (!student?.universityId) return null;

  const teams = readLocalArray(TEAMS_STORAGE_KEY);

  return (
    teams.find((team) => team.id === student.teamId) ||
    teams.find((team) => {
      const memberIds = [
        team.leaderId,
        ...(Array.isArray(team.memberIds) ? team.memberIds : []),
        ...(Array.isArray(team.members)
          ? team.members.map((member) => member.universityId || member.id)
          : []),
      ].filter(Boolean);

      return memberIds.includes(student.universityId);
    }) ||
    null
  );
}

function getApiErrorMessage(error, fallback) {
  const responseData = error.response?.data;
  const validationErrors = responseData?.errors
    ?.map((item) => `${item.field}: ${item.message}`)
    .join(" ");

  return [responseData?.message, validationErrors].filter(Boolean).join(" ") || fallback;
}

function Profile() {
  const { user: authUser, setSession } = useAuth();
  const [student, setStudent] = useState(null);
  const [team, setTeam] = useState(() =>
    getCurrentTeam(readCurrentStudent())
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileRetry, setProfileRetry] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

        if (!profile?._id || profile.role !== "student") {
          throw new Error("The server returned an invalid student profile.");
        }
        if (!isCurrent) return;

        const activeToken = sessionStorage.getItem(TOKEN_KEY);
        if (activeToken) setSession(activeToken, profile);

        const currentStudent = {
          id: profile._id,
          universityId: profile.universityId,
          name: profile.fullName,
          email: profile.email || "",
          role: profile.role,
        };
        setStudent(currentStudent);
        setTeam(getCurrentTeam(currentStudent));
        setEditedName(currentStudent.name || "");
        setEditedEmail(currentStudent.email);
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

  const studentId = student?.universityId || "";
  const isLeader = Boolean(team && team.leaderId === studentId);

  const teamStatus = team
    ? isLeader
      ? "leader"
      : "member"
    : "no-team";

  const studentName = student?.name?.trim() || "Student";

  const initials =
    studentName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "S";

  function startEditing() {
    setEditedName(student?.name || "");
    setEditedEmail(student?.email || "");
    setMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditedName(student?.name || "");
    setEditedEmail(student?.email || "");
    setIsEditing(false);
    setMessage("");
  }

  // Update profile through the backend
  async function handleSave(event) {
    event.preventDefault();
    setMessage("");

    const trimmedName = editedName.trim();

    if (!studentId) {
      setMessage("Please sign in again to update your profile.");
      setMessageType("error");
      return;
    }

    if (trimmedName.length < 2) {
      setMessage("Please enter a name containing at least 2 characters.");
      setMessageType("error");
      return;
    }

    try {
      setIsSavingProfile(true);

      const response = await api.patch("/users/me", {
        fullName: trimmedName,
        email: editedEmail.trim(),
      });

      const activeToken = sessionStorage.getItem(TOKEN_KEY);
      if (!setSession(activeToken, response.data.user)) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const updatedStudent = {
        ...student,
        name: response.data.user.fullName,
        email: response.data.user.email || "",
      };

      // Update the member and leader names in the shared team record.
      const teams = readLocalArray(TEAMS_STORAGE_KEY);

      const updatedTeams = teams.map((item) => {
        const updatedItem = { ...item };

        if (updatedItem.leaderId === studentId) {
          updatedItem.leaderName = trimmedName;
        }

        if (Array.isArray(updatedItem.members)) {
          updatedItem.members = updatedItem.members.map((member) => {
            const memberId = member.universityId || member.id;

            return memberId === studentId
              ? { ...member, name: trimmedName }
              : member;
          });
        }

        return updatedItem;
      });

      localStorage.setItem(
        TEAMS_STORAGE_KEY,
        JSON.stringify(updatedTeams)
      );

      // Update current student session.
      sessionStorage.setItem(
        CURRENT_STUDENT_KEY,
        JSON.stringify(updatedStudent)
      );

      setStudent(updatedStudent);
      setTeam(getCurrentTeam(updatedStudent));
      setEditedName(trimmedName);
      setEditedEmail(updatedStudent.email);
      setIsEditing(false);
      setMessage("Your profile has been updated successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not save your changes. Please try again."));
      setMessageType("error");
    } finally {
      setIsSavingProfile(false);
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

      // Keep the AuthContext token in sync with the token returned by the API.
      if (!setSession(response.data.token, authUser)) {
        throw new Error("Your session could not be refreshed. Please sign in again.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setPasswordMessage("Your password has been changed successfully.");
      setPasswordMessageType("success");
    } catch (error) {
      setPasswordMessage(getApiErrorMessage(error, "Could not change your password. Please try again."));
      setPasswordMessageType("error");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="profile-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="profile-content">
        <header className="profile-header profile-reveal">
          <div>
            <p className="profile-eyebrow">YOUR ACCOUNT</p>
            <h1>My Profile</h1>
            <p>
              Manage your personal information and view your
              GradTrack account details.
            </p>
          </div>

          <div className="profile-header-icon" aria-hidden="true">
            <UserRound size={25} />
          </div>
        </header>

        {isLoadingProfile && !student ? (
          <section className="profile-empty-card profile-reveal" role="status" aria-live="polite">
            <h2>Loading your profile…</h2>
          </section>
        ) : profileError && !student ? (
          <section className="profile-empty-card profile-reveal" role="alert">
            <h2>Could not load your profile</h2>
            <p>{profileError}</p>
            <button
              className="profile-primary-link"
              type="button"
              onClick={() => setProfileRetry((attempt) => attempt + 1)}
            >
              Try again
            </button>
          </section>
        ) : !student ? (
          <section className="profile-empty-card profile-reveal">
            <div className="profile-empty-icon">
              <UserRound size={28} />
            </div>
            <h2>Please sign in first</h2>
            <p>Sign in to view and manage your profile.</p>
            <Link className="profile-primary-link" to="/login">
              Sign in <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          <>
            <section className="profile-hero-card profile-reveal">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">{initials}</div>
                <span
                  className="profile-avatar-status"
                  title="Active account"
                />
              </div>

              <div className="profile-hero-info">
                <span className="profile-small-label">
                  STUDENT ACCOUNT
                </span>
                <h2>{studentName}</h2>
                <p>University ID: {studentId}</p>

                <div className="profile-hero-tags">
                  <span className="profile-role-badge">
                    <GraduationCap size={15} />
                    Student
                  </span>

                  <span className={`profile-role-badge ${teamStatus}`}>
                    <Users size={15} />
                    {!team
                      ? "No Team Yet"
                      : isLeader
                        ? "Team Leader"
                        : "Team Member"}
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  className="profile-edit-button"
                  type="button"
                  onClick={startEditing}
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>
              )}
            </section>

            {message && (
              <div
                className={`profile-feedback ${messageType}`}
                role="status"
                aria-live="polite"
              >
                {messageType === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{message}</span>
              </div>
            )}

            {profileError && (
              <div className="profile-feedback error" role="alert">
                <AlertCircle size={18} />
                <span>{profileError}</span>
              </div>
            )}

            {/* Personal Information */}
            <section className="profile-section profile-reveal">
              <div className="profile-section-heading">
                <div>
                  <span className="profile-section-kicker">
                    PERSONAL DETAILS
                  </span>
                  <h2>Personal Information</h2>
                  <p>
                    Keep your displayed name up to date.
                  </p>
                </div>

                <div className="profile-section-icon">
                  <UserRound size={21} />
                </div>
              </div>

              {isEditing ? (
                <form
                  className="profile-edit-form"
                  onSubmit={handleSave}
                >
                  <div className="profile-field">
                    <label htmlFor="profileName">Full Name</label>
                    <input
                      id="profileName"
                      name="profileName"
                      type="text"
                      value={editedName}
                      onChange={(event) =>
                        setEditedName(event.target.value)
                      }
                      autoComplete="name"
                      maxLength={100}
                      minLength={2}
                      required
                    />
                    <span className="profile-field-hint">
                      This name will be displayed across your team.
                    </span>
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profileUniversityId">
                      University ID
                    </label>
                    <input
                      id="profileUniversityId"
                      value={studentId}
                      readOnly
                    />
                    <span className="profile-field-hint">
                      University IDs cannot be changed here.
                    </span>
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profileEmail">Email</label>
                    <input
                      id="profileEmail"
                      name="profileEmail"
                      type="email"
                      value={editedEmail}
                      onChange={(event) => setEditedEmail(event.target.value)}
                      autoComplete="email"
                      maxLength={254}
                    />
                  </div>

                  <div className="profile-form-actions">
                    <button
                      className="profile-save-button"
                      type="submit"
                      disabled={isSavingProfile}
                    >
                      <Save size={16} />
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      className="profile-cancel-button"
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSavingProfile}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-info-grid">
                  <article className="profile-info-card">
                    <span className="profile-info-icon">
                      <UserRound size={18} />
                    </span>
                    <div>
                      <span className="profile-info-label">
                        Full Name
                      </span>
                      <strong>{studentName}</strong>
                    </div>
                  </article>

                  <article className="profile-info-card">
                    <span className="profile-info-icon">
                      <ShieldCheck size={18} />
                    </span>
                    <div>
                      <span className="profile-info-label">
                        University ID
                      </span>
                      <strong>{studentId}</strong>
                    </div>
                  </article>

                  <article className="profile-info-card">
                    <span className="profile-info-icon">
                      <Mail size={18} />
                    </span>
                    <div>
                      <span className="profile-info-label">Email</span>
                      <strong>{student.email || "Not provided"}</strong>
                    </div>
                  </article>

                  <article className="profile-info-card">
                    <span className="profile-info-icon">
                      <GraduationCap size={18} />
                    </span>
                    <div>
                      <span className="profile-info-label">
                        Account Type
                      </span>
                      <strong>Student</strong>
                    </div>
                  </article>

                  <article className="profile-info-card">
                    <span className="profile-info-icon">
                      <Users size={18} />
                    </span>
                    <div>
                      <span className="profile-info-label">
                        Team Position
                      </span>
                      <strong>
                        {!team
                          ? "Not in a team"
                          : isLeader
                            ? "Team Leader"
                            : "Team Member"}
                      </strong>
                    </div>
                  </article>
                </div>
              )}
            </section>

            {/* Change Password */}
            <section className="profile-section profile-reveal">
              <div className="profile-section-heading">
                <div>
                  <span className="profile-section-kicker">
                    ACCOUNT SECURITY
                  </span>
                  <h2>Change Password</h2>
                  <p>
                    Update your password to keep your account secure.
                  </p>
                </div>

                <div className="profile-section-icon">
                  <LockKeyhole size={21} />
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`profile-feedback ${passwordMessageType}`}
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
                className="profile-edit-form"
                onSubmit={handleChangePassword}
              >
                <div className="profile-field">
                  <label htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <span className="profile-field-hint">
                    Password must contain at least 8 characters.
                  </span>
                </div>

                <div className="profile-field">
                  <label htmlFor="confirmNewPassword">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
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

                <div className="profile-form-actions">
                  <button
                    className="profile-save-button"
                    type="submit"
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

            {/* Team Information */}
            <section className="profile-section profile-reveal">
              <div className="profile-section-heading">
                <div>
                  <span className="profile-section-kicker">
                    PROJECT WORKSPACE
                  </span>
                  <h2>Team Information</h2>
                  <p>
                    Your current graduation project team.
                  </p>
                </div>

                <div className="profile-section-icon">
                  <Users size={21} />
                </div>
              </div>

              {team ? (
                <div className="profile-team-card">
                  <div className="profile-team-icon">
                    <GraduationCap size={25} />
                  </div>

                  <div className="profile-team-info">
                    <span className="profile-info-label">
                      TEAM NAME
                    </span>
                    <h3>{team.name}</h3>
                    <p>
                      Team Leader: {team.leaderName || "Not available"}
                    </p>
                  </div>

                  <Link
                    className="profile-secondary-link"
                    to="/student/team"
                  >
                    View Team <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="profile-no-team">
                  <div className="profile-no-team-icon">
                    <Users size={22} />
                  </div>
                  <div>
                    <h3>You haven't joined a team yet</h3>
                    <p>
                      Create a team or accept an invitation to start
                      working on your graduation project.
                    </p>
                  </div>
                  <div className="profile-team-actions">
                    <Link
                      className="profile-primary-link"
                      to="/student/create-team"
                    >
                      Create Team
                    </Link>
                    <Link
                      className="profile-secondary-link"
                      to="/student/invitations"
                    >
                      View Invitations
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;
