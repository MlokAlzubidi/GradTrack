import { Link } from "react-router-dom";
import {
  GraduationCap,
  ArrowUpRight,
  UsersRound,
  BookOpenCheck,
  Sparkles,
  Check,
} from "lucide-react";
import "./RoleSelection.css";

function RoleSelection() {
  return (
    <main className="role-selection-page">
      <div className="role-selection-decoration decoration-one" />
      <div className="role-selection-decoration decoration-two" />

      <section className="role-selection-shell">
        {/* Left brand panel */}
        <aside className="role-brand-panel">
          <div className="role-brand-top">
            <Link to="/" className="role-brand" aria-label="GradTrack home">
              <span className="role-brand-mark">
                <GraduationCap size={27} strokeWidth={1.8} />
              </span>

              <span className="role-brand-name">
                Grad<span>Track</span>
              </span>
            </Link>

            <span className="role-brand-tag">
              <span className="role-live-dot" />
              STUDENT SUCCESS PLATFORM
            </span>
          </div>

          <div className="role-brand-copy">
            <p className="role-brand-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </p>

            <h1>
              Your ideas.
              <br />
              Your team.
              <br />
              <span>Your graduation.</span>
            </h1>

            <p className="role-brand-description">
              A clearer way to organize your graduation project,
              collaborate with your team, and keep your work moving
              forward.
            </p>
          </div>

          {/* Decorative project journey card */}
          <div className="role-journey-card">
            <div className="role-journey-card-header">
              <div className="role-journey-icon">
                <BookOpenCheck size={20} />
              </div>

              <div>
                <span className="role-journey-label">
                  YOUR ACADEMIC JOURNEY
                </span>
                <p>From proposal to graduation</p>
              </div>

              <Sparkles
                className="role-journey-sparkle"
                size={20}
              />
            </div>

            <div className="role-journey-steps">
              <div className="role-journey-step completed">
                <span className="role-step-marker">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Plan</span>
              </div>

              <span className="role-journey-line" />

              <div className="role-journey-step current">
                <span className="role-step-marker">
                  <UsersRound size={12} />
                </span>
                <span>Collaborate</span>
              </div>

              <span className="role-journey-line" />

              <div className="role-journey-step">
                <span className="role-step-marker">
                  <GraduationCap size={13} />
                </span>
                <span>Graduate</span>
              </div>
            </div>

            <div className="role-journey-footer">
              <span>One workspace</span>
              <span className="role-footer-separator" />
              <span>One shared goal</span>
            </div>
          </div>

          <div className="role-brand-footer">
            <span className="role-footer-line" />
            <p>Built around your graduation journey.</p>
          </div>

          {/* Decorative background elements */}
          <div className="role-orbit orbit-one" />
          <div className="role-orbit orbit-two" />
          <div className="role-brand-watermark" aria-hidden="true">
            <GraduationCap size={210} strokeWidth={0.65} />
          </div>
        </aside>

        {/* Right account selection panel */}
        <section className="role-choice-panel">
          <div className="role-choice-topline">
            <span className="role-choice-overline">
              WELCOME TO GRADTRACK
            </span>

            <span className="role-choice-step">
              <span className="role-choice-step-dot" />
              GET STARTED
            </span>
          </div>

          <div className="role-choice-heading">
            <h2>
              Let’s get you
              <br />
              <span>where you belong.</span>
            </h2>

            <p>
              Choose your account type to access your personalized
              workspace.
            </p>
          </div>

          <div className="role-options">
            <Link to="/login" className="role-option role-option-student">
              <div className="role-option-top">
                <div className="role-option-icon student-option-icon">
                  <GraduationCap size={25} strokeWidth={1.8} />
                </div>

                <span className="role-option-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </div>

              <div className="role-option-content">
                <span className="role-option-kicker">
                  FOR STUDENTS
                </span>

                <h3>Student</h3>

                <p>
                  Organize your tasks, manage your team, and follow
                  your graduation project from start to submission.
                </p>
              </div>

              <div className="role-option-bottom">
                <span>Continue as a student</span>
                <ArrowUpRight size={16} />
              </div>
            </Link>

            <Link
              to="/supervisor/login"
              className="role-option role-option-supervisor"
            >
              <div className="role-option-top">
                <div className="role-option-icon supervisor-option-icon">
                  <BookOpenCheck size={24} strokeWidth={1.8} />
                </div>

                <span className="role-option-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </div>

              <div className="role-option-content">
                <span className="role-option-kicker">
                  FOR FACULTY
                </span>

                <h3>Academic Supervisor</h3>

                <p>
                  Review project proposals, provide feedback, and
                  monitor graduation project progress.
                </p>
              </div>

              <div className="role-option-bottom">
                <span>Continue as a supervisor</span>
                <ArrowUpRight size={16} />
              </div>
            </Link>
          </div>

          <div className="role-choice-footer">
            <span className="role-footer-shield">
              <Check size={14} strokeWidth={2.5} />
            </span>

            <p>
              A dedicated workspace for every role in your
              graduation journey.
            </p>
          </div>
        </section>
      </section>

      <footer className="role-page-footer">
        <span>GRADTRACK</span>
        <span className="role-page-footer-dot" />
        <span>GRADUATION PROJECT MANAGEMENT SYSTEM</span>
      </footer>
    </main>
  );
}

export default RoleSelection;