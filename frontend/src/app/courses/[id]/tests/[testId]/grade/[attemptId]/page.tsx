'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface StudentAnswer {
  id: number;
  questionId: number;
  questionText: string;
  questionType: number;
  questionPoints: number;
  textAnswer?: string;
  pointsEarned?: number;
  feedback?: string;
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
  score?: number;
  maxScore?: number;
  percentage?: number;
  status: number;
  answers: StudentAnswer[];
}

interface GradeAnswer {
  studentAnswerId: number;
  pointsEarned: number;
  feedback?: string;
}

const questionTypeLabels: Record<number, string> = {
  0: 'Multiple Choice',
  1: 'Multiple Select',
  2: 'True/False',
  3: 'Short Answer',
  4: 'Essay',
};

export default function GradeTestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const courseId = parseInt(params.id as string);
  const testId = parseInt(params.testId as string);
  const attemptId = parseInt(params.attemptId as string);

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [grades, setGrades] = useState<Record<number, GradeAnswer>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/Tests/attempts/${attemptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttempt(data);
        
        // Initialize grades with existing values
        const initialGrades: Record<number, GradeAnswer> = {};
        data.answers.forEach((answer: StudentAnswer) => {
          if (answer.questionType === 4 || answer.questionType === 3) { // Essay or Short Answer
            initialGrades[answer.id] = {
              studentAnswerId: answer.id,
              pointsEarned: answer.pointsEarned ?? 0,
              feedback: answer.feedback ?? '',
            };
          }
        });
        setGrades(initialGrades);
      } else {
        toast.error('Failed to load test attempt');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching attempt:', error);
      toast.error('Failed to load test attempt');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const updateGrade = (answerId: number, field: 'pointsEarned' | 'feedback', value: number | string) => {
    setGrades(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value,
      },
    }));
  };

  const handleSubmitGrades = async () => {
    if (!attempt) return;

    // Validate that all essay questions have been graded
    const essayAnswers = attempt.answers.filter(a => a.questionType === 4);
    const ungradedEssays = essayAnswers.filter(a => !grades[a.id] || grades[a.id].pointsEarned === undefined);
    
    if (ungradedEssays.length > 0) {
      toast.error('Please grade all essay questions before submitting');
      return;
    }

    // Validate points don't exceed max
    for (const answer of essayAnswers) {
      const grade = grades[answer.id];
      if (grade.pointsEarned > answer.questionPoints) {
        toast.error(`Points for question "${answer.questionText}" cannot exceed ${answer.questionPoints}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const gradeDto = {
        attemptId: attempt.id,
        feedback: overallFeedback,
        grades: Object.values(grades),
      };

      const response = await fetch(`${API_URL}/api/Tests/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gradeDto),
      });

      if (response.ok) {
        toast.success('Test graded successfully!');
        router.push(`/courses/${courseId}/tests/${testId}/results`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit grades');
      }
    } catch (error) {
      console.error('Error submitting grades:', error);
      toast.error('Failed to submit grades');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Loading test attempt...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Test attempt not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const essayAnswers = attempt.answers.filter(a => a.questionType === 4 || a.questionType === 3);
  const totalPossiblePoints = essayAnswers.reduce((sum, a) => sum + a.questionPoints, 0);
  const currentTotalPoints = Object.values(grades).reduce((sum, g) => sum + (g.pointsEarned || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Results
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Grade Test Attempt</h1>
          <div className="mt-4 flex items-center gap-6 text-sm text-slate-600">
            <div>
              <span className="font-medium">Test:</span> {attempt.testTitle}
            </div>
            <div>
              <span className="font-medium">Student:</span> {attempt.studentName}
            </div>
            <div>
              <span className="font-medium">Attempt:</span> #{attempt.attemptNumber}
            </div>
            <div>
              <span className="font-medium">Submitted:</span>{' '}
              {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Grading Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Grading Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Questions to Grade</p>
              <p className="text-2xl font-bold text-slate-900">{essayAnswers.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Possible Points</p>
              <p className="text-2xl font-bold text-slate-900">{totalPossiblePoints}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Current Score</p>
              <p className="text-2xl font-bold text-indigo-600">{currentTotalPoints} pts</p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {essayAnswers.map((answer, index) => (
            <div key={answer.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {questionTypeLabels[answer.questionType]}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      {answer.questionPoints} {answer.questionPoints === 1 ? 'point' : 'points'}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">{answer.questionText}</h3>
                </div>
              </div>

              {/* Student's Answer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Student's Answer:</label>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-slate-900 whitespace-pre-wrap">
                    {answer.textAnswer || <span className="text-slate-400 italic">No answer provided</span>}
                  </p>
                </div>
              </div>

              {/* Grading Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Points Earned <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={answer.questionPoints}
                    step="0.5"
                    value={grades[answer.id]?.pointsEarned ?? 0}
                    onChange={(e) => updateGrade(answer.id, 'pointsEarned', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`0 - ${answer.questionPoints}`}
                  />
                  <p className="mt-1 text-xs text-slate-500">Max: {answer.questionPoints} points</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Feedback (optional)</label>
                  <textarea
                    value={grades[answer.id]?.feedback ?? ''}
                    onChange={(e) => updateGrade(answer.id, 'feedback', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={3}
                    placeholder="Provide feedback for this answer..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Feedback */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Overall Test Feedback (optional)</label>
          <textarea
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={4}
            placeholder="Provide overall feedback on the student's performance..."
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitGrades}
            disabled={isSubmitting}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit Grades
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

