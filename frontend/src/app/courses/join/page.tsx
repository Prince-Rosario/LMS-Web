"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/Toast";

type JoinCourseFormData = {
  invitationCode: string;
};

export default function JoinCoursePage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinCourseFormData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (data: JoinCourseFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.warning("Please login first");
        router.push("/login");
        return;
      }

      const res = await fetch("http://localhost:5050/api/courses/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invitationCode: data.invitationCode.trim().toUpperCase(),
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMessage = responseData.errors
          ? Object.values(responseData.errors).flat().join(", ")
          : responseData.message || "Failed to join course";
        toast.error(errorMessage);
        return;
      }

      toast.success(
        responseData.status === 0
          ? `Request sent for "${responseData.courseTitle}"! Awaiting teacher approval.`
          : `Successfully joined "${responseData.courseTitle}"!`
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

      <main className="mx-auto max-w-2xl px-6 py-12 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Join a Course
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the invitation code provided by your instructor
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Invitation Code Field */}
            <div>
              <label htmlFor="invitationCode" className="mb-3 block text-center text-sm font-medium text-slate-900">
                Invitation Code
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <input
                id="invitationCode"
                type="text"
                {...register("invitationCode", {
                  required: "Invitation code is required",
                  minLength: {
                    value: 6,
                    message: "Invitation code must be at least 6 characters",
                  },
                  pattern: {
                    value: /^[A-Z0-9]+$/i,
                    message: "Invitation code contains only letters and numbers",
                  },
                })}
                className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-center text-2xl font-mono font-semibold uppercase tracking-wider text-slate-900 placeholder-slate-300 transition-colors focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                placeholder="ABC123"
                maxLength={10}
                style={{ textTransform: "uppercase" }}
              />
              {errors.invitationCode && (
                <p className="mt-2 text-center text-sm text-rose-600">
                  {errors.invitationCode.message}
                </p>
              )}
              <p className="mt-2 text-center text-xs text-slate-500">
                Case-insensitive • Letters and numbers only
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
                  <h3 className="text-sm font-semibold text-slate-900">How it works</h3>
                  <ol className="mt-2 space-y-1.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">1</span>
                      <span>Get the invitation code from your instructor</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">2</span>
                      <span>Enter the code above to send an enrollment request</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">3</span>
                      <span>Wait for instructor approval</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">4</span>
                      <span>Access course materials once approved</span>
                    </li>
                  </ol>
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
                    Joining...
                  </span>
                ) : (
                  "Join Course"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Example Hint */}
        <div className="mt-6 rounded-lg bg-slate-100 p-4 text-center">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Example:</span> If your instructor shared{" "}
            <code className="rounded bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-900">
              ABC123
            </code>
            , enter it above
          </p>
        </div>
      </main>
    </div>
  );
}




