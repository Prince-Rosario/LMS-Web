"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  description: string;
  invitationCode: string;
};

export default function Home() {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
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
        body: JSON.stringify({ code: joinCode }),
      });

      console.log("SEX:",res)

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
  const fetchEnrollmentRequests = async (courseId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5050/api/Courses/${courseId}/enrollment-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch enrollment requests");
      const data = await res.json();
      console.log("Enrollment requests:", data);
      return data; // array of pending students
    } catch (err) {
      console.error(err);
      alert("Error loading enrollment requests");
    }
  };

  // Approve enrollment (teacher)
  const approveEnrollment = async (studentId: string, courseId: string) => {
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
          body: JSON.stringify({ studentId, courseId }),
        }
      );
      if (!res.ok) throw new Error("Failed to approve enrollment");
      alert("Student approved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error approving student");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white sticky top-0">
        <h1
          onClick={() => router.push("/")}
          className="text-2xl font-semibold cursor-pointer"
        >
          Edify
        </h1>

        {role ? (
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            Logout
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 font-medium hover:underline"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              Register
            </button>
          </div>
        )}
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {/* Heading */}
        <h2 className="text-xl font-semibold mb-4">
          {role
            ? role === "teacher"
              ? "Your Courses"
              : "Enrolled Courses"
            : "Explore Courses"}
        </h2>

        {/* Authenticated Section */}
        {role ? (
          <>
            {/* Action Section */}
            {role === "teacher" ? (
              <div className="border border-gray-200 rounded-xl p-4 mb-6 bg-white shadow-sm">
                <h3 className="text-lg font-medium mb-3">Create New Course</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Course Title"
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleCreateCourse}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4 mb-6 bg-white shadow-sm">
                <h3 className="text-lg font-medium mb-3">Join a Course</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter course code"
                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleJoinCourse}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all bg-white"
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {course.description}
                    </p>
                    <div className="text-sm font-medium text-blue-600">
                      Code: {course.invitationCode}
                    </div>

                    {role === "teacher" && (
                      <div className="mt-3 text-right">
                        <button
                          onClick={() => fetchEnrollmentRequests(course.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Requests
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-10 text-center">
                {role === "teacher"
                  ? "You haven’t created any courses yet."
                  : "You’re not enrolled in any courses yet."}
              </p>
            )}
          </>
        ) : (
          // Guest View
          <div className="text-center py-16">
            <p className="text-gray-600 mb-6 text-lg">
              Welcome to Edify — a simple LMS built inside Telegram.
            </p>
            <button
              onClick={() => router.push("/register")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
