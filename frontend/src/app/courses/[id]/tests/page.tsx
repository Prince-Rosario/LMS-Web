'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface Test {
  id: number;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  maxAttempts: number;
  passingScore: number;
  status: number;
  questionCount: number;
  totalPoints: number;
  availableFrom?: string;
  availableUntil?: string;
  createdAt: string;
  attemptsUsed?: number;
  bestScore?: number;
  hasPassed?: boolean;
}

interface Course {
  id: number;
  title: string;
  teacherId: number;
}

const testStatusLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  1: { label: 'Published', color: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'Closed', color: 'bg-rose-100 text-rose-700' },
  3: { label: 'Archived', color: 'bg-slate-100 text-slate-500' },
};

export default function TestsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const { toast } = useToast();

  const [tests, setTests] = useState<Test[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ userId: number } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch tests
        const testsResponse = await fetch(`${API_URL}/api/tests/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        if (testsResponse.ok) {
          const testsData = await testsResponse.json();
          setTests(Array.isArray(testsData) ? testsData : []);
        }

        // Fetch course info
        const coursesResponse = await fetch(`${API_URL}/api/courses/my-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        if (coursesResponse.ok) {
          const courses = await coursesResponse.json();
          const currentCourse = courses.find((c: Course) => c.id === courseId);
          if (currentCourse) {
            setCourse(currentCourse);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            setIsTeacher(currentCourse.teacherId === user.userId);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [courseId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isTestAvailable = (test: Test) => {
    if (test.status !== 1) return false;
    const now = new Date();
    if (test.availableFrom && new Date(test.availableFrom) > now) return false;
    if (test.availableUntil && new Date(test.availableUntil) < now) return false;
    if (test.maxAttempts > 0 && (test.attemptsUsed || 0) >= test.maxAttempts) return false;
    return true;
  };

  const handlePublish = async (testId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Test published successfully');
        // Refresh tests
        const testsResponse = await fetch(`${API_URL}/api/tests/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (testsResponse.ok) {
          setTests(await testsResponse.json());
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to publish test');
      }
    } catch (error) {
      toast.error('Failed to publish test');
    }
  };

  const handleClose = async (testId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Test closed successfully');
        const testsResponse = await fetch(`${API_URL}/api/tests/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (testsResponse.ok) {
          setTests(await testsResponse.json());
        }
      }
    } catch (error) {
      toast.error('Failed to close test');
    }
  };

  const handleDelete = async (testId: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Test deleted successfully');
        setTests(tests.filter(t => t.id !== testId));
      }
    } catch (error) {
      toast.error('Failed to delete test');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/courses/${courseId}`)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Course
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tests & Quizzes</h1>
              <p className="text-sm text-slate-500">{course?.title}</p>
            </div>
            <div>
              {isTeacher && (
                <button
                  onClick={() => router.push(`/courses/${courseId}/tests/create`)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Test
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white py-16">
            <svg className="mb-4 h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900">No tests yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isTeacher ? 'Create your first test to assess students.' : 'No tests available for this course yet.'}
            </p>
            {isTeacher && (
              <button
                onClick={() => router.push(`/courses/${courseId}/tests/create`)}
                className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Test
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{test.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${testStatusLabels[test.status]?.color}`}>
                        {testStatusLabels[test.status]?.label}
                      </span>
                      {!isTeacher && test.hasPassed && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          ✓ Passed
                        </span>
                      )}
                    </div>
                    {test.description && (
                      <p className="mt-1 text-sm text-slate-600">{test.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {test.questionCount} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {test.timeLimitMinutes > 0 ? `${test.timeLimitMinutes} min` : 'No limit'}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pass: {test.passingScore}%
                      </span>
                      {test.maxAttempts > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {test.attemptsUsed || 0}/{test.maxAttempts} attempts
                        </span>
                      )}
                      {!isTeacher && test.bestScore !== undefined && test.bestScore !== null && (
                        <span className="flex items-center gap-1 font-medium text-indigo-600">
                          Best: {test.bestScore.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {(test.availableFrom || test.availableUntil) && (
                      <div className="mt-2 text-xs text-slate-400">
                        {test.availableFrom && <span>Available from: {formatDate(test.availableFrom)}</span>}
                        {test.availableFrom && test.availableUntil && <span> • </span>}
                        {test.availableUntil && <span>Until: {formatDate(test.availableUntil)}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isTeacher ? (
                      <>
                        <button
                          onClick={() => router.push(`/courses/${courseId}/tests/${test.id}`)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                        {test.status === 0 && (
                          <button
                            onClick={() => handlePublish(test.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                          >
                            Publish
                          </button>
                        )}
                        {test.status === 1 && (
                          <button
                            onClick={() => handleClose(test.id)}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/courses/${courseId}/tests/${test.id}/results`)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          Results
                        </button>
                        <button
                          onClick={() => handleDelete(test.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        {isTestAvailable(test) ? (
                          <button
                            onClick={() => router.push(`/courses/${courseId}/tests/${test.id}/take`)}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                          >
                            {(test.attemptsUsed || 0) > 0 ? 'Retake Test' : 'Start Test'}
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">
                            {test.status !== 1 ? 'Not available' : 
                             test.maxAttempts > 0 && (test.attemptsUsed || 0) >= test.maxAttempts ? 'No attempts left' :
                             'Not available yet'}
                          </span>
                        )}
                        {(test.attemptsUsed || 0) > 0 && (
                          <button
                            onClick={() => router.push(`/courses/${courseId}/tests/${test.id}/results`)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            View Results
                          </button>
                        )}
                      </>
                    )}
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

