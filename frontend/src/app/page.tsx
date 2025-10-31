"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      // Redirect to dashboard if already authenticated
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">Edify</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="text-slate-700 hover:text-slate-900 px-4 py-2 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/register")}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-medium transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Hero */}
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Modern Learning Management System
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Empower Learning,
              <br />
              <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Amplify Teaching
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              A sophisticated platform designed for educators and learners. 
              Create courses, share materials, and track progress — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push("/register")}
                className="group px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Start for Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => router.push("/login")}
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-semibold transition-all border border-slate-200 shadow-sm"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {/* For Teachers */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For Teachers</h3>
              <p className="text-slate-600 leading-relaxed">
                Create engaging courses, upload materials, manage enrollments, and track student progress effortlessly.
              </p>
            </div>

            {/* For Students */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For Students</h3>
              <p className="text-slate-600 leading-relaxed">
                Access course materials, join classes with invitation codes, and stay organized with your learning journey.
              </p>
            </div>

            {/* Flexible Roles */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-violet-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Flexible Roles</h3>
              <p className="text-slate-600 leading-relaxed">
                Perfect for TAs and PhD students who both teach and learn. Choose one or both capabilities during signup.
              </p>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 text-white max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Everything You Need</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Course Management</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Create and organize courses with unique invitation codes
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Material Uploads</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Share PDFs, documents, and video links with students
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Enrollment Control</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Review and approve student enrollment requests
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Real-time Updates</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Stay synchronized with instant notifications and updates
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Join Edify today and experience a modern approach to learning management.
            </p>
            <button
              onClick={() => router.push("/register")}
              className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600">
          <p className="text-sm">© 2024 Edify. A modern learning management platform.</p>
        </div>
      </footer>
    </div>
  );
}
