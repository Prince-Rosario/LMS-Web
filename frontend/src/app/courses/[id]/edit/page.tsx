"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/Toast";

type EditCourseFormData = {
  title: string;
  description?: string;
};

type Course = {
  id: number;
  title: string;
  description?: string;
  invitationCode: string;
  status: number;
};

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EditCourseFormData>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadCourse(token);
  }, [courseId, router]);

  const loadCourse = async (token: string) => {
    setLoading(true);
    try {
      // Get all teacher courses
      const res = await fetch("http://localhost:5050/api/courses/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const courses = await res.json();
        const foundCourse = courses.find((c: any) => c.id === parseInt(courseId));

        if (foundCourse) {
          // Check if this is actually the user's teaching course by checking teacherId
          const userData = JSON.parse(localStorage.getItem("user") || "{}");
          
          if (foundCourse.teacherId && foundCourse.teacherId !== userData.userId) {
            toast.error("You don't have permission to edit this course");
            router.push(`/courses/${courseId}`);
            return;
          }

          setCourse(foundCourse);
          setValue("title", foundCourse.title);
          setValue("description", foundCourse.description || "");
        } else {
          toast.error("Course not found or you don't have permission to edit it");
          router.push("/dashboard");
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to load course");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to load course:", error);
      toast.error("Failed to load course");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditCourseFormData) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`http://localhost:5050/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || "",
        }),
      });

      if (res.ok) {
        toast.success("Course updated successfully!");
        router.push(`/courses/${courseId}`);
      } else {
        const error = await res.json();
        const errorMessage = error.errors
          ? Object.values(error.errors).flat().join(", ")
          : error.message || "Failed to update course";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Course
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Edit Course
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Update your course information and settings
          </p>
        </div>

        {/* Status Alert */}
        {course.status === 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">Course Pending Approval</h3>
                <p className="mt-1 text-sm text-amber-700">
                  This course is awaiting admin approval. You can still edit the details, but students won&apos;t be able to join until it&apos;s approved.
                </p>
              </div>
            </div>
          </div>
        )}

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
                rows={6}
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

            {/* Course Info (Read-only) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Course Information
                <span className="ml-2 text-xs font-normal text-slate-500">(Read-only)</span>
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600">Invitation Code</p>
                  <p className="rounded-lg bg-white px-3 py-2 font-mono text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
                    {course.invitationCode}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600">Status</p>
                  <div className="py-2">
                    {course.status === 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Pending
                      </span>
                    )}
                    {course.status === 1 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Approved
                      </span>
                    )}
                    {course.status === 2 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Invitation code and approval status cannot be changed
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/courses/${courseId}`)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

