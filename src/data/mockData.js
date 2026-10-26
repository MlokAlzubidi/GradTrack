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
  return [...mockStudents, ...getRegisteredStudents()];
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
