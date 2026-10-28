
import { useEffect, useMemo, useState } from "react";
import {
  Files,
  Search,
  Download,
  CalendarDays,
  UsersRound,
  CheckCircle2,
  MessageSquareText,
  Clock3,
  RefreshCw,
  FileText,
  ClipboardCheck,
  XCircle,
} from "lucide-react";
import { getSupervisorSession } from "../../utils/supervisorAuth";
import { addNotification } from "../../utils/notifications";
import "./SupervisorSubmissions.css";

const TASKS_KEY = "gradtrack-team-tasks";
const TEAMS_KEY = "gradtrack-teams";

function readArray(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadPageData() {
  return {
    tasks: readArray(TASKS_KEY),
    teams: readArray(TEAMS_KEY),
  };
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

  return bytes < 1024
    ? `${bytes} B`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

function getReviewStatus(submission) {
  return submission.reviewStatus || "Pending Review";
}

function getStatusClass(status) {
  return status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getTeamName(teamId, teams, fallbackName) {
  const team = teams.find(
    (item) => String(item.id) === String(teamId)
  );

  return (
    team?.name ||
    fallbackName ||
    "Team information unavailable"
  );
}

function getSubmissionRecords(tasks, teams) {
  return tasks.flatMap((task) => {
    if (!Array.isArray(task.submissions)) {
      return [];
    }

    const teamName = getTeamName(
      task.teamId,
      teams,
      task.teamName
    );

    return task.submissions
      .filter((submission) => submission?.fileData)
      .map((submission, index) => ({
        taskId: task.id,
        taskTitle: task.title || "Untitled Task",
        taskDescription: task.description || "",
        teamId: task.teamId,
        teamName,
        dueDate: task.dueDate || "",
        submission,
        submissionId:
          submission.id ||
          `${task.id}-${submission.studentId || index}`,
        reviewStatus: getReviewStatus(submission),
      }));
  });
}

function SupervisorSubmissions() {
  const [data, setData] = useState(loadPageData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [feedbackById, setFeedbackById] = useState({});
  const [errorById, setErrorById] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [generalError, setGeneralError] = useState("");

  const supervisor = getSupervisorSession();

  function refreshData() {
    setData(loadPageData());
  }

  useEffect(() => {
    function handleStorage(event) {
      if (
        !event.key ||
        event.key === TASKS_KEY ||
        event.key === TEAMS_KEY
      ) {
        refreshData();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshData);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshData);
    };
  }, []);

  const records = useMemo(
    () => getSubmissionRecords(data.tasks, data.teams),
    [data]
  );

  const pendingCount = records.filter(
    (record) => record.reviewStatus === "Pending Review"
  ).length;

  const reviewedCount = records.filter(
    (record) => record.reviewStatus === "Reviewed"
  ).length;

  const revisionCount = records.filter(
    (record) => record.reviewStatus === "Changes Requested"
  ).length;

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records
      .filter((record) => {
        const submission = record.submission;

        const searchableText = [
          record.taskTitle,
          record.taskDescription,
          record.teamName,
          submission.studentName,
          submission.studentId,
          submission.fileName,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        const matchesSearch = searchableText.includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          record.reviewStatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.submission.submittedAt || 0
        ).getTime();

        const dateB = new Date(
          b.submission.submittedAt || 0
        ).getTime();

        return dateB - dateA;
      });
  }, [records, searchTerm, statusFilter]);

  function toggleReview(record) {
    setExpandedId((current) =>
      current === record.submissionId
        ? null
        : record.submissionId
    );

    setSuccessMessage("");
    setGeneralError("");

    setFeedbackById((current) => ({
      ...current,
      [record.submissionId]:
        current[record.submissionId] ??
        record.submission.supervisorFeedback ??
        "",
    }));
  }

  function updateFeedback(submissionId, value) {
    setFeedbackById((current) => ({
      ...current,
      [submissionId]: value,
    }));

    setErrorById((current) => ({
      ...current,
      [submissionId]: "",
    }));

    setSuccessMessage("");
    setGeneralError("");
  }

  // Save the review, then notify the student who submitted the file.
  function handleReview(record, decision) {
    const submissionId = record.submissionId;

    const feedback = (
      feedbackById[submissionId] ??
      record.submission.supervisorFeedback ??
      ""
    ).trim();

    if (
      decision === "Changes Requested" &&
      !feedback
    ) {
      setErrorById((current) => ({
        ...current,
        [submissionId]:
          "Please explain what the student needs to change before requesting a revision.",
      }));

      return;
    }

    setSavingId(submissionId);
    setSuccessMessage("");
    setGeneralError("");

    try {
      // Always read the latest data before saving.
      const latestTasks = readArray(TASKS_KEY);

      const taskIndex = latestTasks.findIndex(
        (task) =>
          String(task.id) === String(record.taskId) &&
          String(task.teamId) === String(record.teamId)
      );

      if (taskIndex === -1) {
        setGeneralError(
          "The task could not be found in saved data. Refresh the page and try again."
        );
        return;
      }

      const latestTask = latestTasks[taskIndex];

      const submissions = Array.isArray(
        latestTask.submissions
      )
        ? latestTask.submissions
        : [];

      const submissionIndex = submissions.findIndex(
        (submission) =>
          record.submission.id
            ? submission.id === record.submission.id
            : String(submission.studentId) ===
              String(record.submission.studentId)
      );

      if (submissionIndex === -1) {
        setGeneralError(
          "This submission could not be found. Refresh the page and try again."
        );
        return;
      }

      const latestSubmission = submissions[submissionIndex];
      const now = new Date().toISOString();

      const updatedSubmission = {
        ...latestSubmission,
        reviewStatus: decision,
        supervisorFeedback: feedback,
        reviewedAt: now,
        reviewedBy:
          supervisor?.name || "Academic Supervisor",
      };

      const updatedSubmissions = [...submissions];

      updatedSubmissions[submissionIndex] =
        updatedSubmission;

      const updatedTasks = [...latestTasks];

      updatedTasks[taskIndex] = {
        ...latestTask,
        submissions: updatedSubmissions,
      };

      // Save review status and feedback first.
      localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(updatedTasks)
      );

      const supervisorName =
        supervisor?.name || "Academic Supervisor";

      const isReviewed = decision === "Reviewed";
      let notificationSaved = false;

      const recipientId = updatedSubmission.studentId;

      // A notification is sent to the student who submitted the file.
      if (
        recipientId !== undefined &&
        recipientId !== null &&
        String(recipientId).trim() !== ""
      ) {
        try {
          const notificationResult = addNotification({
            id: `task-submission-review-${record.submissionId}-${decision}-${Date.now()}`,
            recipientId,
            type: "task",
            title: isReviewed
              ? "Task Submission Reviewed"
              : "Revision Requested",
            message: isReviewed
              ? `${supervisorName} reviewed your submission for "${record.taskTitle}".${
                  feedback
                    ? ` Feedback: ${feedback}`
                    : " No additional feedback was provided."
                }`
              : `${supervisorName} requested changes to your submission for "${record.taskTitle}". Feedback: ${feedback}`,
            link: "/student/tasks",
            relatedId:
              updatedSubmission.id || record.submissionId,
          });

          // Some implementations return true/false; an undefined
          // return is treated as success if no error was thrown.
          notificationSaved = notificationResult !== false;
        } catch {
          notificationSaved = false;
        }
      }

      // Update the supervisor interface using the saved data.
      setData({
        tasks: updatedTasks,
        teams: readArray(TEAMS_KEY),
      });

      setExpandedId(null);

      setFeedbackById((current) => {
        const next = { ...current };
        delete next[submissionId];
        return next;
      });

      setErrorById((current) => ({
        ...current,
        [submissionId]: "",
      }));

      const decisionMessage = isReviewed
        ? `The submission from ${
            updatedSubmission.studentName || "the student"
          } has been marked as reviewed.`
        : `A revision has been requested from ${
            updatedSubmission.studentName || "the student"
          }.`;

      setSuccessMessage(
        notificationSaved
          ? `${decisionMessage} A notification was sent to the student.`
          : `${decisionMessage} However, the notification could not be saved.`
      );
    } catch {
      setGeneralError(
        "Could not save this review in browser storage. Try again."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="supervisor-submissions-page">
      <header className="supervisor-submissions-header">
        <div>
          <span className="supervisor-submissions-eyebrow">
            TASK DELIVERABLES
          </span>

          <h2>Submissions &amp; Feedback</h2>

          <p>
            Review student task files, leave feedback, and request
            revisions when additional work is needed.
          </p>
        </div>

        <div className="supervisor-submissions-header-icon">
          <Files size={28} strokeWidth={1.7} />
        </div>
      </header>

      {successMessage && (
        <div
          className="supervisor-submissions-alert success"
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
          className="supervisor-submissions-alert error"
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
        className="supervisor-submissions-stats"
        aria-label="Submission statistics"
      >
        <article className="supervisor-submission-stat">
          <div className="supervisor-submission-stat-icon pending">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Pending Review</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting feedback</small>
          </div>
        </article>

        <article className="supervisor-submission-stat">
          <div className="supervisor-submission-stat-icon reviewed">
            <ClipboardCheck size={21} />
          </div>

          <div>
            <span>Reviewed</span>
            <strong>{reviewedCount}</strong>
            <small>Reviews completed</small>
          </div>
        </article>

        <article className="supervisor-submission-stat">
          <div className="supervisor-submission-stat-icon revisions">
            <MessageSquareText size={21} />
          </div>

          <div>
            <span>Changes Requested</span>
            <strong>{revisionCount}</strong>
            <small>Need further work</small>
          </div>
        </article>
      </section>

      <section className="supervisor-submissions-list-section">
        <div className="supervisor-submissions-list-heading">
          <div>
            <h3>Submitted Task Files</h3>

            <p>
              {filteredRecords.length}{" "}
              {filteredRecords.length === 1
                ? "submission"
                : "submissions"}{" "}
              found
            </p>
          </div>

          <button
            type="button"
            className="supervisor-submissions-refresh"
            onClick={refreshData}
            title="Refresh submissions"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="supervisor-submissions-toolbar">
          <label className="supervisor-submissions-search">
            <Search size={18} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search task, student, team, or file..."
              aria-label="Search submissions"
            />
          </label>

          <label className="supervisor-submissions-status-filter">
            <span>Status</span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter submissions by review status"
            >
              <option value="All">All statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Changes Requested">
                Changes Requested
              </option>
            </select>
          </label>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="supervisor-submissions-empty">
            <div className="supervisor-submissions-empty-icon">
              <FileText size={28} />
            </div>

            <h3>
              {records.length === 0
                ? "No task submissions yet"
                : "No matching submissions"}
            </h3>

            <p>
              {records.length === 0
                ? "When a student uploads a file for an assigned task, the submission will appear here."
                : "Try another search term or choose a different status."}
            </p>

            {records.length > 0 && (
              <button
                type="button"
                className="supervisor-submissions-clear"
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
          <div className="supervisor-submissions-list">
            {filteredRecords.map((record) => {
              const submission = record.submission;
              const status = record.reviewStatus;
              const isExpanded =
                expandedId === record.submissionId;
              const isSaving =
                savingId === record.submissionId;

              return (
                <article
                  className="supervisor-submission-card"
                  key={record.submissionId}
                >
                  <div className="supervisor-submission-main">
                    <div className="supervisor-submission-file-icon">
                      <FileText size={23} />
                    </div>

                    <div className="supervisor-submission-details">
                      <div className="supervisor-submission-topline">
                        <span className="supervisor-submission-team-chip">
                          {record.teamName}
                        </span>

                        <span
                          className={`supervisor-submission-status ${getStatusClass(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      <h4>{record.taskTitle}</h4>

                      {record.taskDescription && (
                        <p className="supervisor-submission-task-description">
                          {record.taskDescription}
                        </p>
                      )}

                      <div className="supervisor-submission-meta">
                        <span>
                          <UsersRound size={14} />
                          {submission.studentName || "Team Member"}
                        </span>

                        <span>
                          <CalendarDays size={14} />
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>

                      {record.dueDate && (
                        <p className="supervisor-submission-due-date">
                          Due date: {record.dueDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="supervisor-submission-file-row">
                    <div className="supervisor-submission-file-details">
                      <FileText size={19} />

                      <div>
                        <strong>
                          {submission.fileName || "Submitted file"}
                        </strong>

                        <span>
                          {formatFileSize(submission.fileSize)}
                        </span>
                      </div>
                    </div>

                    <a
                      className="supervisor-submission-download"
                      href={submission.fileData}
                      download={submission.fileName || "submission"}
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </a>
                  </div>

                  {submission.supervisorFeedback && (
                    <div className="supervisor-submission-existing-feedback">
                      <MessageSquareText size={17} />

                      <div>
                        <strong>Supervisor feedback</strong>

                        <p>{submission.supervisorFeedback}</p>

                        {submission.reviewedAt && (
                          <small>
                            Reviewed by{" "}
                            {submission.reviewedBy || "Supervisor"}
                            {" · "}
                            {formatDate(submission.reviewedAt)}
                          </small>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="supervisor-submission-card-footer">
                    <span>
                      {status === "Pending Review"
                        ? "Awaiting supervisor review"
                        : `Status: ${status}`}
                    </span>

                    <button
                      type="button"
                      className="supervisor-submission-review-toggle"
                      onClick={() => toggleReview(record)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded
                        ? "Close review"
                        : "Review submission"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="supervisor-submission-review-panel">
                      <div className="supervisor-submission-panel-title">
                        <MessageSquareText size={19} />

                        <div>
                          <h5>Feedback &amp; Review</h5>

                          <p>
                            Record the outcome of this task submission.
                            Feedback is required when requesting a revision.
                          </p>
                        </div>
                      </div>

                      <label
                        className="supervisor-submission-feedback-label"
                        htmlFor={`submission-feedback-${record.submissionId}`}
                      >
                        Feedback for the student
                      </label>

                      <textarea
                        id={`submission-feedback-${record.submissionId}`}
                        value={
                          feedbackById[record.submissionId] ??
                          submission.supervisorFeedback ??
                          ""
                        }
                        onChange={(event) =>
                          updateFeedback(
                            record.submissionId,
                            event.target.value
                          )
                        }
                        placeholder="Write feedback or explain what needs to be revised..."
                        rows={4}
                        maxLength={3000}
                      />

                      <div className="supervisor-submission-feedback-footer">
                        <span>
                          {
                            (
                              feedbackById[record.submissionId] ??
                              submission.supervisorFeedback ??
                              ""
                            ).length
                          }
                          /3000
                        </span>

                        {errorById[record.submissionId] && (
                          <span
                            className="supervisor-submission-inline-error"
                            role="alert"
                          >
                            {errorById[record.submissionId]}
                          </span>
                        )}
                      </div>

                      <div className="supervisor-submission-decision-buttons">
                        <button
                          type="button"
                          className="supervisor-submission-revision-button"
                          disabled={isSaving}
                          onClick={() =>
                            handleReview(
                              record,
                              "Changes Requested"
                            )
                          }
                        >
                          <MessageSquareText size={17} />
                          Request Revision
                        </button>

                        <button
                          type="button"
                          className="supervisor-submission-reviewed-button"
                          disabled={isSaving}
                          onClick={() =>
                            handleReview(record, "Reviewed")
                          }
                        >
                          <CheckCircle2 size={17} />
                          {isSaving
                            ? "Saving..."
                            : "Mark Reviewed"}
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

      <p className="supervisor-submissions-demo-note">
        Task submissions and review feedback are saved in this browser's
        local storage. Notifications are also stored locally. Backend
        authentication and multi-device synchronization are not connected.
      </p>
    </div>
  );
}

export default SupervisorSubmissions;
