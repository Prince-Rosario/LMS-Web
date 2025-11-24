'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface AnswerOption {
  id: number;
  optionText: string;
  isCorrect: boolean;
}

interface StudentAnswer {
  id: number;
  questionId: number;
  questionText: string;
  questionType: number;
  questionPoints: number;
  selectedOptionIds?: number[];
  textAnswer?: string;
  pointsEarned?: number;
  isCorrect?: boolean;
  correctOptionIds?: number[];
  correctShortAnswer?: string;
  explanation?: string;
  feedback?: string;
  options?: AnswerOption[];
}

interface TestAttempt {
  id: number;
  testId: number;
  testTitle: string;
  studentId: number;
  studentName: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  gradedAt?: string;
  expiresAt?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  status: number;
  feedback?: string;
  gradedBy?: string;
  answers: StudentAnswer[];
}

interface TestResult {
  attempts: TestAttempt[];
  bestAttempt?: TestAttempt;
  showCorrectAnswers: boolean;
}

const statusLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  1: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  2: { label: 'Graded', color: 'bg-emerald-100 text-emerald-700' },
  3: { label: 'Expired', color: 'bg-rose-100 text-rose-700' },
};

const questionTypeLabels: Record<number, string> = {
  0: 'Multiple Choice',
  1: 'Multiple Select',
  2: 'True/False',
  3: 'Short Answer',
  4: 'Essay',
};

