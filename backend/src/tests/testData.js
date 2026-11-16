
export const studentData = {
    fullName: "Test Student",
    universityId: "2026000001",
    email: "student.test@example.com",
    password: "StudentPass123!",
    role: "student"
};

export const supervisorData = {
    fullName: "Test Supervisor",
    staffId: "900001",
    email: "supervisor.test@example.com",
    password: "SupervisorPass123!",
    role: "supervisor"
};

export const invalidStudentData = {
    fullName: "Test Student",
    universityId: "123",
    email: "invalid-email",
    password: "123",
    role: "student"
};

export const approvedStaffData = {
    staffId: "900001",
    isUsed: false,
    usedBy: null,
    usedAt: null
};
