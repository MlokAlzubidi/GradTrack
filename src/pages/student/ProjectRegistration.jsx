import { useState } from "react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import "./ProjectRegistration.css";


function ProjectRegistration() {
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDomain, setProjectDomain] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !projectTitle.trim() ||
      !projectDomain ||
      !projectDescription.trim()
    ) {
      setMessage("Please complete all required fields.");
      return;
    }

    setMessage(
      "Form completed successfully. Backend integration is still required."
    );
  }

  return (
    <div className="project-registration-page student-layout">
      <StudentNavbar teamStatus="leader" />

      <main className="project-registration-content">
        <header className="project-registration-header">
          <p className="project-registration-eyebrow">
            GRADUATION PROJECT
          </p>

          <h1>Project Registration</h1>

          <p>
            Register your team's graduation project before
            submitting the proposal for supervisor review.
          </p>
        </header>

        <section className="project-registration-card">
          <h2>Project Information</h2>

          <p>
            Enter the basic information about your team's project.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="project-registration-field">
              <label htmlFor="projectTitle">Project Title</label>

              <input
                id="projectTitle"
                type="text"
                value={projectTitle}
                onChange={(event) => {
                  setProjectTitle(event.target.value);
                  setMessage("");
                }}
                placeholder="Enter your project title"
                maxLength={150}
                required
              />
            </div>

            <div className="project-registration-field">
              <label htmlFor="projectDomain">Project Domain</label>

              <select
                id="projectDomain"
                value={projectDomain}
                onChange={(event) => {
                  setProjectDomain(event.target.value);
                  setMessage("");
                }}
                required
              >
                <option value="">Select a domain</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Software Engineering">
                  Software Engineering
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="project-registration-field">
              <label htmlFor="projectDescription">
                Project Description
              </label>

              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(event) => {
                  setProjectDescription(event.target.value);
                  setMessage("");
                }}
                placeholder="Describe the project idea and the problem it addresses"
                rows={5}
                maxLength={3000}
                required
              />
            </div>

            <button type="submit">Register Project</button>

            {message && (
              <p className="project-registration-message" role="status">
                {message}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default ProjectRegistration;