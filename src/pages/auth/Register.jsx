// نستورد useState حتى نخزّن القيم التي يكتبها المستخدم
// ونحدّثها كلما تغيّرت حقول الإدخال.
import { useState } from "react";

// Link للانتقال بين الصفحات، وuseNavigate للتوجيه برمجيًا
// بعد نجاح إنشاء الحساب.
import { Link, useNavigate } from "react-router-dom";

// نستورد الدالة المسؤولة عن إنشاء حساب تجريبي وحفظه محليًا.
import { registerMockStudent } from "../../data/mockData";

// نستورد ملف CSS الخاص بتصميم صفحة التسجيل.
import "./Register.css";

function Register() {
  // نستخدم navigate للانتقال إلى صفحة تسجيل الدخول
  // بعد إنشاء الحساب بنجاح.
  const navigate = useNavigate();

  // نخزّن اسم الطالب الذي يكتبه في حقل Full Name.
  const [name, setName] = useState("");

  // نخزّن الرقم الجامعي الذي يكتبه الطالب.
  const [universityId, setUniversityId] = useState("");

  // نخزّن كلمة المرور.
  const [password, setPassword] = useState("");

  // نخزّن كلمة المرور التي يكتبها الطالب للتأكيد.
  const [confirmPassword, setConfirmPassword] = useState("");

  // نخزّن رسالة الخطأ لعرضها للمستخدم عند وجود مشكلة.
  const [error, setError] = useState("");

  // تُنفّذ هذه الدالة عند إرسال نموذج التسجيل.
  function handleSubmit(event) {
    // نمنع المتصفح من إعادة تحميل الصفحة عند إرسال النموذج.
    event.preventDefault();

    // نمسح رسالة الخطأ السابقة عند إعادة المحاولة.
    setError("");

    // trim() تحذف المسافات الزائدة من بداية الاسم ونهايته.
    const trimmedName = name.trim();

    // نحذف المسافات الزائدة من الرقم الجامعي أيضًا.
    const trimmedUniversityId = universityId.trim();

    // نتأكد أن الاسم والرقم الجامعي ليسا فارغين
    // أو مكوّنين من مسافات فقط.
    if (!trimmedName || !trimmedUniversityId) {
      setError("Please enter your full name and university ID.");
      return; // نوقف التسجيل إذا كانت البيانات غير صحيحة.
    }

    // نقارن كلمة المرور مع كلمة المرور المؤكدة.
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return; // نوقف التسجيل إذا كانت كلمتا المرور مختلفتين.
    }

    // نرسل بيانات الطالب إلى دالة إنشاء الحساب التجريبي.
    const result = registerMockStudent({
      name: trimmedName,
      universityId: trimmedUniversityId,
      password: password,

      // كل حساب جديد يبدأ بدور Student.
      role: "student",

      // الطالب الجديد لا ينتمي إلى فريق في البداية.
      teamStatus: "no-team",

      // لا يوجد فريق مرتبط بالحساب الجديد.
      teamId: null,
    });

    // إذا فشلت عملية إنشاء الحساب، نعرض سبب الفشل.
    // مثلًا: إذا كان الرقم الجامعي مستخدمًا مسبقًا.
    if (!result.success) {
      setError(result.message);
      return;
    }

    // إذا نجح التسجيل، ننتقل إلى صفحة تسجيل الدخول
    // حتى يستطيع الطالب الدخول بالحساب الذي أنشأه.
    navigate("/login");
  }

  return (
    // العنصر الرئيسي الذي يحتوي صفحة التسجيل كاملة.
    <main className="register-page">
      {/* الحاوية التي تضم عنوان الصفحة والنموذج */}
      <section className="register-container">
        <h1>GradTrack</h1>

        {/* وصف النظام أسفل العنوان */}
        <p className="register-subtitle">
          Graduation Project Management System
        </p>

        <h2>Create Your Account</h2>

        <p>Register to get started with GradTrack.</p>

        {/* عند إرسال النموذج، يتم تنفيذ handleSubmit */}
        <form onSubmit={handleSubmit}>
          {/* حقل الاسم الكامل */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"

              // نربط قيمة الحقل بالمتغير name.
              value={name}

              // كلما كتب المستخدم حرفًا، نحدّث قيمة name.
              onChange={(event) => setName(event.target.value)}

              // يمنع إرسال النموذج إذا كان الحقل فارغًا.
              required
            />
          </div>

          {/* حقل الرقم الجامعي */}
          <div className="form-group">
            <label htmlFor="universityId">University ID</label>

            <input
              id="universityId"
              name="universityId"
              type="text"
              placeholder="Enter your university ID"
              autoComplete="username"

              // تعرض الرقم الجامعي المخزّن في الحالة.
              value={universityId}

              // تحدّث الرقم الجامعي عند الكتابة.
              onChange={(event) =>
                setUniversityId(event.target.value)
              }

              required
            />
          </div>

          {/* حقل كلمة المرور */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"

              // نربط حقل كلمة المرور بالمتغير password.
              value={password}

              // نحدّث كلمة المرور عند تغيير القيمة.
              onChange={(event) => setPassword(event.target.value)}

              required
            />
          </div>

          {/* حقل تأكيد كلمة المرور */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"

              // نربط الحقل بالمتغير confirmPassword.
              value={confirmPassword}

              // نحدّث القيمة عند الكتابة.
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }

              required
            />
          </div>

          {/* نعرض رسالة الخطأ فقط عندما تكون موجودة */}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {/* إرسال النموذج ومحاولة إنشاء الحساب */}
          <button type="submit">
            Create Account
          </button>
        </form>

        {/* رابط للطالب الذي لديه حساب مسبقًا */}
        <p className="login-link">
          Already have an account?{" "}
          <Link to="/login">Sign In</Link>
        </p>
      </section>
    </main>
  );
}

// نصدّر المكوّن حتى نستطيع استيراده واستخدامه في AppRoutes.jsx.
export default Register;