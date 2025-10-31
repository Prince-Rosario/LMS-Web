"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserData = {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: number;
    canTeach: boolean;
    canStudy: boolean;
};

type Course = {
    id: number;
    title: string;
    description?: string;
    invitationCode: string;
    teacherName: string;
    teacherId: number;
    status: number; // 0=Pending, 1=Approved, 2=Rejected
    rejectionReason?: string;
    createdAt: string;
    approvedAt?: string;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectingCourseId, setRejectingCourseId] = useState<number | null>(null);
    const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!userData || !token) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userData);

        // Check if user is admin
        if (parsedUser.role !== 2) {
            router.push("/dashboard");
            return;
        }

        setUser(parsedUser);
        loadData(token);
    }, [router]);

    const loadData = async (token: string) => {
        setLoading(true);
        try {
            // Load pending courses
            const pendingRes = await fetch("http://localhost:5050/api/courses/admin/pending", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (pendingRes.ok) {
                const pendingData = await pendingRes.json();
                setPendingCourses(pendingData);
            }

            // Load all courses
            const allRes = await fetch("http://localhost:5050/api/courses/admin/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (allRes.ok) {
                const allData = await allRes.json();
                setAllCourses(allData);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveCourse = async (courseId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setProcessingId(courseId);
        try {
            const res = await fetch("http://localhost:5050/api/courses/admin/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    courseId,
                    approve: true,
                    rejectionReason: null,
                }),
            });

            if (res.ok) {
                loadData(token);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to approve course");
            }
        } catch (error) {
            console.error("Error approving course:", error);
            alert("Something went wrong");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectCourse = async (courseId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason");
            return;
        }

        setProcessingId(courseId);
        try {
            const res = await fetch("http://localhost:5050/api/courses/admin/approve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    courseId,
                    approve: false,
                    rejectionReason: rejectionReason.trim(),
                }),
            });

            if (res.ok) {
                setRejectingCourseId(null);
                setRejectionReason("");
                loadData(token);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to reject course");
            }
        } catch (error) {
            console.error("Error rejecting course:", error);
            alert("Something went wrong");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteCourse = async (courseId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setProcessingId(courseId);
        try {
            const res = await fetch(`http://localhost:5050/api/courses/admin/${courseId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setDeletingCourseId(null);
                loadData(token);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to delete course");
            }
        } catch (error) {
            console.error("Error deleting course:", error);
            alert("Something went wrong");
        } finally {
            setProcessingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChanged"));
        router.push("/login");
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
                    <p className="text-sm text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-slate-900">Admin Dashboard</h1>
                                <p className="text-xs text-slate-600">
                                    {user.firstName} {user.lastName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                {/* Stats */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Pending Approval</p>
                                <p className="text-2xl font-bold text-slate-900">{pendingCourses.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Approved Courses</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {allCourses.filter(c => c.status === 1).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <svg className="h-6 w-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Total Courses</p>
                                <p className="text-2xl font-bold text-slate-900">{allCourses.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                                activeTab === "pending"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            ⏳ Pending ({pendingCourses.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                                activeTab === "all"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            All Courses ({allCourses.length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === "pending" && (
                            <div>
                                {pendingCourses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900">All Caught Up!</h3>
                                        <p className="mt-1 text-sm text-slate-500">No pending course requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingCourses.map((course) => (
                                            <div
                                                key={course.id}
                                                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                                            >
                                                <div className="mb-4 flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="mb-2 flex items-center gap-3">
                                                            <h3 className="text-lg font-semibold text-slate-900">
                                                                {course.title}
                                                            </h3>
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                                Pending
                                                            </span>
                                                        </div>
                                                        {course.description && (
                                                            <p className="mb-3 text-sm text-slate-600">{course.description}</p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1.5">
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                {course.teacherName}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {new Date(course.createdAt).toLocaleDateString()}
                                                            </span>
                                                            <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                                                                {course.invitationCode}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>

                                                {rejectingCourseId === course.id ? (
                                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                                        <label className="mb-2 block text-sm font-medium text-slate-900">
                                                            Rejection Reason <span className="text-rose-600">*</span>
                                                        </label>
                                                        <textarea
                                                            value={rejectionReason}
                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                            placeholder="Explain why this course is being rejected..."
                                                            rows={3}
                                                            className="w-full rounded-lg border border-rose-300 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                        />
                                                        <div className="mt-3 flex gap-2">
                                                            <button
                                                                onClick={() => handleRejectCourse(course.id)}
                                                                disabled={processingId === course.id}
                                                                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {processingId === course.id ? "Rejecting..." : "Confirm Rejection"}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRejectingCourseId(null);
                                                                    setRejectionReason("");
                                                                }}
                                                                disabled={processingId === course.id}
                                                                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleApproveCourse(course.id)}
                                                            disabled={processingId === course.id}
                                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {processingId === course.id ? "Approving..." : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectingCourseId(course.id)}
                                                            disabled={processingId === course.id}
                                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "all" && (
                            <div>
                                {allCourses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900">No Courses Yet</h3>
                                        <p className="mt-1 text-sm text-slate-500">Courses will appear here once created</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {allCourses.map((course) => {
                                            const statusBadge = () => {
                                                switch (course.status) {
                                                    case 0:
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                                Pending
                                                            </span>
                                                        );
                                                    case 1:
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                                Approved
                                                            </span>
                                                        );
                                                    case 2:
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                                                Rejected
                                                            </span>
                                                        );
                                                }
                                            };

                                            return (
                                                <div
                                                    key={course.id}
                                                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                                                >
                                                    <div className="mb-3 flex items-start justify-between gap-2">
                                                        <h3 className="flex-1 text-base font-semibold text-slate-900 line-clamp-2">
                                                            {course.title}
                                                        </h3>
                                                        {statusBadge()}
                                                    </div>
                                                    {course.description && (
                                                        <p className="mb-3 text-sm text-slate-600 line-clamp-2">
                                                            {course.description}
                                                        </p>
                                                    )}
                                                    {course.status === 2 && course.rejectionReason && (
                                                        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                                                            <p className="text-xs text-rose-900">
                                                                <strong>Rejected:</strong> {course.rejectionReason}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="mb-4 space-y-1 text-xs text-slate-500">
                                                        <p className="flex items-center gap-1.5">
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            {course.teacherName}
                                                        </p>
                                                        <p className="flex items-center gap-1.5">
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {new Date(course.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <code className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                                                            {course.invitationCode}
                                                        </code>
                                                    </div>

                                                    {deletingCourseId === course.id ? (
                                                        <div className="space-y-3 border-t border-slate-200 pt-4">
                                                            <div className="flex gap-2 rounded-lg bg-rose-50 p-3">
                                                                <svg className="h-5 w-5 flex-shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                <p className="text-xs font-medium text-rose-900">
                                                                    This will permanently delete the course and all data. This cannot be undone.
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleDeleteCourse(course.id)}
                                                                    disabled={processingId === course.id}
                                                                    className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {processingId === course.id ? "Deleting..." : "Delete"}
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingCourseId(null)}
                                                                    disabled={processingId === course.id}
                                                                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeletingCourseId(course.id)}
                                                            disabled={processingId !== null}
                                                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete Course
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
