"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/Toast";

type CreateCourseFormData = {
  title: string;
  description?: string;
};

export default function CreateCoursePage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCourseFormData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (data: CreateCourseFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.warning("Please login first");
        router.push("/login");
        return;
      }

      const res = await fetch("http://localhost:5050/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMessage = responseData.errors
          ? Object.values(responseData.errors).flat().join(", ")
          : responseData.message || "Course creation failed";
        toast.error(errorMessage);
        return;
      }

      toast.success(
        responseData.status === 0
          ? `Course "${responseData.title}" created! Pending admin approval.`
          : `Course "${responseData.title}" created successfully!`
      );
      router.push("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Create New Course
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Set up a new course for your students. All courses require admin approval before becoming active.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-900">
                Course Title
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                {...register("title", {
                  required: "Course title is required",
                  minLength: {
                    value: 3,
                    message: "Title must be at least 3 characters",
                  },
                  maxLength: {
                    value: 200,
                    message: "Title must not exceed 200 characters",
                  },
                })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Introduction to Programming"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-rose-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-900">
                Description
                <span className="ml-1.5 text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="description"
                {...register("description", {
                  maxLength: {
                    value: 1000,
                    message: "Description must not exceed 1000 characters",
                  },
                })}
                rows={5}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Provide a detailed description of what students will learn in this course..."
              />
              {errors.description && (
                <p className="mt-2 text-sm text-rose-600">{errors.description.message}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                A clear description helps students understand the course content and objectives
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">Admin Approval Required</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400"></span>
                      <span>Your course will be created with &quot;Pending&quot; status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400"></span>
                      <span>An admin will review and approve or reject your course</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400"></span>
                      <span>You&apos;ll receive a unique invitation code once approved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-400"></span>
                      <span>Students can only join approved courses</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Course"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}




