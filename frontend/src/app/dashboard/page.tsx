"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";

type UserData = {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: number;
    canTeach: boolean;
    canStudy: boolean;
    groupClass?: string;
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

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"teaching" | "learning">("learning");

    useEffect(() => {
        const userData = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!userData || !token) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userData);

        // Redirect admins to admin dashboard
        if (parsedUser.role === 2) {
            router.push("/admin");
            return;
        }

        setUser(parsedUser);

        // Set default tab based on capabilities
        if (parsedUser.canTeach && !parsedUser.canStudy) {
            setActiveTab("teaching");
        } else if (parsedUser.canStudy) {
            setActiveTab("learning");
        }

        loadCourses(token);
    }, [router]);

    const loadCourses = async (token: string, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch("http://localhost:5050/api/courses/my-courses", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Failed to load courses:", error);
        } finally {
            if (showLoading) setLoading(false);
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

    const teachingCourses = courses.filter(c => c.teacherId === user.userId);
    const learningCourses = courses.filter(c => c.teacherId !== user.userId);

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Refined Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700">
                                    <span className="text-sm font-semibold text-white">E</span>
                                </div>
                                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Edify</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Progress Link (Students) */}
                            {user.canStudy && (
                                <button
                                    onClick={() => router.push('/progress')}
                                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                    title="My Progress"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </button>
                            )}

                            {/* Notification Bell */}
                            <NotificationBell />

                            {/* Profile Link */}
                            <button
                                onClick={() => router.push('/profile')}
                                className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-slate-100"
                            >
                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-medium text-slate-900">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {user.canTeach && user.canStudy ? (
                                            <>Teacher & Student</>
                                        ) : user.canTeach ? (
                                            <>Teacher</>
                                        ) : (
                                            <>Student</>
                                        )}
                                        {user.groupClass && ` • ${user.groupClass}`}
                                    </p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </div>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                {/* Tab Navigation */}
                {user.canTeach && user.canStudy && (
                    <nav className="mb-8 flex gap-1 rounded-xl bg-slate-100/50 p-1">
                        <button
                            onClick={() => setActiveTab("learning")}
                            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "learning"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            My Learning
                            <span className="ml-2 text-xs opacity-60">({learningCourses.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("teaching")}
                            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === "teaching"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            My Teaching
                            <span className="ml-2 text-xs opacity-60">({teachingCourses.length})</span>
                        </button>
                    </nav>
                )}

                {/* Learning View */}
                {activeTab === "learning" && user.canStudy && (
                    <div>
                        <div className="mb-8 flex items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                                    Your Courses
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Continue learning or join a new course
                                </p>
                            </div>
                            <button
                                onClick={() => router.push("/courses/join")}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Join Course
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
                            </div>
                        ) : learningCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                    <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">No courses yet</h3>
                                <p className="mt-1 text-sm text-slate-600">Get started by joining your first course</p>
                                <button
                                    onClick={() => router.push("/courses/join")}
                                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                                >
                                    Join a Course
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {learningCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        onClick={() => router.push(`/courses/${course.id}`)}
                                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 ring-1 ring-slate-200">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            {course.status === 1 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="mb-2 text-base font-semibold text-slate-900 group-hover:text-slate-700">
                                            {course.title}
                                        </h3>
                                        {course.description && (
                                            <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                                                {course.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                                                    {course.teacherName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs text-slate-600">{course.teacherName}</span>
                                            </div>
                                            <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Teaching View */}
                {activeTab === "teaching" && user.canTeach && (
                    <div>
                        <div className="mb-8 flex items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                                    Your Courses
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Manage courses you&apos;re teaching
                                </p>
                            </div>
                            <button
                                onClick={() => router.push("/courses/create")}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Course
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
                            </div>
                        ) : teachingCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                    <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">No courses yet</h3>
                                <p className="mt-1 text-sm text-slate-600">Create your first course to get started</p>
                                <button
                                    onClick={() => router.push("/courses/create")}
                                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                                >
                                    Create Course
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {teachingCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        onClick={() => router.push(`/courses/${course.id}`)}
                                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
                                    >
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 ring-1 ring-slate-200">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            {course.status === 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                    Pending
                                                </span>
                                            )}
                                            {course.status === 1 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    Approved
                                                </span>
                                            )}
                                            {course.status === 2 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                                    Rejected
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="mb-2 text-base font-semibold text-slate-900 group-hover:text-slate-700">
                                            {course.title}
                                        </h3>
                                        {course.description && (
                                            <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                                                {course.description}
                                            </p>
                                        )}
                                        {course.status === 2 && course.rejectionReason && (
                                            <div className="mb-4 rounded-lg bg-rose-50 p-3 ring-1 ring-rose-100">
                                                <p className="text-xs text-rose-700">
                                                    <span className="font-medium">Reason:</span> {course.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                            <span className="text-xs font-mono text-slate-500">
                                                {course.invitationCode}
                                            </span>
                                            <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* No Capabilities State */}
                {!user.canTeach && !user.canStudy && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">No access yet</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Please contact an administrator to get started
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

