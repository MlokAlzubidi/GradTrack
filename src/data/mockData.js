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
