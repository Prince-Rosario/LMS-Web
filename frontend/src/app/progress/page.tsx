'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface CourseProgressItem {
  courseId: number;
  courseTitle: string;
  materialsRead: number;
  totalMaterials: number;
  materialsPercentage: number;
  testsCompleted: number;
  totalTests: number;
  testsPercentage: number;
  averageScore: number;
  enrolledAt: string;
}

interface StudentProgressSummary {
  totalCoursesEnrolled: number;
  completedMaterials: number;
  totalMaterials: number;
  materialsCompletionPercentage: number;
  completedTests: number;
  totalTests: number;
  testsCompletionPercentage: number;
  averageTestScore: number;
  courseProgress: CourseProgressItem[];
}

export default function ProgressPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [progress, setProgress] = useState<StudentProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      router.push('/login');
      return;
    }

    // Only students can view this page
    if (!user.canStudy) {
      toast.error('This page is only available for students');
      router.push('/dashboard');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/courses/my-progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      } else {
        toast.error('Failed to load progress');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-lg font-semibold text-slate-900">My Progress</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        {/* Overview Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Courses Enrolled */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{progress.totalCoursesEnrolled}</p>
                <p className="text-sm text-slate-500">Courses Enrolled</p>
              </div>
            </div>
          </div>

          {/* Materials Completed */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{progress.completedMaterials}/{progress.totalMaterials}</p>
                <p className="text-sm text-slate-500">Materials Read</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressBarColor(progress.materialsCompletionPercentage)}`}
                  style={{ width: `${progress.materialsCompletionPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{progress.materialsCompletionPercentage.toFixed(1)}% complete</p>
            </div>
          </div>

          {/* Tests Completed */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{progress.completedTests}/{progress.totalTests}</p>
                <p className="text-sm text-slate-500">Tests Completed</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressBarColor(progress.testsCompletionPercentage)}`}
                  style={{ width: `${progress.testsCompletionPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{progress.testsCompletionPercentage.toFixed(1)}% complete</p>
            </div>
          </div>

          {/* Average Score */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className={`text-2xl font-bold ${getScoreColor(progress.averageTestScore)}`}>
                  {progress.averageTestScore.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500">Average Test Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Course Progress</h2>
          </div>

          {progress.courseProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900">No courses yet</h3>
              <p className="mt-1 text-sm text-slate-500">Join a course to start tracking your progress</p>
              <button
                onClick={() => router.push('/courses/join')}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Join a Course
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {progress.courseProgress.map((course) => (
                <div
                  key={course.courseId}
                  className="p-6 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/courses/${course.courseId}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{course.courseTitle}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Enrolled {new Date(course.enrolledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getScoreColor(course.averageScore)}`}>
                        {course.averageScore.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">Avg. Score</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Materials Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Materials</span>
                        <span className="text-sm font-medium text-slate-900">
                          {course.materialsRead}/{course.totalMaterials}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${getProgressBarColor(course.materialsPercentage)}`}
                          style={{ width: `${course.materialsPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Tests Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Tests</span>
                        <span className="text-sm font-medium text-slate-900">
                          {course.testsCompleted}/{course.totalTests}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${getProgressBarColor(course.testsPercentage)}`}
                          style={{ width: `${course.testsPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


