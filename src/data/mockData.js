export const mockStudents = [
  {
    universityId: "2023001",
    password: "123456",
    name: "Student One",
    role: "student",
    teamStatus: "no-team",
    teamId: null,
  },
  {
    universityId: "2023002",
    password: "123456",
    name: "Student Two",
    role: "student",
    teamStatus: "member",
    teamId: "team-001",
  },
  {
    universityId: "2023003",
    password: "123456",
    name: "Malak Mohammad",
    role: "student",
    teamStatus: "leader",
    teamId: "team-001",
  },
];


const REGISTERED_STUDENTS_KEY = "gradtrack-registered-students";

export function getRegisteredStudents() {
  try {
    const savedStudents = localStorage.getItem(
      REGISTERED_STUDENTS_KEY
    );

    return savedStudents ? JSON.parse(savedStudents) : [];
  } catch {
    return [];
  }
}


export function getAllMockStudents() {
  // الحسابات التجريبية الأصلية والحسابات المسجّلة حديثًا.
  const students = [
    ...mockStudents,
    ...getRegisteredStudents(),
  ];

  // حالات إضافية محفوظة حتى تبقى عضوية الطالب بعد تسجيل الخروج.
  const STUDENT_OVERRIDES_KEY = "gradtrack-student-overrides";

  let overrides = {};

  try {
    const savedOverrides = localStorage.getItem(
      STUDENT_OVERRIDES_KEY
    );

    overrides = savedOverrides
      ? JSON.parse(savedOverrides)
      : {};

    if (
      !overrides ||
      typeof overrides !== "object" ||
      Array.isArray(overrides)
    ) {
      overrides = {};
    }
  } catch {
    overrides = {};
  }

  // نطبّق حالة الفريق المحفوظة على كل حساب.
  return students.map((student) => ({
    ...student,
    ...(overrides[student.universityId] || {}),
  }));
}

export function registerMockStudent(newStudent) {
  const students = getAllMockStudents();

  const alreadyExists = students.some(
    (student) =>
      student.universityId === newStudent.universityId
  );

  if (alreadyExists) {
    return {
      success: false,
      message: "This university ID is already registered.",
    };
  }

  const registeredStudents = getRegisteredStudents();

  registeredStudents.push(newStudent);

  localStorage.setItem(
    REGISTERED_STUDENTS_KEY,
    JSON.stringify(registeredStudents)
  );

  return {
    success: true,
    student: newStudent,
  };
}

// Initialize consistent demo records for the built-in sample accounts.
// This runs only when the records are missing; it does not overwrite user-created teams or tasks.
export function ensureDemoDataInitialized() {
  const TEAMS_KEY = "gradtrack-teams";
  const TASKS_KEY = "gradtrack-team-tasks";

  try {
    const savedTeams = localStorage.getItem(TEAMS_KEY);
    let safeTeams = [];

    if (savedTeams) {
      try {
        const teams = JSON.parse(savedTeams);
        safeTeams = Array.isArray(teams) ? teams : [];
      } catch {
        safeTeams = [];
      }
    }

    // The built-in demo accounts 2023002 and 2023003 reference team-001.
    // Ensure that team record exists so My Team, Manage Tasks, and proposal pages agree.
    if (!safeTeams.some((team) => String(team.id) === "team-001")) {
      const demoTeam = {
        id: "team-001",
        name: "GradTrack Demo Team",
        leaderId: "2023003",
        leaderName: "Malak Mohammad",
        memberIds: ["2023003", "2023002"],
        members: [
          {
            id: "2023003",
            universityId: "2023003",
            name: "Malak Mohammad",
            role: "leader",
            joinedAt: "2026-10-28T00:00:00.000Z",
          },
          {
            id: "2023002",
            universityId: "2023002",
            name: "Student Two",
            role: "member",
            joinedAt: "2026-10-28T00:00:00.000Z",
          },
        ],
        invitations: [],
        createdAt: "2026-10-28T00:00:00.000Z",
        isDemo: true,
      };

      localStorage.setItem(
        TEAMS_KEY,
        JSON.stringify([demoTeam, ...safeTeams])
      );
    }

    // Seed a small set of tasks only when no task storage exists yet.
    // Existing user-created tasks are never overwritten.
    if (localStorage.getItem(TASKS_KEY) === null) {
      const demoTasks = [
        {
          id: "demo-task-1",
          teamId: "team-001",
          title: "Research Project Requirements",
          description:
            "Research the problem and prepare the initial requirements document.",
          assigneeId: "2023002",
          assigneeName: "Student Two",
          dueDate: "2026-11-05",
          status: "In Progress",
          createdBy: "2023003",
          createdAt: "2026-10-28T00:00:00.000Z",
          requiresSubmission: true,
          requiresSupervisorReview: true,
          submissions: [],
          submittedFile: "",
        },
        {
          id: "demo-task-2",
          teamId: "team-001",
          title: "Prepare Project Documentation",
          description:
            "Organize the project documentation and key decisions.",
          assigneeId: "2023003",
          assigneeName: "Malak Mohammad",
          dueDate: "2026-11-12",
          status: "To Do",
          createdBy: "2023003",
          createdAt: "2026-10-28T00:00:00.000Z",
          requiresSubmission: true,
          requiresSupervisorReview: false,
          submissions: [],
          submittedFile: "",
        },
      ];

      localStorage.setItem(TASKS_KEY, JSON.stringify(demoTasks));
    }

    return true;
  } catch {
    // The app can still run with empty demo data if browser storage is unavailable.
    return false;
  }
}

