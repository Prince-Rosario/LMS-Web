"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  description: string;
  invitationCode: string;
};

type EnrollmentRequest = {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  groupClass: string | null;
  courseId: number;
  courseTitle: string;
  status: number;
  requestedAt: string;
};

export default function Home() {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateAuth = () => {
      const savedToken = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      setToken(savedToken);

      if (savedToken && userData) {
        try {
          const user = JSON.parse(userData);
          const roleValue = user.role;
          if (roleValue === 1 || roleValue === "Teacher" || roleValue === "teacher") {
            setRole("teacher");
          } else {
            setRole("student");
          }
          // fetch courses if token exists
          fetchCourses(savedToken);
        } catch (err) {
          console.error("Error parsing user data:", err);
          setRole(null);
        }
      } else {
        // not logged in
        setRole(null);
        setCourses([]);
      }
    };

    // run once on mount
    updateAuth();

    // listen for custom event dispatched after login/register/logout
    const handler = () => updateAuth();
    window.addEventListener("authChanged", handler);

    // also listen for storage event for cross-tab changes (fires in other tabs)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") updateAuth();
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("authChanged", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const fetchCourses = async (token: string | null) => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5050/api/Courses/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();
      setCourses(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    router.push("/");
  };

  const handleCreateCourse = async () => {
    if (!title.trim() || !description.trim()) return alert("Fill all fields");

    try {
      const res = await fetch("http://localhost:5050/api/Courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (!res.ok) throw new Error("Failed to create course");
      alert("Course created successfully!");
      setTitle("");
      setDescription("");
      fetchCourses(token);
    } catch (err) {
      console.error(err);
      alert("Error creating course");
    }
  };

  const handleJoinCourse = async () => {
    if (!joinCode.trim()) return alert("Enter a valid code");

    try {
      const res = await fetch("http://localhost:5050/api/Courses/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invitationCode: joinCode }),
      });

      if (!res.ok) throw new Error("Failed to join course");
      alert("Joined course successfully!");
      setJoinCode("");
      fetchCourses(token);
    } catch (err) {
      console.error(err);
      alert("Error joining course");
    }
  };

  // Fetch enrollment requests (for teacher)
  const fetchEnrollmentRequests = async (course: Course) => {
    setSelectedCourse(course);
    setShowRequestsModal(true);
    setLoadingRequests(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5050/api/Courses/${course.id}/enrollment-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch enrollment requests");
      const data = await res.json();
      setEnrollmentRequests(data || []);
    } catch (err) {
      console.error(err);
      alert("Error loading enrollment requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  // Approve enrollment (teacher)
  const handleEnrollmentAction = async (enrollmentId: number, approve: boolean) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        "http://localhost:5050/api/Courses/enrollment/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enrollmentId, approve }),
        }
      );
      if (!res.ok) throw new Error("Failed to process enrollment");

      // Remove the processed request from the list
      setEnrollmentRequests(prev => prev.filter(req => req.id !== enrollmentId));

      // Show success message
      const message = approve ? "Student approved successfully!" : "Student rejected successfully!";
      alert(message);
    } catch (err) {
      console.error(err);
      alert("Error processing enrollment");
    }
  };

  const closeModal = () => {
    setShowRequestsModal(false);
    setSelectedCourse(null);
    setEnrollmentRequests([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1
              onClick={() => router.push("/")}
              className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors"
            >
              Edify
            </h1>

            {role ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 hidden sm:block">
                  {role === "teacher" ? "Teacher" : "Student"}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/login")}
                  className="text-slate-700 font-medium hover:text-blue-600 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg transition-all font-medium"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Authenticated Section */}
        {role ? (
          <>
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {role === "teacher" ? "My Courses" : "My Learning"}
              </h2>
              <p className="text-slate-600">
                {role === "teacher"
                  ? "Manage your courses and enrollment requests"
                  : "View your enrolled courses and join new ones"}
              </p>
            </div>

            {/* Action Section */}
            {role === "teacher" ? (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Course
                </h3>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Course title (e.g., Introduction to React)"
                    className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of what students will learn..."
                    rows={3}
                    className="border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                  <button
                    onClick={handleCreateCourse}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg self-end"
                  >
                    Create Course
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Join a Course
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter invitation code"
                    className="border border-slate-300 rounded-xl px-4 py-3 flex-1 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                  />
                  <button
                    onClick={handleJoinCourse}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Join
                  </button>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span className="text-sm font-mono font-semibold text-slate-700">
                        {course.invitationCode}
                      </span>
                    </div>

                    {role === "teacher" && (
                      <button
                        onClick={() => fetchEnrollmentRequests(course)}
                        className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        View Requests
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses yet</h3>
                <p className="text-slate-600">
                  {role === "teacher"
                    ? "Create your first course to get started"
                    : "Join a course using an invitation code"}
                </p>
              </div>
            )}
          </>
        ) : (
          // Guest View
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                Welcome to Edify
              </h2>
              <p className="text-slate-600 mb-8 text-lg">
                A modern learning management system for teachers and students
              </p>
              <button
                onClick={() => router.push("/register")}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Enrollment Requests Modal */}
      {showRequestsModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Enrollment Requests</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedCourse.title}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(80vh-88px)]">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : enrollmentRequests.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {enrollmentRequests.map((request) => (
                    <div key={request.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-slate-700 font-semibold text-sm">
                                {request.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 truncate">{request.studentName}</h4>
                              <p className="text-sm text-slate-600 truncate">{request.studentEmail}</p>
                            </div>
                          </div>
                          {request.groupClass && (
                            <div className="ml-13 mb-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-700">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {request.groupClass}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-slate-500 ml-13">
                            Requested {new Date(request.requestedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEnrollmentAction(request.id, true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </button>
                          <button
                            onClick={() => handleEnrollmentAction(request.id, false)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">No pending requests</h4>
                  <p className="text-sm text-slate-600 text-center">
                    There are no enrollment requests for this course at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
