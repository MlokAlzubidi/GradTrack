import { useEffect, useState } from "react";
import { Check, X, UsersRound } from "lucide-react";
import { getSupervisorSession } from "../../utils/supervisorAuth";
import { ASSIGNMENT_REQUESTS_KEY, decideAssignment, readStorageArray, sameId } from "../../utils/supervisorAssignments";
import "./SupervisorAssignments.css";

export default function SupervisorAssignments() {
  const supervisor = getSupervisorSession();
  const [requests, setRequests] = useState(() => readStorageArray(ASSIGNMENT_REQUESTS_KEY));
  const [message, setMessage] = useState("");
  function refresh() { setRequests(readStorageArray(ASSIGNMENT_REQUESTS_KEY)); }
  useEffect(() => {
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  const inbox = requests.filter((request) => sameId(request.supervisorId, supervisor?.id));
  function decide(request, status) {
    const result = decideAssignment(request.id, supervisor?.id, status);
    setMessage(result.error || `Request ${status}.`);
    refresh();
  }
  return <section className="supervisor-assignments-page">
    <header><span>TEAM MANAGEMENT</span><h2>Assignment Requests</h2><p>Review requests addressed to your supervisor account.</p></header>
    {message && <p role="status" className="supervisor-assignment-message">{message}</p>}
    {inbox.length === 0 ? <div className="supervisor-assignment-empty"><UsersRound size={28}/><h3>No assignment requests</h3><p>New requests addressed to you will appear here.</p></div> : <div className="supervisor-assignment-list">{[...inbox].reverse().map((request) => <article className="supervisor-assignment-card" key={request.id}>
      <div><span className={`supervisor-assignment-status ${request.status}`}>{request.status}</span><h3>{request.teamName || "Student team"}</h3><p><strong>Project:</strong> {request.projectTitle || "Not registered"}</p><p><strong>Team leader:</strong> {request.leaderName || request.leaderId}</p><small>Requested {new Date(request.createdAt).toLocaleDateString()}</small></div>
      {request.status === "pending" && <div className="supervisor-assignment-actions"><button onClick={() => decide(request, "accepted")}><Check size={16}/> Accept</button><button onClick={() => decide(request, "rejected")}><X size={16}/> Decline</button></div>}
    </article>)}</div>}
  </section>;
}
