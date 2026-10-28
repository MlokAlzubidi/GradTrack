import { Link } from "react-router-dom";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { getAllMockStudents } from "../../data/mockData";
import "./MyTeam.css";

const CURRENT_STUDENT_KEY = "gradtrack-current-student";
const TEAMS_STORAGE_KEY = "gradtrack-teams";
const MAX_TEAM_MEMBERS = 4;

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

// قراءة بيانات الفرق المشتركة.
function readTeams() {
  try {
    const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);

    if (!savedTeams) {
      return [];
    }

    const teams = JSON.parse(savedTeams);
    return Array.isArray(teams) ? teams : [];
  } catch {
    return [];
  }
}

// توحيد معرفات أعضاء الفريق، مع منع تكرار الطالب.
function getTeamMemberIds(team) {
  if (!team) return [];

  return [
    ...new Set(
      [
        team.leaderId,
        ...(Array.isArray(team.memberIds) ? team.memberIds : []),
        ...(Array.isArray(team.members)
          ? team.members.map(
              (member) => member.universityId || member.id
            )
          : []),
      ].filter(Boolean)
    ),
  ];
}

function loadMyTeamData() {
  const student = readCurrentStudent();

  if (!student?.universityId) {
    return {
      student: null,
      team: null,
      members: [],
      teamStatus: "no-team",
      error: "",
    };
  }

  const teams = readTeams();

  // البحث باستخدام teamId أولًا.
  // وإذا لم يكن محفوظًا، نبحث عن الفريق الذي يحتوي على الرقم الجامعي.
  const team =
    teams.find((item) => item.id === student.teamId) ||
    teams.find((item) =>
      getTeamMemberIds(item).includes(student.universityId)
    );

  if (!team) {
    return {
      student,
      team: null,
      members: [],
      teamStatus: "no-team",
      error: "",
    };
  }

  // تحديد حالة الطالب من عضويته الفعلية داخل الفريق.
  const teamStatus =
    team.leaderId === student.universityId
      ? "leader"
      : "member";

  // أسماء الحسابات المعروفة في بيانات التجربة.
  const allStudents = getAllMockStudents();

  const savedMembers = Array.isArray(team.members)
    ? team.members
    : [];

  // بناء قائمة موحدة للأعضاء اعتمادًا على معرفاتهم الفعلية.
  const members = getTeamMemberIds(team).map((memberId) => {
    const savedMember = savedMembers.find(
      (member) =>
        (member.universityId || member.id) === memberId
    );

    const account = allStudents.find(
      (item) => item.universityId === memberId
    );

    const isLeader = memberId === team.leaderId;

    return {
      id: memberId,
      universityId: memberId,
      name:
        savedMember?.name ||
        account?.name ||
        (isLeader ? team.leaderName : null) ||
        "Student",
      role: isLeader ? "Team Leader" : "Member",
    };
  });

  return {
    student,
    team,
    members,
    teamStatus,
    error: "",
  };
}

function MyTeam() {
  const { student, team, members, teamStatus, error } =
    loadMyTeamData();

  const leaderName =
    team?.leaderName ||
    members.find((member) => member.role === "Team Leader")?.name ||
    "Team Leader";

  return (
    <div className="my-team-page student-layout">
      <StudentNavbar teamStatus={teamStatus} />

      <main className="my-team-content">
        <header className="my-team-header">
          <p className="my-team-eyebrow">TEAM MANAGEMENT</p>

          <h1>My Team</h1>

          <p>
            View your graduation team, its members, and team
            information.
          </p>
        </header>

        {error ? (
          <section className="my-team-details">
            <h2>Unable to Load Team</h2>
            <p>{error}</p>
          </section>
        ) : !team ? (
          <section className="my-team-empty">
            <div
              className="my-team-empty-icon"
              aria-hidden="true"
            >
              🎓
            </div>

            <h2>You are not part of a team yet</h2>

            <p>
              Create a new team or check your invitations to get
              started with your graduation project.
            </p>

            <div className="my-team-actions">
              {student?.teamStatus !== "leader" &&
                student?.teamStatus !== "member" && (
                  <Link
                    to="/student/create-team"
                    className="my-team-secondary-link"
                  >
                    Create Team
                  </Link>
                )}

              <Link
                to="/student/invitations"
                className="my-team-secondary-link"
              >
                View Invitations
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="my-team-details">
              <div className="my-team-details-heading">
                <div>
                  <p className="my-team-eyebrow">YOUR TEAM</p>
                  <h2>{team.name}</h2>
                  <p>Team Leader: {leaderName}</p>
                </div>

                <div className="my-team-capacity">
                  <span>Team Size</span>
                  <strong>
                    {members.length} / {MAX_TEAM_MEMBERS}
                  </strong>
                </div>
              </div>

              <div className="my-team-role-note">
                You are{" "}
                <strong>
                  {teamStatus === "leader"
                    ? "the Team Leader"
                    : "a Team Member"}
                </strong>
                .
              </div>
            </section>

            <section className="my-team-members-section">
              <div className="my-team-members-heading">
                <h2>Team Members</h2>

                <span>
                  {members.length}{" "}
                  {members.length === 1 ? "student" : "students"}
                </span>
              </div>

              <div className="my-team-members-list">
                {members.map((member) => (
                  <article
                    className="my-team-member-card"
                    key={member.universityId}
                  >
                    <div
                      className="my-team-member-avatar"
                      aria-hidden="true"
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="my-team-member-info">
                      <h3>{member.name}</h3>
                      <p>
                        University ID: {member.universityId}
                      </p>
                    </div>

                    <span
                      className={
                        member.role === "Team Leader"
                          ? "my-team-member-role leader"
                          : "my-team-member-role"
                      }
                    >
                      {member.role}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <p className="my-team-demo-note">
          Team information is currently loaded from local demo data.
        </p>
      </main>
    </div>
  );
}

export default MyTeam;