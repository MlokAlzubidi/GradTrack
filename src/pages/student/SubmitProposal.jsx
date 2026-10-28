
import { useState } from "react";
import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./SubmitProposal.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const PROJECTS_STORAGE_KEY = "gradtrack-projects";
const PROPOSALS_STORAGE_KEY = "gradtrack-proposals";

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

const MAX_FILE_SIZE = 500 * 1024;

// قراءة بيانات JSON من المتصفح بأمان.
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

  // البحث عن فريق الطالب باستخدام teamId أو عضويته المحفوظة.
  let team = null;

  if (student.teamId) {
    team =
      safeTeams.find((item) => item.id === student.teamId) || null;
  }

  if (!team) {
    team =
      safeTeams.find((item) => {
        const memberIds = [
          item.leaderId,
          ...(Array.isArray(item.memberIds) ? item.memberIds : []),
          ...(Array.isArray(item.members)
            ? item.members.map(
                (member) => member.universityId || member.id
              )
            : []),
        ].filter(Boolean);

        return memberIds.includes(student.universityId);
      }) || null;
  }

  const isLeader =
    Boolean(team) &&
    team.leaderId === student.universityId;

  const teamStatus = team
    ? isLeader
      ? "leader"
      : "member"
    : student.teamStatus || "no-team";

  // كل فريق يستخدم مشروعه ومقترحه الخاصين به.
  const project = team
    ? safeProjects.find((item) => item.teamId === team.id) || null
    : null;

  const proposal = team
    ? safeProposals.find((item) => item.teamId === team.id) || null
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

// تحويل محتوى الملف إلى Data URL حتى يمكن حفظه في تجربة المتصفح.
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

function SubmitProposal() {
  const [pageData, setPageData] = useState(loadProposalPageData);

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
      // قراءة الملف نفسه حتى يكون متاحًا للتنزيل من صفحات الفريق.
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

      // نحفظ أحدث نسخة من المقترح لكل فريق.
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
        fileType: proposalFile.type || "application/octet-stream",
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
            item.teamId === team.id ? updatedProposal : item
          )
        : [...savedProposals, updatedProposal];

      // نحفظ بيانات المقترح قبل عرض رسالة نجاح.
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
          <p className="submit-proposal-eyebrow">
            PROJECT & PROPOSAL
          </p>

          <h1>Submit Proposal</h1>

          <p>
            Submit your graduation project proposal for
            review by your academic supervisor.
          </p>
        </header>

        {!team ? (
          <section className="submit-proposal-card">
            <h2>Create or join a team first</h2>

            <p>
              A project proposal must belong to a registered team.
            </p>

            <Link to="/student/create-team">
              Go to Create Team →
            </Link>
          </section>
        ) : !isLeader ? (
          <section className="submit-proposal-card">
            <h2>{project?.title || "Project Proposal"}</h2>

            <p>
              Team Leader: {team.leaderName || "Team Leader"}
            </p>

            {proposal ? (
              <>
                <div className="submit-proposal-info">
                  <strong>Proposal Status</strong>
                  <p>{proposal.status}</p>
                </div>

                <p>
                  <strong>Submitted:</strong>{" "}
                  {formatDate(proposal.submittedAt)}
                </p>

                <p>
                  <strong>Document:</strong> {proposal.fileName}
                </p>

                <p>
                  Only the Team Leader can submit or update the
                  proposal. You can review its current status here.
                </p>
              </>
            ) : (
              <p>
                Your Team Leader has not submitted a proposal yet.
              </p>
            )}

            <Link to="/student/proposal-status">
              View Proposal Status & Feedback →
            </Link>
          </section>
        ) : !project ? (
          <section className="submit-proposal-card">
            <h2>Register Your Project First</h2>

            <p>
              Before submitting a proposal, register the project
              title, domain, and description.
            </p>

            <Link to="/student/project-registration">
              Go to Project Registration →
            </Link>
          </section>
        ) : (
          <>
            <section className="submit-proposal-card">
              <h2>Project Information</h2>

              <div className="submit-proposal-info">
                <strong>{project.title}</strong>
                <p>Domain: {project.domain}</p>
                <p>{project.description}</p>

                <p>
                  Team: {team.name}
                </p>
              </div>
            </section>

            {proposal && (
              <section className="submit-proposal-card">
                <h2>Current Proposal</h2>

                <div className="submit-proposal-current">
                  <div>
                    <strong>{proposal.fileName}</strong>

                    <p>
                      Submitted on {formatDate(proposal.submittedAt)}
                    </p>

                    <p>
                      Status:{" "}
                      <strong>{proposal.status}</strong>
                    </p>

                    {proposal.revisionNumber > 1 && (
                      <p>
                        Revision: {proposal.revisionNumber}
                      </p>
                    )}
                  </div>

                  {proposal.fileData && (
                    <a
                      href={proposal.fileData}
                      download={proposal.fileName}
                      className="submit-proposal-download"
                    >
                      Download
                    </a>
                  )}
                </div>

                {proposal.supervisorFeedback && (
                  <div className="submit-proposal-info">
                    <strong>Supervisor Feedback</strong>
                    <p>{proposal.supervisorFeedback}</p>
                  </div>
                )}
              </section>
            )}

            <section className="submit-proposal-card">
              <h2>
                {proposal ? "Submit Updated Proposal" : "Proposal Submission"}
              </h2>

              <p>
                Upload your proposal document and include any
                additional notes for the supervisor.
              </p>

              <div className="submit-proposal-info">
                <strong>Before submitting</strong>

                <p>
                  Accepted formats are PDF, DOC, and DOCX.
                  The maximum file size in this demo is 500 KB.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="submit-proposal-field">
                  <label htmlFor="proposalFile">
                    Proposal Document
                  </label>

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

                  <span className="submit-proposal-hint">
                    PDF, DOC, DOCX · Max 500 KB
                  </span>
                </div>

                {proposalFile && (
                  <div className="submit-proposal-selected-file">
                    <strong>Selected file:</strong>
                    <span>{proposalFile.name}</span>
                  </div>
                )}

                <div className="submit-proposal-field">
                  <label htmlFor="proposalNotes">
                    Additional Notes (Optional)
                  </label>

                  <textarea
                    id="proposalNotes"
                    name="proposalNotes"
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      setMessage("");
                    }}
                    placeholder="Add any notes for your supervisor"
                    rows={4}
                    maxLength={2000}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving Proposal..."
                    : proposal
                      ? "Submit Updated Proposal"
                      : "Submit for Review"}
                </button>

                {message && (
                  <p
                    className={`submit-proposal-message ${messageType}`}
                    role="status"
                    aria-live="polite"
                  >
                    {message}
                  </p>
                )}
              </form>
            </section>
          </>
        )}

        <p className="submit-proposal-demo-note">
          Proposal data is stored in this browser for frontend testing.
          Supervisor review and cross-device sharing will require
          backend integration.
        </p>
      </main>
    </div>
  );
}

export default SubmitProposal;
