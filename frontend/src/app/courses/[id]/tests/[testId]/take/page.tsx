'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface AnswerOption {
  id: number;
  optionText: string;
  orderIndex: number;
}

interface Question {
  id: number;
  questionText: string;
  type: number;
  points: number;
  orderIndex: number;
  answerOptions: AnswerOption[];
}

interface Test {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  timeLimitMinutes: number;
  questions: Question[];
}

interface Answer {
  questionId: number;
  selectedOptionIds: number[];
  textAnswer?: string;
}

const questionTypeLabels: Record<number, string> = {
  0: 'Multiple Choice',
  1: 'Multiple Select',
  2: 'True/False',
  3: 'Short Answer',
  4: 'Essay',
};

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const testId = parseInt(params.testId as string);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [test, setTest] = useState<Test | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSubmittedRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const submitTest = useCallback(async (auto = false) => {
    if (hasSubmittedRef.current || !attemptId) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/tests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attemptId: attemptId,
          answers: Object.values(answers).map(a => ({
            questionId: a.questionId,
            selectedOptionIds: a.selectedOptionIds,
            textAnswer: a.textAnswer || null,
          })),
        }),
      });

      if (response.ok) {
        toast.success(auto ? 'Time expired! Test submitted automatically.' : 'Test submitted successfully!');
        router.push(`/courses/${courseId}/tests/${testId}/results`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit test');
        hasSubmittedRef.current = false;
      }
    } catch (error) {
      toast.error('Failed to submit test');
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, answers, courseId, testId, router, toast]);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const fetchTest = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Start a new attempt - this returns the test with questions
        const startResponse = await fetch(`${API_URL}/api/tests/${testId}/start`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!startResponse.ok) {
          const error = await startResponse.json().catch(() => ({}));
          setLoadError(error.message || 'Failed to start test. Make sure you are enrolled as a student.');
          setIsLoading(false);
          return;
        }

        const testData = await startResponse.json();
        setAttemptId(testData.attemptId);
        
        // Set test data - map from TestTakingDto
        setTest({
          id: testData.id,
          title: testData.title,
          description: testData.description,
          instructions: testData.instructions,
          timeLimitMinutes: testData.timeLimitMinutes,
          questions: (testData.questions || []).map((q: { id: number; questionText: string; type: number; points: number; orderIndex: number; answerOptions: AnswerOption[] }) => ({
            id: q.id,
            questionText: q.questionText,
            type: q.type,
            points: q.points,
            orderIndex: q.orderIndex,
            answerOptions: q.answerOptions || [],
          })),
        });
        
        // Initialize answers
        const initialAnswers: Record<number, Answer> = {};
        (testData.questions || []).forEach((q: { id: number }) => {
          initialAnswers[q.id] = {
            questionId: q.id,
            selectedOptionIds: [],
            textAnswer: '',
          };
        });
        setAnswers(initialAnswers);

        // Set timer - calculate remaining time from expiresAt or use full time
        if (testData.expiresAt) {
          const expiresAt = new Date(testData.expiresAt);
          const now = new Date();
          const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
          setTimeRemaining(remainingSeconds);
        } else if (testData.timeLimitMinutes > 0) {
          setTimeRemaining(testData.timeLimitMinutes * 60);
        }
      } catch (error) {
        console.error('Error starting test:', error);
        setLoadError('Failed to load test. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testId, courseId, router, toast]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || showInstructions) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          submitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining, showInstructions, submitTest]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (questionId: number, optionId: number, questionType: number) => {
    setAnswers(prev => {
      const current = prev[questionId];
      if (questionType === 1) {
        // Multiple select
        const newSelected = current.selectedOptionIds.includes(optionId)
          ? current.selectedOptionIds.filter(id => id !== optionId)
          : [...current.selectedOptionIds, optionId];
        return { ...prev, [questionId]: { ...current, selectedOptionIds: newSelected } };
      } else {
        // Single select
        return { ...prev, [questionId]: { ...current, selectedOptionIds: [optionId] } };
      }
    });
  };

  const handleTextAnswer = (questionId: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], textAnswer: text },
    }));
  };

  const handleSubmit = async () => {
    const unanswered = test?.questions.filter(q => {
      const answer = answers[q.id];
      if ([0, 1, 2].includes(q.type)) {
        return answer.selectedOptionIds.length === 0;
      }
      return !answer.textAnswer?.trim();
    });

    if (unanswered && unanswered.length > 0) {
      const confirmed = await confirm({
        title: 'Unanswered Questions',
        message: `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`,
        confirmText: 'Submit Anyway',
        cancelText: 'Review',
        variant: 'warning',
      });
      if (!confirmed) return;
    }

    submitTest();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-300">Loading test...</p>
        </div>
      </div>
    );
  }

  if (loadError || !test) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 mb-4">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Start Test</h2>
          <p className="text-slate-400 mb-6">{loadError || 'Failed to load test. Please try again.'}</p>
          <button
            onClick={() => router.push(`/courses/${courseId}/tests`)}
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  // Instructions screen
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">{test.title}</h1>
            {test.description && (
              <p className="mt-2 text-slate-400">{test.description}</p>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Questions</span>
              <span className="text-white font-medium">{test.questions.length}</span>
            </div>
            {test.timeLimitMinutes > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-slate-400">Time Limit</span>
                <span className="text-white font-medium">{test.timeLimitMinutes} minutes</span>
              </div>
            )}
          </div>

          {test.instructions && (
            <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h3 className="text-amber-400 font-medium mb-2">Instructions</h3>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{test.instructions}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/courses/${courseId}/tests`)}
              className="flex-1 rounded-lg border border-white/20 px-6 py-3 text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowInstructions(false)}
              className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const answeredCount = Object.values(answers).filter(a => 
    a.selectedOptionIds.length > 0 || (a.textAnswer && a.textAnswer.trim())
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white truncate max-w-xs">{test.title}</h1>
            <span className="text-sm text-slate-400">
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-rose-500/20 text-rose-400' : 
                timeRemaining < 600 ? 'bg-amber-500/20 text-amber-400' : 
                'bg-white/10 text-white'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
            <span className="text-sm text-slate-400">
              {answeredCount}/{test.questions.length} answered
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(answeredCount / test.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-24 px-6">
        <div className="mx-auto max-w-3xl">
          {/* Question Card */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
                {currentQuestionIndex + 1}
              </span>
              <span className="text-sm text-slate-400">
                {questionTypeLabels[currentQuestion.type]} • {currentQuestion.points} pts
              </span>
            </div>

            <h2 className="text-xl text-white font-medium mb-8 leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            {/* Answer Options */}
            {[0, 1, 2].includes(currentQuestion.type) && (
              <div className="space-y-3">
                {currentQuestion.answerOptions.map((option) => {
                  const isSelected = answers[currentQuestion.id]?.selectedOptionIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(currentQuestion.id, option.id, currentQuestion.type)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-${currentQuestion.type === 1 ? 'md' : 'full'} border-2 flex items-center justify-center ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-500'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span>{option.optionText}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {currentQuestion.type === 3 && (
              <input
                type="text"
                value={answers[currentQuestion.id]?.textAnswer || ''}
                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Type your answer here..."
              />
            )}

            {/* Essay */}
            {currentQuestion.type === 4 && (
              <textarea
                value={answers[currentQuestion.id]?.textAnswer || ''}
                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                placeholder="Write your essay answer here..."
              />
            )}
          </div>

          {/* Question Navigator */}
          <div className="mt-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
            <p className="text-sm text-slate-400 mb-3">Jump to question:</p>
            <div className="flex flex-wrap gap-2">
              {test.questions.map((q, index) => {
                const hasAnswer = answers[q.id]?.selectedOptionIds.length > 0 || 
                                  (answers[q.id]?.textAnswer && answers[q.id]?.textAnswer?.trim());
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-indigo-500 text-white'
                        : hasAnswer
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex === test.questions.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

