'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface StudentProgressDetail {
  studentId: number;
  studentName: string;
  groupClass?: string;
  materialsReadCount: number;
  totalMaterials: number;
  materialsReadPercentage: number;
  testsCompletedCount: number;
  totalTests: number;
  testsCompletedPercentage: number;
  averageTestScore: number;
  status: 'on-track' | 'struggling';
  enrolledAt: string;
}

interface CourseStudentProgress {
  courseId: number;
  courseTitle: string;
  totalStudents: number;
  studentProgress: StudentProgressDetail[];
}

export default function CourseProgressPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const courseId = parseInt(params.id as string);

  const [progress, setProgress] = useState<CourseStudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'on-track' | 'struggling'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'materials' | 'tests'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchProgress();
  }, [courseId]);

  const fetchProgress = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      router.push('/login');
      return;
    }

    if (!user.canTeach) {
      toast.error('This page is only available for teachers');
      router.push('/dashboard');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/student-progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      } else if (response.status === 403) {
        toast.error('You are not authorized to view this course');
        router.push('/dashboard');
      } else {
        toast.error('Failed to load progress data');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredAndSortedStudents = () => {
    if (!progress) return [];

    let students = [...progress.studentProgress];

    // Filter
    if (filter !== 'all') {
      students = students.filter(s => s.status === filter);
    }

    // Sort
    students.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'score':
          comparison = a.averageTestScore - b.averageTestScore;
          break;
        case 'materials':
          comparison = a.materialsReadPercentage - b.materialsReadPercentage;
          break;
        case 'tests':
          comparison = a.testsCompletedPercentage - b.testsCompletedPercentage;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return students;
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const filteredStudents = getFilteredAndSortedStudents();
  const strugglingCount = progress.studentProgress.filter(s => s.status === 'struggling').length;
  const onTrackCount = progress.studentProgress.filter(s => s.status === 'on-track').length;
  const avgScore = progress.studentProgress.length > 0
    ? progress.studentProgress.reduce((sum, s) => sum + s.averageTestScore, 0) / progress.studentProgress.length
    : 0;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Course
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Student Progress</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Course Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{progress.courseTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track student progress and identify those who need help
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{progress.totalStudents}</p>
                <p className="text-sm text-slate-500">Total Students</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{onTrackCount}</p>
                <p className="text-sm text-slate-500">On Track</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600">{strugglingCount}</p>
                <p className="text-sm text-slate-500">Need Attention</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore.toFixed(1)}%</p>
                <p className="text-sm text-slate-500">Class Average</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({progress.totalStudents})
            </button>
            <button
              onClick={() => setFilter('on-track')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'on-track'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              On Track ({onTrackCount})
            </button>
            <button
              onClick={() => setFilter('struggling')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'struggling'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Struggling ({strugglingCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="name">Name</option>
              <option value="score">Test Score</option>
              <option value="materials">Materials</option>
              <option value="tests">Tests</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <svg className={`h-5 w-5 text-slate-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Student Progress Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900">No students found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {filter !== 'all' ? 'No students match the current filter' : 'No students enrolled in this course yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Materials</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tests</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg. Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {student.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.studentName}</p>
                            {student.groupClass && (
                              <p className="text-xs text-slate-500">{student.groupClass}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.status === 'on-track' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            On Track
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            Struggling
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-900">{student.materialsReadCount}/{student.totalMaterials}</span>
                            <span className="text-xs text-slate-500">{student.materialsReadPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${getProgressBarColor(student.materialsReadPercentage)}`}
                              style={{ width: `${student.materialsReadPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-900">{student.testsCompletedCount}/{student.totalTests}</span>
                            <span className="text-xs text-slate-500">{student.testsCompletedPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${getProgressBarColor(student.testsCompletedPercentage)}`}
                              style={{ width: `${student.testsCompletedPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${getScoreColor(student.averageTestScore)}`}>
                          {student.averageTestScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(student.enrolledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


