import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  FolderKanban,
  UsersRound,
  CalendarDays,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./SubmitProposal.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const PROJECTS_STORAGE_KEY = "gradtrack-projects";
const PROPOSALS_STORAGE_KEY = "gradtrack-proposals";

const MAX_FILE_SIZE = 500 * 1024;

// قراءة الحساب الحالي من التبويب الحالي فقط.
function readCurrentStudent() {
  try {
    const savedStudent = sessionStorage.getItem(
      CURRENT_STUDENT_KEY
    );

    return savedStudent ? JSON.parse(savedStudent) : null;
  } catch {
    return null;
  }
}

// قراءة البيانات المحفوظة بأمان.
function readLocalData(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);

    return savedValue === null
      ? fallback
      : JSON.parse(savedValue);
  } catch {
    return fallback;
  }
}

// تحديد الطالب والفريق والمشروع والمقترح الحالي.
function loadProposalPageData() {
  const student = readCurrentStudent();
  const teams = readLocalData(TEAMS_STORAGE_KEY, []);
  const projects = readLocalData(PROJECTS_STORAGE_KEY, []);
  const proposals = readLocalData(PROPOSALS_STORAGE_KEY, []);

  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeProposals = Array.isArray(proposals) ? proposals : [];

  if (!student?.universityId) {
    return {
      student: null,
      team: null,
      project: null,
      proposal: null,
      teamStatus: "no-team",
      isLeader: false,
    };
  }

  let team = null;

  if (student.teamId) {
    team =
      safeTeams.find(
        (item) => item.id === student.teamId
      ) || null;
  }

  if (!team) {
    team =
      safeTeams.find((item) => {
        const memberIds = [
          item.leaderId,
          ...(Array.isArray(item.memberIds)
            ? item.memberIds
            : []),
          ...(Array.isArray(item.members)
            ? item.members.map(
                (member) =>
                  member.universityId || member.id
              )
            : []),
        ].filter(Boolean);

        return memberIds.some(
          (id) =>
            String(id) === String(student.universityId)
        );
      }) || null;
  }

  const isLeader =
    Boolean(team) &&
    String(team.leaderId) ===
      String(student.universityId);

  const teamStatus = team
    ? isLeader
      ? "leader"
      : "member"
    : student.teamStatus || "no-team";

  const project = team
    ? safeProjects.find(
        (item) => item.teamId === team.id
      ) || null
    : null;

  const proposal = team
    ? safeProposals.find(
        (item) => item.teamId === team.id
      ) || null
    : null;

  return {
    student,
    team,
    project,
    proposal,
    teamStatus,
    isLeader,
  };
}

