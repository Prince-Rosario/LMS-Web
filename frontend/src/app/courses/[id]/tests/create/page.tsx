'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface AnswerOption {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface Question {
  id: string;
  questionText: string;
  explanation?: string;
  type: number;
  points: number;
  orderIndex: number;
  correctShortAnswer?: string;
  caseSensitive: boolean;
  answerOptions: AnswerOption[];
}

const questionTypes = [
  { value: 0, label: 'Multiple Choice', description: 'Single correct answer' },
  { value: 1, label: 'Multiple Select', description: 'Multiple correct answers' },
  { value: 2, label: 'True/False', description: 'True or False' },
  { value: 3, label: 'Short Answer', description: 'Text input' },
  { value: 4, label: 'Essay', description: 'Long text (manual grading)' },
];

export default function CreateTestPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    instructions: '',
    timeLimitMinutes: 60,
    maxAttempts: 1,
    passingScore: 50,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showResultsImmediately: true,
    showCorrectAnswers: true,
    availableFrom: '',
    availableUntil: '',
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    questionText: '',
    explanation: '',
    type: 0,
    points: 1,
    orderIndex: 0,
    correctShortAnswer: '',
    caseSensitive: false,
    answerOptions: [
      { optionText: '', isCorrect: false, orderIndex: 1 },
      { optionText: '', isCorrect: false, orderIndex: 2 },
    ],
  });

  const handleTestDataChange = (field: string, value: string | number | boolean) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (field: string, value: string | number | boolean) => {
    setCurrentQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, field: string, value: string | boolean) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      answerOptions: [
        ...prev.answerOptions,
        { optionText: '', isCorrect: false, orderIndex: prev.answerOptions.length + 1 },
      ],
    }));
  };

  const removeOption = (index: number) => {
    if (currentQuestion.answerOptions.length <= 2) return;
    setCurrentQuestion(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.filter((_, i) => i !== index),
    }));
  };

  const initTrueFalseOptions = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      answerOptions: [
        { optionText: 'True', isCorrect: false, orderIndex: 1 },
        { optionText: 'False', isCorrect: false, orderIndex: 2 },
      ],
    }));
  };

  const saveQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      toast.error('Question text is required');
      return;
    }

    if ([0, 1, 2].includes(currentQuestion.type)) {
      const hasCorrect = currentQuestion.answerOptions.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        toast.error('Please mark at least one correct answer');
        return;
      }
      const hasOptions = currentQuestion.answerOptions.every(opt => opt.optionText.trim());
      if (!hasOptions) {
        toast.error('All answer options must have text');
        return;
      }
    }

    if (currentQuestion.type === 3 && !currentQuestion.correctShortAnswer?.trim()) {
      toast.error('Please provide the correct answer for short answer question');
      return;
    }

    if (editingQuestion) {
      setQuestions(prev =>
        prev.map(q => (q.id === editingQuestion.id ? { ...currentQuestion, id: editingQuestion.id } : q))
      );
    } else {
      setQuestions(prev => [
        ...prev,
        { ...currentQuestion, id: `temp-${Date.now()}`, orderIndex: prev.length + 1 },
      ]);
    }

    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      id: '',
      questionText: '',
      explanation: '',
      type: 0,
      points: 1,
      orderIndex: 0,
      correctShortAnswer: '',
      caseSensitive: false,
      answerOptions: [
        { optionText: '', isCorrect: false, orderIndex: 1 },
        { optionText: '', isCorrect: false, orderIndex: 2 },
      ],
    });
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  const editQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testData.title.trim()) {
      toast.error('Test title is required');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...testData,
          courseId,
          // Convert local datetime to ISO UTC string for proper timezone handling
          availableFrom: testData.availableFrom ? new Date(testData.availableFrom).toISOString() : null,
          availableUntil: testData.availableUntil ? new Date(testData.availableUntil).toISOString() : null,
          questions: questions.map((q, index) => ({
            questionText: q.questionText,
            explanation: q.explanation || null,
            type: q.type,
            points: q.points,
            orderIndex: index + 1,
            correctShortAnswer: q.correctShortAnswer || null,
            caseSensitive: q.caseSensitive,
            answerOptions: q.answerOptions.map((opt, optIndex) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              orderIndex: optIndex + 1,
            })),
          })),
        }),
      });

      if (response.ok) {
        toast.success('Test created successfully');
        router.push(`/courses/${courseId}/tests`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create test');
      }
    } catch (error) {
      toast.error('Failed to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
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
            <h1 className="text-2xl font-bold text-slate-900">Create New Test</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Test Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={testData.title}
                  onChange={(e) => handleTestDataChange('title', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g., Midterm Exam"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={testData.description}
                  onChange={(e) => handleTestDataChange('description', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Brief description of the test"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                <textarea
                  value={testData.instructions}
                  onChange={(e) => handleTestDataChange('instructions', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Instructions shown to students before starting the test"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Test Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (minutes)</label>
                <input
                  type="number"
                  value={testData.timeLimitMinutes}
                  onChange={(e) => handleTestDataChange('timeLimitMinutes', parseInt(e.target.value) || 0)}
                  min={0}
                  max={480}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-xs text-slate-500 mt-1">0 = no time limit</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
                <input
                  type="number"
                  value={testData.maxAttempts}
                  onChange={(e) => handleTestDataChange('maxAttempts', parseInt(e.target.value) || 0)}
                  min={0}
                  max={10}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-xs text-slate-500 mt-1">0 = unlimited</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  value={testData.passingScore}
                  onChange={(e) => handleTestDataChange('passingScore', parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testData.shuffleQuestions}
                    onChange={(e) => handleTestDataChange('shuffleQuestions', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Shuffle questions</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={testData.shuffleAnswers}
                    onChange={(e) => handleTestDataChange('shuffleAnswers', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Shuffle answer options</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Available From</label>
                <input
                  type="datetime-local"
                  value={testData.availableFrom}
                  onChange={(e) => handleTestDataChange('availableFrom', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Available Until</label>
                <input
                  type="datetime-local"
                  value={testData.availableUntil}
                  onChange={(e) => handleTestDataChange('availableUntil', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={testData.showResultsImmediately}
                  onChange={(e) => handleTestDataChange('showResultsImmediately', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Show results immediately after submission</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={testData.showCorrectAnswers}
                  onChange={(e) => handleTestDataChange('showCorrectAnswers', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Show correct answers in results</span>
              </label>
            </div>
          </div>

          {/* Questions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Questions ({questions.length})
              </h2>
              {!showQuestionForm && (
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(true)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              )}
            </div>

            {/* Question Form */}
            {showQuestionForm && (
              <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                <h3 className="font-medium text-slate-900 mb-4">
                  {editingQuestion ? 'Edit Question' : 'New Question'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Type</label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => {
                        const type = parseInt(e.target.value);
                        handleQuestionChange('type', type);
                        if (type === 2) initTrueFalseOptions();
                      }}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {questionTypes.map((qt) => (
                        <option key={qt.value} value={qt.value}>
                          {qt.label} - {qt.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Text *</label>
                    <textarea
                      value={currentQuestion.questionText}
                      onChange={(e) => handleQuestionChange('questionText', e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Enter your question"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Points</label>
                      <input
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => handleQuestionChange('points', parseFloat(e.target.value) || 1)}
                        min={0.1}
                        step={0.5}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Explanation (shown after)</label>
                      <input
                        type="text"
                        value={currentQuestion.explanation || ''}
                        onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Optional explanation"
                      />
                    </div>
                  </div>

                  {/* Answer Options for Multiple Choice / Multiple Select / True-False */}
                  {[0, 1, 2].includes(currentQuestion.type) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Answer Options {currentQuestion.type === 1 ? '(select all correct)' : '(select one correct)'}
                      </label>
                      <div className="space-y-2">
                        {currentQuestion.answerOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type={currentQuestion.type === 1 ? 'checkbox' : 'radio'}
                              name="correctAnswer"
                              checked={option.isCorrect}
                              onChange={(e) => {
                                if (currentQuestion.type === 1) {
                                  handleOptionChange(index, 'isCorrect', e.target.checked);
                                } else {
                                  // For single select, uncheck others
                                  setCurrentQuestion(prev => ({
                                    ...prev,
                                    answerOptions: prev.answerOptions.map((opt, i) => ({
                                      ...opt,
                                      isCorrect: i === index,
                                    })),
                                  }));
                                }
                              }}
                              className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={option.optionText}
                              onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                              disabled={currentQuestion.type === 2}
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100"
                              placeholder={`Option ${index + 1}`}
                            />
                            {currentQuestion.type !== 2 && currentQuestion.answerOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {currentQuestion.type !== 2 && (
                        <button
                          type="button"
                          onClick={addOption}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}

                  {/* Short Answer */}
                  {currentQuestion.type === 3 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Correct Answer(s) *
                      </label>
                      <input
                        type="text"
                        value={currentQuestion.correctShortAnswer || ''}
                        onChange={(e) => handleQuestionChange('correctShortAnswer', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Separate multiple acceptable answers with commas"
                      />
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={currentQuestion.caseSensitive}
                          onChange={(e) => handleQuestionChange('caseSensitive', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-600">Case sensitive</span>
                      </label>
                    </div>
                  )}

                  {/* Essay */}
                  {currentQuestion.type === 4 && (
                    <p className="text-sm text-slate-500 italic">
                      Essay questions require manual grading after submission.
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetQuestionForm}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveQuestion}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      {editingQuestion ? 'Update Question' : 'Add Question'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            {questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {questionTypes.find(qt => qt.value === question.type)?.label}
                        </span>
                        <span className="text-xs text-slate-400">• {question.points} pts</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{question.questionText}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editQuestion(question)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showQuestionForm && (
                <p className="text-center text-sm text-slate-500 py-8">
                  No questions added yet. Click &quot;Add Question&quot; to get started.
                </p>
              )
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/courses/${courseId}/tests`)}
              className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