export default function TestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const testId = parseInt(params.testId as string);
  const { toast } = useToast();

  const [results, setResults] = useState<TestResult | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [allStudentAttempts, setAllStudentAttempts] = useState<TestAttempt[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Check if user is teacher or admin by fetching course details
        const courseResponse = await fetch(`${API_URL}/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let teacherStatus = false;
        if (courseResponse.ok) {
          const course = await courseResponse.json();
          // Check if user is the course teacher or an admin
          teacherStatus = Number(course.teacherId) === Number(user.userId) || user.role === 2;
        }
        setIsTeacher(teacherStatus);

        if (teacherStatus) {
          // Fetch all student attempts for this test
          const attemptsResponse = await fetch(`${API_URL}/api/tests/${testId}/attempts`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (attemptsResponse.ok) {
            const attempts = await attemptsResponse.json();
            const attemptsList = Array.isArray(attempts) ? attempts : [];
            setAllStudentAttempts(attemptsList);
            if (attemptsList.length > 0) {
              setSelectedAttempt(attemptsList[0]);
            }
          } else {
            console.error('Failed to fetch attempts:', attemptsResponse.status);
          }
        } else {
          // Fetch student's own attempts for this test
          const attemptsResponse = await fetch(`${API_URL}/api/tests/my-attempts?testId=${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (attemptsResponse.ok) {
            const attempts = await attemptsResponse.json();
            const attemptsList = Array.isArray(attempts) ? attempts : [];
            setResults({
              attempts: attemptsList,
              bestAttempt: attemptsList.length > 0 
                ? attemptsList.reduce((best, curr) => 
                    (curr.percentage || 0) > (best.percentage || 0) ? curr : best
                  )
                : undefined,
              showCorrectAnswers: true,
            });
            if (attemptsList.length > 0) {
              // Select the best attempt by default
              const best = attemptsList.reduce((b, c) => 
                (c.percentage || 0) > (b.percentage || 0) ? c : b
              );
              setSelectedAttempt(best);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [testId, courseId, router, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'N/A';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const attempts = isTeacher ? allStudentAttempts : results?.attempts || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/courses/${courseId}/tests`)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Tests
              </button>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isTeacher ? 'Student Results' : 'My Results'}
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {attempts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white py-16">
            <svg className="mb-4 h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900">No results yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isTeacher ? 'No students have taken this test yet.' : 'You haven\'t taken this test yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attempts List */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="font-semibold text-slate-900">
                    {isTeacher ? 'All Submissions' : 'Your Attempts'}
                  </h2>
                </div>
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {attempts.map((attempt) => (
                    <button
                      key={attempt.id}
                      onClick={() => setSelectedAttempt(attempt)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                        selectedAttempt?.id === attempt.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          {isTeacher && (
                            <p className="font-medium text-slate-900">{attempt.studentName}</p>
                          )}
                          <p className="text-sm text-slate-500">{formatDate(attempt.submittedAt || attempt.startedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {(attempt.percentage ?? 0).toFixed(1)}%
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[attempt.status]?.color}`}>
                            {statusLabels[attempt.status]?.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Attempt Details */}
            {selectedAttempt && (
              <div className="lg:col-span-2 space-y-6">
                {/* Score Summary */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedAttempt.testTitle}</h2>
                      {isTeacher && (
                        <p className="text-slate-600">{selectedAttempt.studentName}</p>
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${selectedAttempt.passed ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      <span className={`text-2xl font-bold ${selectedAttempt.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {selectedAttempt.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-3xl font-bold text-indigo-600">{(selectedAttempt.percentage ?? 0).toFixed(1)}%</p>
                      <p className="text-sm text-slate-500">Score</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-3xl font-bold text-slate-700">{selectedAttempt.score ?? 0}/{selectedAttempt.maxScore ?? 0}</p>
                      <p className="text-sm text-slate-500">Points</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-3xl font-bold text-slate-700">
                        {selectedAttempt.answers?.filter(a => a.isCorrect).length || 0}/{selectedAttempt.answers?.length || 0}
                      </p>
                      <p className="text-sm text-slate-500">Correct</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-3xl font-bold text-slate-700">
                        {calculateDuration(selectedAttempt.startedAt, selectedAttempt.submittedAt)}
                      </p>
                      <p className="text-sm text-slate-500">Duration</p>
                    </div>
                  </div>
                </div>

                {/* Questions Review */}
                {selectedAttempt.answers && selectedAttempt.answers.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                      <h3 className="font-semibold text-slate-900">Question Review</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedAttempt.answers.map((answer, index) => (
                        <div key={answer.questionId} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                answer.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="text-xs text-slate-500">{questionTypeLabels[answer.questionType]}</span>
                            </div>
                            <span className={`text-sm font-medium ${answer.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {answer.pointsEarned ?? 0}/{answer.questionPoints} pts
                            </span>
                          </div>

                          <p className="text-slate-900 mb-4">{answer.questionText}</p>

                          {/* Show answer options for multiple choice questions */}
                          {[0, 1, 2].includes(answer.questionType) && answer.options && (
                            <div className="space-y-2 mb-4">
                              {answer.options.map((option) => {
                                const wasSelected = answer.selectedOptionIds?.includes(option.id);
                                const isCorrectOption = option.isCorrect;
                                
                                let bgColor = 'bg-slate-50';
                                let borderColor = 'border-slate-200';
                                let textColor = 'text-slate-700';
                                
                                if (results?.showCorrectAnswers || isTeacher) {
                                  if (isCorrectOption && wasSelected) {
                                    bgColor = 'bg-emerald-50';
                                    borderColor = 'border-emerald-300';
                                    textColor = 'text-emerald-700';
                                  } else if (isCorrectOption) {
                                    bgColor = 'bg-emerald-50';
                                    borderColor = 'border-emerald-200';
                                    textColor = 'text-emerald-600';
                                  } else if (wasSelected) {
                                    bgColor = 'bg-rose-50';
                                    borderColor = 'border-rose-300';
                                    textColor = 'text-rose-700';
                                  }
                                } else if (wasSelected) {
                                  bgColor = 'bg-indigo-50';
                                  borderColor = 'border-indigo-200';
                                  textColor = 'text-indigo-700';
                                }

                                return (
                                  <div
                                    key={option.id}
                                    className={`p-3 rounded-lg border ${bgColor} ${borderColor}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {wasSelected && (
                                        <svg className={`w-5 h-5 ${textColor}`} fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      <span className={textColor}>{option.optionText}</span>
                                      {(results?.showCorrectAnswers || isTeacher) && isCorrectOption && (
                                        <span className="ml-auto text-xs text-emerald-600 font-medium">Correct</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Show text answers */}
                          {[3, 4].includes(answer.questionType) && (
                            <div className="mb-4">
                              <p className="text-sm text-slate-500 mb-1">Your Answer:</p>
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-slate-700">{answer.textAnswer || <em className="text-slate-400">No answer provided</em>}</p>
                              </div>
                              {(results?.showCorrectAnswers || isTeacher) && answer.correctShortAnswer && (
                                <div className="mt-2">
                                  <p className="text-sm text-emerald-600 mb-1">Correct Answer:</p>
                                  <p className="text-emerald-700">{answer.correctShortAnswer}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Explanation */}
                          {(results?.showCorrectAnswers || isTeacher) && answer.explanation && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-700">
                                <strong>Explanation:</strong> {answer.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

