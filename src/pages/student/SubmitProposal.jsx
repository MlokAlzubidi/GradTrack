import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./SubmitProposal.css";

function SubmitProposal() {
  const [proposalFile, setProposalFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!proposalFile) {
      setMessage("Please select your proposal document first.");
      return;
    }

    setMessage(
      `Demo only: ${proposalFile.name} is selected. ` +
        "The proposal will be submitted for supervisor review after backend integration."
    );
  }

  return (
    <div className="submit-proposal-page student-layout">
      <StudentNavbar teamStatus="leader" />

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

        <section className="submit-proposal-card">
          <h2>Proposal Submission</h2>

          <p>
            Upload your proposal document and include any
            additional notes for the supervisor.
          </p>

          <div className="submit-proposal-info">
            <strong>Before submitting</strong>
            <p>
              Make sure your project has been registered and
              your document is ready for review.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="submit-proposal-field">
              <label htmlFor="proposalFile">
                Proposal Document
              </label>

              <input
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
                Accepted formats: PDF, DOC, DOCX.
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

            <button type="submit">
              Submit for Review
            </button>

            {message && (
              <p
                className="submit-proposal-message"
                role="status"
              >
                {message}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default SubmitProposal;