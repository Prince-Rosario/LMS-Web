"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

enum UserRole {
  Student = 0,
  Teacher = 1,
}

type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  canTeach: boolean;
  canStudy: boolean;
  groupClass?: string;
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RegisterFormData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canTeach = watch("canTeach");
  const canStudy = watch("canStudy");

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    try {
      // Validate at least one capability is selected
      if (!data.canTeach && !data.canStudy) {
        setError("Please select at least one capability (Can Teach or Can Study)");
        setLoading(false);
        return;
      }

      const payload = {
        ...data,
        role: Number(data.role),
        canTeach: Boolean(data.canTeach),
        canStudy: Boolean(data.canStudy),
        groupClass: data.groupClass || "",
      };

      const res = await fetch("http://localhost:5050/api/Auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMessage = responseData.errors
          ? Object.values(responseData.errors).flat().join(", ")
          : responseData.message || "Registration failed";
        setError(errorMessage);
        return;
      }

      localStorage.setItem("token", responseData.token);
      localStorage.setItem("user", JSON.stringify(responseData));
      window.dispatchEvent(new Event("authChanged"));
      reset();

      // Redirect based on role
      if (responseData.role === 2) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">Edify</span>
            </button>

            <button
              onClick={() => router.push("/")}
              className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Register Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-slate-600">
              Join Edify and start your learning journey
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-rose-900">{error}</p>
                  </div>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    {...register("firstName", { required: "First name is required" })}
                    className={`w-full px-4 py-3 bg-white border ${
                      errors.firstName ? 'border-rose-300' : 'border-slate-300'
                    } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-2 text-xs text-rose-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    {...register("lastName", { required: "Last name is required" })}
                    className={`w-full px-4 py-3 bg-white border ${
                      errors.lastName ? 'border-rose-300' : 'border-slate-300'
                    } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-2 text-xs text-rose-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className={`w-full px-4 py-3 bg-white border ${
                    errors.email ? 'border-rose-300' : 'border-slate-300'
                  } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-xs text-rose-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" },
                  })}
                  className={`w-full px-4 py-3 bg-white border ${
                    errors.password ? 'border-rose-300' : 'border-slate-300'
                  } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-2 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              {/* Primary Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Role
                </label>
                <select
                  id="role"
                  {...register("role", { required: "Select a role" })}
                  className={`w-full px-4 py-3 bg-white border ${
                    errors.role ? 'border-rose-300' : 'border-slate-300'
                  } rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all`}
                >
                  <option value="">Select your primary role</option>
                  <option value={UserRole.Student}>Student</option>
                  <option value={UserRole.Teacher}>Teacher</option>
                </select>
                {errors.role && (
                  <p className="mt-2 text-xs text-rose-600">{errors.role.message}</p>
                )}
              </div>

              {/* Capabilities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  What would you like to do? <span className="text-slate-500">(Select at least one)</span>
                </label>
                
                <div className="space-y-3">
                  {/* Can Teach */}
                  <label 
                    htmlFor="canTeach" 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      canTeach 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="canTeach"
                      {...register("canTeach")}
                      className="mt-0.5 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="font-semibold text-slate-900">I want to teach</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Create courses, upload materials, and manage students
                      </p>
                    </div>
                  </label>

                  {/* Can Study */}
                  <label 
                    htmlFor="canStudy" 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      canStudy 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="canStudy"
                      {...register("canStudy")}
                      className="mt-0.5 w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-semibold text-slate-900">I want to learn</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Join courses, access materials, and track your progress
                      </p>
                    </div>
                  </label>
                </div>

                <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  💡 <span className="font-medium">Tip:</span> PhD students and teaching assistants can select both options
                </p>
              </div>

              {/* Group/Class Field */}
              <div>
                <label htmlFor="groupClass" className="block text-sm font-medium text-slate-700 mb-2">
                  Group / Class <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="groupClass"
                  type="text"
                  {...register("groupClass")}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  placeholder="e.g., CS-2024-A, PhD-2024"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-slate-900 font-semibold hover:underline"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}