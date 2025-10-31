"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function ManageStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [courseName, setCourseName] = useState("");
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadEnrollmentRequests(token);
  }, [courseId, router]);

  const loadEnrollmentRequests = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5050/api/courses/${courseId}/enrollment-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setEnrollmentRequests(data);
        if (data.length > 0) {
          setCourseName(data[0].courseTitle);
        }
      } else {
        const error = await res.json();
        alert(error.message || "Failed to load enrollment requests");
        router.push(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
      alert("Failed to load enrollment requests");
      router.push(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (enrollmentId: number, approve: boolean) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setProcessing(enrollmentId);
    try {
      const res = await fetch(
        "http://localhost:5050/api/courses/enrollment/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enrollmentId, approve }),
        }
      );

      if (res.ok) {
        alert(approve ? "Student approved!" : "Student rejected");
        // Remove the processed request from the list
        setEnrollmentRequests((prev) =>
          prev.filter((req) => req.id !== enrollmentId)
        );
      } else {
        const error = await res.json();
        alert(error.message || "Failed to process request");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      alert("Something went wrong");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading enrollment requests...</p>
        </div>
      </div>
    );
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

      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Manage Students
          </h1>
          <p className="mt-2 text-sm text-slate-600">{courseName}</p>
        </div>

        {enrollmentRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              No Pending Requests
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              All enrollment requests have been processed
            </p>
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
            >
              Back to Course
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {enrollmentRequests.length} Pending Request{enrollmentRequests.length !== 1 ? "s" : ""}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Review and approve or reject student enrollment requests below
                  </p>
                </div>
              </div>
            </div>

            {enrollmentRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:shadow-slate-200/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200">
                        <span className="text-base font-semibold text-slate-700">
                          {request.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {request.studentName}
                        </h3>
                        <p className="text-sm text-slate-600">{request.studentEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {request.groupClass && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {request.groupClass}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveReject(request.id, true)}
                      disabled={processing === request.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processing === request.id ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to reject ${request.studentName}?`)) {
                          handleApproveReject(request.id, false);
                        }
                      }}
                      disabled={processing === request.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}




