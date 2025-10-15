"use client";
import { useRouter } from "next/navigation";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(token);
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userData);
      const roleValue = user.role; // 0 = student, 1 = teacher
      setRole(roleValue === 1 ? "teacher" : "student");

      // Fetch courses after setting role
      fetchCourses(token);
    } catch (err) {
      console.error("Error parsing user data:", err);
      router.push("/login");
    }
  }, []);

  const fetchCourses = async (token: string | null) => {
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
    localStorage.removeItem("role");
    router.push("/login");
  };

  const handleCreateCourse = async () => {
    if (!title.trim() || !description.trim()) return alert("Fill all fields");

    const token = localStorage.getItem("token");
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
      console.log(res);
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

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5050/api/Courses/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: joinCode }),
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

      <main className="p-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">
          {role === "teacher" ? "Your Courses" : "Enrolled Courses"}
        </h2>

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

        {/* Courses List */}
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
