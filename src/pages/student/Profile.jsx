import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  Pencil,
  Save,
  X,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./Profile.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const REGISTERED_STUDENTS_KEY = "gradtrack-registered-students";
const PROFILE_OVERRIDES_KEY = "gradtrack-student-profile-overrides";

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

function readLocalObject(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
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

function Profile() {
  const [student, setStudent] = useState(readCurrentStudent);
  const [team, setTeam] = useState(() =>
    getCurrentTeam(readCurrentStudent())
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(
    () => readCurrentStudent()?.name || ""
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

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
    setMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditedName(student?.name || "");
    setIsEditing(false);
    setMessage("");
  }

  function handleSave(event) {
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
      const updatedStudent = {
        ...student,
        name: trimmedName,
      };

      // Save the profile override so mock accounts retain edited names.
      const profileOverrides = readLocalObject(PROFILE_OVERRIDES_KEY);

      localStorage.setItem(
        PROFILE_OVERRIDES_KEY,
        JSON.stringify({
          ...profileOverrides,
          [studentId]: {
            ...(profileOverrides[studentId] || {}),
            name: trimmedName,
            updatedAt: new Date().toISOString(),
          },
        })
      );

      // Keep registered student data consistent when this is a registered account.
      const registeredStudents = readLocalArray(
        REGISTERED_STUDENTS_KEY
      );

      const updatedRegisteredStudents = registeredStudents.map(
        (item) =>
          item.universityId === studentId
            ? { ...item, name: trimmedName }
            : item
      );

      localStorage.setItem(
        REGISTERED_STUDENTS_KEY,
        JSON.stringify(updatedRegisteredStudents)
      );

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

      // The current session is tab-specific.
      sessionStorage.setItem(
        CURRENT_STUDENT_KEY,
        JSON.stringify(updatedStudent)
      );

      setStudent(updatedStudent);
      setTeam(getCurrentTeam(updatedStudent));
      setEditedName(trimmedName);
      setIsEditing(false);
      setMessage("Your profile has been updated successfully.");
      setMessageType("success");
    } catch {
      setMessage(
        "Could not save your changes. Please try again."
      );
      setMessageType("error");
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

        {!student ? (
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

                  <div className="profile-form-actions">
                    <button className="profile-save-button" type="submit">
                      <Save size={16} />
                      Save Changes
                    </button>

                    <button
                      className="profile-cancel-button"
                      type="button"
                      onClick={cancelEditing}
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

            <p className="profile-note">
              Your account session is kept separate per tab.
              Team information is shared with your team in this browser.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;