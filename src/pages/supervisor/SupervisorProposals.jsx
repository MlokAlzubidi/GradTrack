
import { useEffect, useMemo, useState } from "react";
import {
  FileCheck2,
  Search,
  FileText,
  Download,
  CalendarDays,
  UsersRound,
  CheckCircle2,
  MessageSquareText,
  Clock3,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { getSupervisorSession } from "../../utils/supervisorAuth";
import "./SupervisorProposals.css";

const PROPOSALS_KEY = "gradtrack-proposals";

function readProposals() {
  try {
    const saved = localStorage.getItem(PROPOSALS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || bytes < 0) {
    return "Size unavailable";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function getStatusClass(status) {
  return (status || "Pending Review")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SupervisorProposals() {
  const [proposals, setProposals] = useState(readProposals);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [feedbackById, setFeedbackById] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [errorById, setErrorById] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [generalError, setGeneralError] = useState("");

  const supervisor = getSupervisorSession();

  function refreshProposals() {
    setProposals(readProposals());
  }

  useEffect(() => {
    function refreshOnStorage(event) {
      if (!event.key || event.key === PROPOSALS_KEY) {
        refreshProposals();
      }
    }

    window.addEventListener("storage", refreshOnStorage);
    window.addEventListener("focus", refreshProposals);

    return () => {
      window.removeEventListener("storage", refreshOnStorage);
      window.removeEventListener("focus", refreshProposals);
    };
  }, []);

  const pendingCount = proposals.filter(
    (proposal) => (proposal.status || "Pending Review") === "Pending Review"
  ).length;

  const approvedCount = proposals.filter(
    (proposal) => proposal.status === "Approved"
  ).length;

  const changesCount = proposals.filter(
    (proposal) => proposal.status === "Changes Requested"
  ).length;

  const filteredProposals = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return proposals
      .filter((proposal) => {
        const searchableText = [
          proposal.projectTitle,
          proposal.projectDomain,
          proposal.teamName,
          proposal.submittedByName,
          proposal.submittedBy,
          proposal.fileName,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        const matchesSearch = searchableText.includes(query);
        const status = proposal.status || "Pending Review";
        const matchesStatus =
          statusFilter === "All" || status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.submittedAt || b.updatedAt || 0).getTime();

        return dateB - dateA;
      });
  }, [proposals, searchTerm, statusFilter]);

  function updateFeedback(proposalId, value) {
    setFeedbackById((current) => ({
      ...current,
      [proposalId]: value,
    }));

    setErrorById((current) => ({
      ...current,
      [proposalId]: "",
    }));

    setSuccessMessage("");
    setGeneralError("");
  }

  function toggleReview(proposal) {
    const proposalId = proposal.id || proposal.teamId;

    setExpandedId((current) =>
      current === proposalId ? null : proposalId
    );

    setSuccessMessage("");
    setGeneralError("");
  }

  function handleReview(proposal, decision) {
    const proposalId = proposal.id || proposal.teamId;
    const feedback = (feedbackById[proposalId] || "").trim();

    if (decision === "Changes Requested" && !feedback) {
      setErrorById((current) => ({
        ...current,
        [proposalId]:
          "Please explain what the team needs to change before submitting this decision.",
      }));
      return;
    }

    setSavingId(proposalId);
    setSuccessMessage("");
    setGeneralError("");

    try {
      const latestProposals = readProposals();

      const proposalIndex = latestProposals.findIndex(
        (item) =>
          (proposal.id && item.id === proposal.id) ||
          String(item.teamId) === String(proposal.teamId)
      );

      if (proposalIndex === -1) {
        setGeneralError(
          "This proposal could not be found in saved data. Refresh the page and try again."
        );
        setSavingId(null);
        return;
      }

      const currentProposal = latestProposals[proposalIndex];

      if (currentProposal.status !== "Pending Review") {
        setGeneralError(
          "This proposal is no longer pending review. Refresh the list to see its latest status."
        );
        setProposals(latestProposals);
        setSavingId(null);
        return;
      }

      const now = new Date().toISOString();

      const updatedProposal = {
        ...currentProposal,
        status: decision,
        supervisorFeedback: feedback,
        reviewedAt: now,
        reviewedBy:
          supervisor?.name || "Academic Supervisor",
        updatedAt: now,
      };

      const updatedProposals = [...latestProposals];
      updatedProposals[proposalIndex] = updatedProposal;

      localStorage.setItem(
        PROPOSALS_KEY,
        JSON.stringify(updatedProposals)
      );

      setProposals(updatedProposals);
      setExpandedId(null);
      setFeedbackById((current) => {
        const next = { ...current };
        delete next[proposalId];
        return next;
      });

      setErrorById((current) => {
        const next = { ...current };
        delete next[proposalId];
        return next;
      });

      setSuccessMessage(
        decision === "Approved"
          ? `The proposal for "${updatedProposal.projectTitle || updatedProposal.teamName || "this team"}" has been approved.`
          : `Changes have been requested for "${updatedProposal.projectTitle || updatedProposal.teamName || "this team"}".`
      );
    } catch {
      setGeneralError(
        "The review could not be saved in this browser. Check the available storage and try again."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="supervisor-proposals-page">
      <header className="supervisor-proposals-header">
        <div>
          <span className="supervisor-proposals-eyebrow">
            ACADEMIC REVIEW
          </span>

          <h2>Review Proposals</h2>

          <p>
            Review submitted graduation project proposals, approve
            suitable submissions, or request revisions with clear
            feedback for the team.
          </p>
        </div>

        <div className="supervisor-proposals-header-icon">
          <FileCheck2 size={28} strokeWidth={1.7} />
        </div>
      </header>

      {successMessage && (
        <div
          className="supervisor-proposals-alert success"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={19} />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {generalError && (
        <div
          className="supervisor-proposals-alert error"
          role="alert"
        >
          <XCircle size={19} />
          <span>{generalError}</span>
          <button
            type="button"
            onClick={() => setGeneralError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <section
        className="supervisor-proposals-stats"
        aria-label="Proposal statistics"
      >
        <article className="supervisor-proposal-stat">
          <div className="supervisor-proposal-stat-icon pending">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Pending Review</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting a decision</small>
          </div>
        </article>

        <article className="supervisor-proposal-stat">
          <div className="supervisor-proposal-stat-icon approved">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
            <small>Accepted proposals</small>
          </div>
        </article>

        <article className="supervisor-proposal-stat">
          <div className="supervisor-proposal-stat-icon revisions">
            <MessageSquareText size={21} />
          </div>
          <div>
            <span>Changes Requested</span>
            <strong>{changesCount}</strong>
            <small>Require a revised proposal</small>
          </div>
        </article>
      </section>

      <section className="supervisor-proposals-list-section">
        <div className="supervisor-proposals-list-heading">
          <div>
            <h3>Submitted Proposals</h3>
            <p>
              {filteredProposals.length}{" "}
              {filteredProposals.length === 1
                ? "proposal"
                : "proposals"}{" "}
              found
            </p>
          </div>

          <button
            type="button"
            className="supervisor-proposals-refresh"
            onClick={refreshProposals}
            aria-label="Refresh proposals"
            title="Refresh proposals"
          >
            <RefreshCw size={17} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="supervisor-proposals-toolbar">
          <label className="supervisor-proposals-search">
            <Search size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by project, team, or file..."
              aria-label="Search proposals"
            />
          </label>

          <label className="supervisor-proposals-status-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter proposals by status"
            >
              <option value="All">All statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Changes Requested">Changes Requested</option>
            </select>
          </label>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="supervisor-proposals-empty">
            <div className="supervisor-proposals-empty-icon">
              <FileText size={28} />
            </div>

            <h3>
              {proposals.length === 0
                ? "No proposals submitted yet"
                : "No matching proposals"}
            </h3>

            <p>
              {proposals.length === 0
                ? "When a Team Leader submits a proposal, it will appear here for review."
                : "Try changing your search or selecting another status."}
            </p>

            {proposals.length > 0 && (
              <button
                type="button"
                className="supervisor-proposals-clear"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="supervisor-proposals-list">
            {filteredProposals.map((proposal) => {
              const proposalId = proposal.id || proposal.teamId;
              const isExpanded = expandedId === proposalId;
              const isPending =
                (proposal.status || "Pending Review") === "Pending Review";
              const isSaving = savingId === proposalId;

              return (
                <article
                  className="supervisor-proposal-card"
                  key={proposalId}
                >
                  <div className="supervisor-proposal-card-main">
                    <div className="supervisor-proposal-document-icon">
                      <FileText size={23} />
                    </div>

                    <div className="supervisor-proposal-card-details">
                      <div className="supervisor-proposal-card-topline">
                        <span className="supervisor-proposal-domain">
                          {proposal.projectDomain || "Domain not specified"}
                        </span>

                        <span
                          className={`supervisor-proposal-status ${getStatusClass(
                            proposal.status || "Pending Review"
                          )}`}
                        >
                          {proposal.status || "Pending Review"}
                        </span>
                      </div>

                      <h4>
                        {proposal.projectTitle || "Untitled Project"}
                      </h4>

                      <div className="supervisor-proposal-meta">
                        <span>
                          <UsersRound size={14} />
                          {proposal.teamName || "Unnamed Team"}
                        </span>

                        <span>
                          <CalendarDays size={14} />
                          {formatDate(proposal.submittedAt)}
                        </span>
                      </div>

                      <p className="supervisor-proposal-submitter">
                        Submitted by{" "}
                        <strong>
                          {proposal.submittedByName || "Team Leader"}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="supervisor-proposal-file-row">
                    <div className="supervisor-proposal-file-details">
                      <FileText size={18} />
                      <div>
                        <strong>
                          {proposal.fileName || "Proposal document"}
                        </strong>
                        <span>{formatFileSize(proposal.fileSize)}</span>
                      </div>
                    </div>

                    {proposal.fileData ? (
                      <a
                        className="supervisor-proposal-download"
                        href={proposal.fileData}
                        download={proposal.fileName || "proposal"}
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </a>
                    ) : (
                      <span className="supervisor-proposal-file-missing">
                        File unavailable
                      </span>
                    )}
                  </div>

                  {proposal.notes && (
                    <div className="supervisor-proposal-student-notes">
                      <strong>Team notes</strong>
                      <p>{proposal.notes}</p>
                    </div>
                  )}

                  {proposal.supervisorFeedback && (
                    <div className="supervisor-proposal-existing-feedback">
                      <MessageSquareText size={17} />
                      <div>
                        <strong>Supervisor feedback</strong>
                        <p>{proposal.supervisorFeedback}</p>
                      </div>
                    </div>
                  )}

                  {proposal.reviewedAt && (
                    <p className="supervisor-proposal-reviewed-meta">
                      Last reviewed by{" "}
                      <strong>{proposal.reviewedBy || "Supervisor"}</strong>
                      {" · "}
                      {formatDate(proposal.reviewedAt)}
                    </p>
                  )}

                  <div className="supervisor-proposal-card-footer">
                    <span>
                      Revision {proposal.revisionNumber || 1}
                    </span>

                    {isPending && (
                      <button
                        type="button"
                        className="supervisor-proposal-review-toggle"
                        onClick={() => toggleReview(proposal)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <>
                            Close review <ChevronUp size={17} />
                          </>
                        ) : (
                          <>
                            Review proposal <ChevronDown size={17} />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isExpanded && isPending && (
                    <div className="supervisor-proposal-review-panel">
                      <div className="supervisor-proposal-review-panel-title">
                        <MessageSquareText size={19} />
                        <div>
                          <h5>Review decision</h5>
                          <p>
                            Add feedback to guide the team. Feedback is
                            required when requesting changes.
                          </p>
                        </div>
                      </div>

                      <label
                        className="supervisor-proposal-feedback-label"
                        htmlFor={`feedback-${String(proposalId)}`}
                      >
                        Feedback for the team
                      </label>

                      <textarea
                        id={`feedback-${String(proposalId)}`}
                        value={feedbackById[proposalId] || ""}
                        onChange={(event) =>
                          updateFeedback(proposalId, event.target.value)
                        }
                        placeholder="Enter your review notes or explain the changes required..."
                        rows={4}
                        maxLength={3000}
                      />

                      <div className="supervisor-proposal-feedback-footer">
                        <span>
                          {(feedbackById[proposalId] || "").length}/3000
                        </span>

                        {errorById[proposalId] && (
                          <span
                            className="supervisor-proposal-inline-error"
                            role="alert"
                          >
                            {errorById[proposalId]}
                          </span>
                        )}
                      </div>

                      <div className="supervisor-proposal-decision-buttons">
                        <button
                          type="button"
                          className="supervisor-proposal-request-button"
                          disabled={isSaving}
                          onClick={() =>
                            handleReview(proposal, "Changes Requested")
                          }
                        >
                          <MessageSquareText size={17} />
                          Request Changes
                        </button>

                        <button
                          type="button"
                          className="supervisor-proposal-approve-button"
                          disabled={isSaving}
                          onClick={() =>
                            handleReview(proposal, "Approved")
                          }
                        >
                          <CheckCircle2 size={17} />
                          {isSaving ? "Saving..." : "Approve Proposal"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="supervisor-proposals-demo-note">
        Proposal reviews are currently saved in this browser's local
        storage. Backend authentication, supervisor assignment, and
        automated team notifications are not connected yet.
      </p>
    </div>
  );
}

export default SupervisorProposals;
