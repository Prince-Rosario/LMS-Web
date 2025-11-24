"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";

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

type EnrolledStudent = {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  groupClass: string | null;
  enrolledAt: string;
};

export default function ManageStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<"pending" | "enrolled">("pending");
  const [courseName, setCourseName] = useState("");
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadData(token);
  }, [courseId, router]);

  const loadData = async (token: string) => {
    setLoading(true);
    try {
      // Load enrollment requests
      const requestsRes = await fetch(
        `http://localhost:5050/api/courses/${courseId}/enrollment-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setEnrollmentRequests(requestsData);
        if (requestsData.length > 0) {
          setCourseName(requestsData[0].courseTitle);
        }
      }

      // Load enrolled students
      const enrolledRes = await fetch(
        `http://localhost:5050/api/courses/${courseId}/enrolled-students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (enrolledRes.ok) {
        const enrolledData = await enrolledRes.json();
        setEnrolledStudents(enrolledData);
        if (enrolledData.length > 0 && !courseName) {
          setCourseName(enrolledData[0]?.courseTitle || "");
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load student data");
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
        toast.success(approve ? "Student approved!" : "Student rejected");
        setEnrollmentRequests((prev) =>
          prev.filter((req) => req.id !== enrollmentId)
        );
        // Reload enrolled students if approved
        if (approve) {
          loadData(token);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to process request");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("Something went wrong");
    } finally {
      setProcessing(null);
    }
  };

  const handleRemoveStudent = async (enrollmentId: number, studentName: string) => {
    const confirmed = await confirm({
      title: "Remove Student",
      message: `Are you sure you want to remove ${studentName} from this course? They will need to re-enroll to access the course again.`,
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setProcessing(enrollmentId);
    try {
      const res = await fetch(
        `http://localhost:5050/api/courses/enrollment/${enrollmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        toast.success("Student removed successfully");
        setEnrolledStudents((prev) =>
          prev.filter((student) => student.id !== enrollmentId)
        );
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to remove student");
      }
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Something went wrong");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading student data...</p>
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

        {/* Tabs */}
        <div className="mb-8 border-b border-slate-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "pending"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending Requests
              {enrollmentRequests.length > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {enrollmentRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "enrolled"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Enrolled Students
              <span className="ml-2 text-slate-500">({enrolledStudents.length})</span>
            </button>
          </nav>
        </div>

        {/* Pending Requests Tab */}
        {activeTab === "pending" && (
          <>
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
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Reject Student",
                              message: `Are you sure you want to reject ${request.studentName}'s enrollment request?`,
                              confirmText: "Reject",
                              cancelText: "Cancel",
                              variant: "warning",
                            });
                            if (confirmed) {
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
          </>
        )}

        {/* Enrolled Students Tab */}
        {activeTab === "enrolled" && (
          <>
            {enrolledStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <svg className="h-7 w-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-slate-900">
                  No Enrolled Students
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  No students are currently enrolled in this course
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                      <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {enrolledStudents.length} Enrolled Student{enrolledStudents.length !== 1 ? "s" : ""}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        All students currently enrolled in this course
                      </p>
                    </div>
                  </div>
                </div>

                {enrolledStudents.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:shadow-slate-200/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200">
                            <span className="text-base font-semibold text-slate-700">
                              {student.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {student.studentName}
                            </h3>
                            <p className="text-sm text-slate-600">{student.studentEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {student.groupClass && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {student.groupClass}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveStudent(student.id, student.studentName)}
                        disabled={processing === student.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processing === student.id ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Removing...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}