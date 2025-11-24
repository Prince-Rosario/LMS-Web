'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface AnswerOption {
  id: number;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface Question {
  id: number;
  questionText: string;
  explanation?: string;
  type: number;
  points: number;
  orderIndex: number;
  correctShortAnswer?: string;
  caseSensitive: boolean;
  answerOptions: AnswerOption[];
}

interface Test {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  timeLimitMinutes: number;
  maxAttempts: number;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  status: number;
  availableFrom?: string;
  availableUntil?: string;
  questions: Question[];
  totalPoints: number;
  attemptCount: number;
}

const testStatusLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  1: { label: 'Published', color: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'Closed', color: 'bg-rose-100 text-rose-700' },
  3: { label: 'Archived', color: 'bg-slate-100 text-slate-500' },
};

const questionTypeLabels: Record<number, string> = {
  0: 'Multiple Choice',
  1: 'Multiple Select',
  2: 'True/False',
  3: 'Short Answer',
  4: 'Essay',
};

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const testId = parseInt(params.testId as string);
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isMounted = true;
    
    const fetchTest = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/tests/${testId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setTest(data);
        } else {
          setLoadError('Failed to load test');
        }
      } catch (error) {
        if (isMounted) {
          setLoadError('Failed to load test');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTest();
    
    return () => {
      isMounted = false;
    };
  }, [testId, router]);
  
  // Show error toast only once when loadError changes
  useEffect(() => {
    if (loadError) {
      toast.error(loadError);
      router.push(`/courses/${courseId}/tests`);
    }
  }, [loadError, toast, router, courseId]);

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handlePublish = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Test published successfully');
        setTest(prev => prev ? { ...prev, status: 1 } : null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to publish test');
      }
    } catch (error) {
      toast.error('Failed to publish test');
    }
  };

  const handleClose = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Test closed successfully');
        setTest(prev => prev ? { ...prev, status: 2 } : null);
      }
    } catch (error) {
      toast.error('Failed to close test');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/courses/${courseId}/tests`)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
            <div className="flex items-center gap-3">
              {test.status === 0 && (
                <button
                  onClick={handlePublish}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Publish Test
                </button>
              )}
              {test.status === 1 && (
                <button
                  onClick={handleClose}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Close Test
                </button>
              )}
              <button
                onClick={() => router.push(`/courses/${courseId}/tests/${testId}/results`)}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                View Results ({test.attemptCount})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Test Info Card */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{test.title}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${testStatusLabels[test.status]?.color}`}>
                  {testStatusLabels[test.status]?.label}
                </span>
              </div>
              {test.description && (
                <p className="mt-2 text-slate-600">{test.description}</p>
              )}
            </div>
          </div>

          {test.instructions && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-medium text-amber-800 mb-1">Instructions</h3>
              <p className="text-sm text-amber-700 whitespace-pre-wrap">{test.instructions}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Questions</p>
              <p className="text-2xl font-bold text-slate-900">{test.questions.length}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Total Points</p>
              <p className="text-2xl font-bold text-slate-900">{test.totalPoints}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Time Limit</p>
              <p className="text-2xl font-bold text-slate-900">
                {test.timeLimitMinutes > 0 ? `${test.timeLimitMinutes}m` : 'None'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Passing Score</p>
              <p className="text-2xl font-bold text-slate-900">{test.passingScore}%</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Max Attempts:</span>
              <span className="ml-2 font-medium text-slate-700">
                {test.maxAttempts > 0 ? test.maxAttempts : 'Unlimited'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Available From:</span>
              <span className="ml-2 font-medium text-slate-700">{formatDate(test.availableFrom)}</span>
            </div>
            <div>
              <span className="text-slate-500">Available Until:</span>
              <span className="ml-2 font-medium text-slate-700">{formatDate(test.availableUntil)}</span>
            </div>
            <div>
              <span className="text-slate-500">Submissions:</span>
              <span className="ml-2 font-medium text-slate-700">{test.attemptCount}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {test.shuffleQuestions && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                Shuffle Questions
              </span>
            )}
            {test.shuffleAnswers && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                Shuffle Answers
              </span>
            )}
            {test.showResultsImmediately && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                Immediate Results
              </span>
            )}
            {test.showCorrectAnswers && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                Show Correct Answers
              </span>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
            <button
              onClick={() => {
                if (expandedQuestions.size === test.questions.length) {
                  setExpandedQuestions(new Set());
                } else {
                  setExpandedQuestions(new Set(test.questions.map(q => q.id)));
                }
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {expandedQuestions.size === test.questions.length ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {test.questions.map((question, index) => (
              <div key={question.id} className="p-4">
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full text-left flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-slate-900 font-medium">{question.questionText}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{questionTypeLabels[question.type]}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{question.points} pts</span>
                      </div>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${expandedQuestions.has(question.id) ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedQuestions.has(question.id) && (
                  <div className="mt-4 ml-11">
                    {/* Answer Options */}
                    {[0, 1, 2].includes(question.type) && question.answerOptions.length > 0 && (
                      <div className="space-y-2">
                        {question.answerOptions.map((option) => (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border ${
                              option.isCorrect
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {option.isCorrect && (
                                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className={option.isCorrect ? 'text-emerald-700' : 'text-slate-700'}>
                                {option.optionText}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Answer */}
                    {question.type === 3 && question.correctShortAnswer && (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-600 mb-1">Correct Answer:</p>
                        <p className="text-emerald-700 font-medium">{question.correctShortAnswer}</p>
                        {question.caseSensitive && (
                          <p className="text-xs text-emerald-600 mt-1">Case sensitive</p>
                        )}
                      </div>
                    )}

                    {/* Essay */}
                    {question.type === 4 && (
                      <p className="text-sm text-slate-500 italic">Essay question - requires manual grading</p>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

