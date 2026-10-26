import StudentNavbar from "../../components/layout/StudentNavbar";
import "./ProposalStatus.css";

function ProposalStatus() {
  // Sample data for frontend development.
  // Real proposal status and feedback will come from the backend.
  const proposal = {
    projectTitle: "GradTrack",
    status: "Changes Requested",
    submittedAt: "2026-10-25",
    supervisorFeedback:
      "Please clarify the project scope and provide more details about the main system requirements.",
  };

  const statusClass = proposal.status
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <div className="proposal-status-page student-layout">
      <StudentNavbar teamStatus="member" />

      <main className="proposal-status-content">
        <header className="proposal-status-header">
          <p className="proposal-status-eyebrow">
            PROJECT & PROPOSAL
          </p>

          <h1>Proposal Status & Feedback</h1>

          <p>
            Track your graduation project proposal and review
            feedback provided by your academic supervisor.
          </p>
        </header>

        <section className="proposal-status-card">
          <div className="proposal-status-card-heading">
            <div>
              <p className="proposal-status-label">
                PROJECT TITLE
              </p>

              <h2>{proposal.projectTitle}</h2>
            </div>

            <span
              className={`proposal-status-badge ${statusClass}`}
            >
              {proposal.status}
            </span>
          </div>

          <div className="proposal-status-meta">
            <span>Submitted on</span>

            <time dateTime={proposal.submittedAt}>
              {proposal.submittedAt}
            </time>
          </div>
        </section>

        <section className="proposal-feedback-card">
          <div className="proposal-feedback-heading">
            <span
              className="proposal-feedback-icon"
              aria-hidden="true"
            >
              💬
            </span>

            <div>
              <h2>Supervisor Feedback</h2>

              <p>
                Review the notes provided for your proposal.
              </p>
            </div>
          </div>

          {proposal.supervisorFeedback ? (
            <div className="proposal-feedback-content">
              <p>{proposal.supervisorFeedback}</p>
            </div>
          ) : (
            <div className="proposal-feedback-empty">
              <p>
                No feedback is available yet. Check again
                after your supervisor reviews the proposal.
              </p>
            </div>
          )}
        </section>

        {proposal.status === "Changes Requested" && (
          <section className="proposal-revision-notice">
            <h2>Revision Required</h2>

            <p>
              The Team Leader should update the proposal
              according to the supervisor's feedback and
              submit the revised version for review.
            </p>
          </section>
        )}

        <p className="proposal-status-demo-note">
          This page currently uses sample data. Actual proposal
          status and supervisor feedback will be loaded from
          the backend later.
        </p>
      </main>
    </div>
  );
}

export default ProposalStatus;