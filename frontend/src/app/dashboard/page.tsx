"use client";
import { useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  description: string;
  code: string;
};

export default function DashboardPage() {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // Fetch user info + courses (placeholder)
  useEffect(() => {
    // Simulate API call
    const userRole = localStorage.getItem("role") as "student" | "teacher" | null;
    setRole(userRole);

    // Mock data (replace with real fetch)
    const mockCourses: Course[] = [
      { id: "1", title: "Web Development 101", description: "Intro to HTML, CSS, JS", code: "WEB123" },
      { id: "2", title: "Data Structures", description: "Learn arrays, stacks, queues", code: "DS456" },
    ];
    setCourses(mockCourses);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white sticky top-0">
        <h1 className="text-2xl font-semibold">LMS Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
        >
          Logout
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">
          {role === "teacher" ? "Your Courses" : "Enrolled Courses"}
        </h2>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all bg-white"
              >
                <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                <div className="text-sm font-medium text-blue-600">Code: {course.code}</div>

                {role === "teacher" && (
                  <div className="mt-3 text-right">
                    <button className="text-sm text-blue-600 hover:underline">
                      Manage Course
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
      </main>
    </div>
  );
}