// تحويل محتوى الملف إلى Data URL لحفظه في تجربة المتصفح.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = () => {
      reject(new Error("Could not read the selected file."));
    };

    reader.readAsDataURL(file);
  });
}

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusClass(status) {
  return (status || "Pending Review")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SubmitProposal() {
  const [pageData, setPageData] = useState(
    loadProposalPageData
  );

  const [proposalFile, setProposalFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const {
    student,
    team,
    project,
    proposal,
    teamStatus,
    isLeader,
  } = pageData;

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!student?.universityId || !team) {
      showMessage(
        "Please sign in and make sure you belong to a team.",
        "error"
      );
      return;
    }

    if (!isLeader) {
      showMessage(
        "Only the Team Leader can submit the proposal.",
        "error"
      );
      return;
    }

    if (!project) {
      showMessage(
        "Please register your project before submitting a proposal.",
        "error"
      );
      return;
    }

    if (!proposalFile) {
      showMessage(
        "Please select your proposal document first.",
        "error"
      );
      return;
    }

    const allowedExtensions = ["pdf", "doc", "docx"];
    const extension =
      proposalFile.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedExtensions.includes(extension)) {
      showMessage(
        "Please choose a PDF, DOC, or DOCX document.",
        "error"
      );
      return;
    }

    if (proposalFile.size > MAX_FILE_SIZE) {
      showMessage(
        "This demo supports files up to 500 KB. Please select a smaller document.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const fileData = await readFileAsDataUrl(proposalFile);

      const savedProposals = readLocalData(
        PROPOSALS_STORAGE_KEY,
        []
      );

      if (!Array.isArray(savedProposals)) {
        throw new Error("Invalid saved proposal data.");
      }

      const existingProposal = savedProposals.find(
        (item) => item.teamId === team.id
      );

      const now = new Date().toISOString();

      const updatedProposal = {
        id: existingProposal?.id || `proposal-${team.id}`,
        teamId: team.id,
        teamName: team.name,
        projectId: project.id,
        projectTitle: project.title,
        projectDomain: project.domain,
        projectDescription: project.description,

        submittedBy: student.universityId,
        submittedByName: student.name || "Team Leader",

        fileName: proposalFile.name,
        fileType:
          proposalFile.type || "application/octet-stream",
        fileSize: proposalFile.size,
        fileData,

        notes: notes.trim(),

        status: "Pending Review",
        supervisorFeedback: "",
        submittedAt: now,

        revisionNumber: existingProposal
          ? (existingProposal.revisionNumber || 1) + 1
          : 1,

        createdAt: existingProposal?.createdAt || now,
        updatedAt: now,
      };

      const updatedProposals = existingProposal
        ? savedProposals.map((item) =>
            item.teamId === team.id
              ? updatedProposal
              : item
          )
        : [...savedProposals, updatedProposal];

      localStorage.setItem(
        PROPOSALS_STORAGE_KEY,
        JSON.stringify(updatedProposals)
      );

      setPageData((currentData) => ({
        ...currentData,
        proposal: updatedProposal,
      }));

      setProposalFile(null);
      setNotes("");
      setFileInputKey((currentKey) => currentKey + 1);

      showMessage(
        existingProposal
          ? "Updated proposal saved successfully. It is now pending supervisor review."
          : "Proposal submitted successfully. It is now pending supervisor review.",
        "success"
      );
    } catch {
      showMessage(
        "Could not save the proposal in this browser. Try a smaller file.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="submit-proposal-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="submit-proposal-content">
        <header className="submit-proposal-header">
          <div className="submit-proposal-header-copy">
            <p className="submit-proposal-eyebrow">
              PROJECT WORKSPACE
            </p>

            <h1>Submit Proposal</h1>

            <p>
              Manage your project proposal, review its current
              status, and submit an updated document when needed.
            </p>
          </div>

          <div
            className="submit-proposal-header-icon"
            aria-hidden="true"
          >
            <FileCheck2 size={28} strokeWidth={1.7} />
          </div>
        </header>

        {!team ? (
          <section className="submit-proposal-card proposal-empty-card">
            <div className="proposal-empty-icon">
              <UsersRound size={25} />
            </div>

            <div className="proposal-empty-copy">
              <h2>Create or join a team first</h2>
              <p>
                A graduation project proposal must belong to a
                registered team.
              </p>

              <Link
                className="submit-proposal-primary-link"
                to="/student/create-team"
              >
                Go to Create Team
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        ) : !isLeader ? (
          <section className="submit-proposal-card proposal-empty-card">
            <div className="proposal-empty-icon">
              <FileText size={25} />
            </div>

            <div className="proposal-empty-copy">
              <span className="proposal-section-kicker">
                TEAM PROPOSAL
              </span>

              <h2>{project?.title || "Project Proposal"}</h2>

              <p className="proposal-team-leader">
                Team Leader: {team.leaderName || "Team Leader"}
              </p>

              {proposal ? (
                <div className="proposal-member-summary">
                  <div className="proposal-member-summary-row">
                    <span>Current status</span>

                    <span
                      className={`proposal-status-pill ${getStatusClass(
                        proposal.status
                      )}`}
                    >
                      {proposal.status}
                    </span>
                  </div>

                  <div className="proposal-member-summary-row">
                    <span>Submitted</span>
                    <strong>
                      {formatDate(proposal.submittedAt)}
                    </strong>
                  </div>

                  <div className="proposal-member-summary-row">
                    <span>Document</span>
                    <strong className="proposal-member-file-name">
                      {proposal.fileName}
                    </strong>
                  </div>
                </div>
              ) : (
                <p>
                  Your Team Leader has not submitted a proposal yet.
                </p>
              )}

              <p className="proposal-permission-note">
                Only the Team Leader can submit or update the proposal.
              </p>

              <Link
                className="submit-proposal-primary-link"
                to="/student/proposal-status"
              >
                View Proposal Status
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        ) : !project ? (
          <section className="submit-proposal-card proposal-empty-card">
            <div className="proposal-empty-icon">
              <FolderKanban size={25} />
            </div>

            <div className="proposal-empty-copy">
              <span className="proposal-section-kicker">
                ONE MORE STEP
              </span>

              <h2>Register Your Project First</h2>

              <p>
                Add your project title, domain, and description
                before submitting its proposal.
              </p>

              <Link
                className="submit-proposal-primary-link"
                to="/student/project-registration"
              >
                Project Registration
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* Project overview */}
            <section className="submit-proposal-card project-overview-card">
              <div className="proposal-section-heading">
                <div className="proposal-section-icon">
                  <FolderKanban size={21} />
                </div>

                <div className="proposal-section-heading-copy">
                  <span className="proposal-section-kicker">
                    YOUR PROJECT
                  </span>

                  <h2>Project Information</h2>
                </div>

                <span className="proposal-team-chip">
                  <UsersRound size={14} />
                  {team.name}
                </span>
              </div>

              <div className="project-overview-body">
                <div className="project-overview-main">
                  <span className="project-overview-label">
                    PROJECT TITLE
                  </span>

                  <h3>{project.title}</h3>

                  {project.description && (
                    <p>{project.description}</p>
                  )}
                </div>

                <div className="project-overview-domain">
                  <span>Project domain</span>
                  <strong>
                    {project.domain || "Not specified"}
                  </strong>
                </div>
              </div>
            </section>

            {/* Current proposal */}
            <section className="submit-proposal-card current-proposal-card">
              <div className="proposal-section-heading">
                <div className="proposal-section-icon">
                  <FileText size={21} />
                </div>

                <div className="proposal-section-heading-copy">
                  <span className="proposal-section-kicker">
                    DOCUMENT OVERVIEW
                  </span>

                  <h2>Current Proposal</h2>
                </div>

                {proposal && (
                  <span
                    className={`proposal-status-pill ${getStatusClass(
                      proposal.status
                    )}`}
                  >
                    {proposal.status}
                  </span>
                )}
              </div>

              {!proposal ? (
                <div className="proposal-no-document">
                  <FileText size={22} />

                  <div>
                    <h3>No proposal submitted yet</h3>
                    <p>
                      Your first proposal will appear here after
                      you submit it for review.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="submit-proposal-current">
                    <div className="proposal-file-icon">
                      <FileText size={24} />
                    </div>

                    <div className="proposal-file-details">
                      <strong className="proposal-file-name">
                        {proposal.fileName}
                      </strong>

                      <div className="proposal-file-meta">
                        <span>
                          <CalendarDays size={14} />
                          Submitted {formatDate(proposal.submittedAt)}
                        </span>

                        {proposal.revisionNumber > 1 && (
                          <span className="proposal-revision-label">
                            Revision {proposal.revisionNumber}
                          </span>
                        )}
                      </div>

                      {typeof proposal.fileSize === "number" && (
                        <span className="proposal-file-size">
                          {(proposal.fileSize / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>

                    {proposal.fileData && (
                      <a
                        href={proposal.fileData}
                        download={proposal.fileName}
                        className="submit-proposal-download"
                      >
                        <Download size={15} />
                        Download
                      </a>
                    )}
                  </div>

                  {proposal.supervisorFeedback && (
                    <div className="submit-proposal-feedback">
                      <div className="proposal-feedback-icon">
                        <AlertCircle size={18} />
                      </div>

                      <div>
                        <strong>Supervisor Feedback</strong>
                        <p>{proposal.supervisorFeedback}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Submission form */}
            <section className="submit-proposal-card proposal-form-card">
              <div className="proposal-section-heading">
                <div className="proposal-section-icon upload-section-icon">
                  <UploadCloud size={22} />
                </div>

                <div className="proposal-section-heading-copy">
                  <span className="proposal-section-kicker">
                    DOCUMENT WORKFLOW
                  </span>

                  <h2>
                    {proposal
                      ? "Submit Updated Proposal"
                      : "Proposal Submission"}
                  </h2>
                </div>
              </div>

              <p className="proposal-form-intro">
                {proposal
                  ? "Upload your revised document. The latest version will replace the current proposal for your team."
                  : "Upload your project proposal document and include any notes for your academic supervisor."}
              </p>

              <div className="proposal-file-guidelines">
                <div className="proposal-guideline-icon">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <strong>Before you submit</strong>

                  <p>
                    Accepted formats: PDF, DOC, and DOCX.
                    Maximum file size: 500 KB.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="submit-proposal-field">
                  <label htmlFor="proposalFile">
                    Proposal Document
                  </label>

                  <div className="proposal-upload-box">
                    <div className="proposal-upload-icon">
                      <UploadCloud size={24} />
                    </div>

                    <div className="proposal-upload-copy">
                      <strong>Choose your proposal file</strong>
                      <span>
                        Select a PDF, DOC, or DOCX document
                      </span>
                    </div>

                    <input
                      key={fileInputKey}
                      id="proposalFile"
                      name="proposalFile"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(event) => {
                        setProposalFile(
                          event.target.files?.[0] ?? null
                        );
                        setMessage("");
                      }}
                      required
                    />
                  </div>

                  <span className="submit-proposal-hint">
                    PDF, DOC, DOCX · Maximum 500 KB
                  </span>
                </div>

                {proposalFile && (
                  <div className="submit-proposal-selected-file">
                    <div className="selected-file-icon">
                      <FileText size={19} />
                    </div>

                    <div className="selected-file-copy">
                      <strong>Selected file</strong>
                      <span>{proposalFile.name}</span>
                    </div>

                    <span className="selected-file-size">
                      {(proposalFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}

                <div className="submit-proposal-field">
                  <label htmlFor="proposalNotes">
                    Additional Notes
                    <span className="proposal-optional-label">
                      Optional
                    </span>
                  </label>

                  <textarea
                    id="proposalNotes"
                    name="proposalNotes"
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      setMessage("");
                    }}
                    placeholder="Add any notes for your supervisor..."
                    rows={4}
                    maxLength={2000}
                  />

                  <span className="submit-proposal-hint">
                    You can include revision notes or important details.
                  </span>
                </div>

                <button
                  type="submit"
                  className="submit-proposal-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="proposal-button-spinner" />
                      Saving Proposal...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={17} />
                      {proposal
                        ? "Submit Updated Proposal"
                        : "Submit for Review"}
                    </>
                  )}
                </button>

                {message && (
                  <p
                    className={`submit-proposal-message ${messageType}`}
                    role="status"
                    aria-live="polite"
                  >
                    {messageType === "success" ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <AlertCircle size={17} />
                    )}

                    <span>{message}</span>
                  </p>
                )}
              </form>
            </section>
          </>
        )}

        <p className="submit-proposal-demo-note">
          Proposal data is stored locally in this browser.
          Backend synchronization and supervisor review will be
          connected during backend integration.
        </p>
      </main>
    </div>
  );
}

export default SubmitProposal;