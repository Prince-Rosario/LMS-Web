"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-slate-900">Edify</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/register")}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Course management
            <br />
            made simple
          </h1>
          
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
            Create courses, share materials, and manage your classroom. 
            Built for educators and students who value simplicity.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/register")}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
            >
              Create Account
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-900 rounded-lg text-sm font-medium border border-slate-200"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="pb-20 pt-8">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Left Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">For Teachers</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create and organize courses with invitation codes
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Upload materials and share resources instantly
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Review and approve student enrollments
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Post announcements and updates to your class
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">For Students</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Join courses with simple invitation codes
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Access all course materials in one place
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Track your progress through course content
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Stay updated with course announcements
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm space-y-3">
                  {/* Mock Course Card */}
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Introduction to Computer Science</h4>
                        <p className="text-xs text-slate-500 mt-1">Prof. Sarah Johnson</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium">Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>24 materials</span>
                      <span>•</span>
                      <span>48 students</span>
                    </div>
                  </div>

                  {/* Mock Material List */}
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-slate-900 mb-3">Recent Materials</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">📚</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">Lecture 5: Data Structures</p>
                          <p className="text-xs text-slate-500">2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-rose-50 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">🎥</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">Algorithm Tutorial Video</p>
                          <p className="text-xs text-slate-500">5 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">📢</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">Midterm Exam Schedule</p>
                          <p className="text-xs text-slate-500">1 week ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Section */}
        <div className="pb-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Why educators choose Edify</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Fast Setup</h3>
              <p className="text-sm text-slate-600">Create a course and invite students in minutes, not hours</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Simple Interface</h3>
              <p className="text-sm text-slate-600">Clean design that gets out of your way and lets you focus</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Dual Roles</h3>
              <p className="text-sm text-slate-600">Be a teacher and student simultaneously, perfect for TAs</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="pb-20 text-center">
          <div className="border-t border-slate-200 pt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Ready to start teaching or learning?
            </h2>
            <p className="text-slate-600 mb-6">
              Join Edify and experience a cleaner way to manage your courses.
            </p>
            <button
              onClick={() => router.push("/register")}
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="text-sm text-slate-500 text-center">© 2024 Edify. Modern course management.</p>
        </div>
      </footer>
    </div>
  );
}