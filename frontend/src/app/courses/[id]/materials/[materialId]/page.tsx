'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Comments } from '@/components/Comments';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface Material {
  id: number;
  title: string;
  description?: string;
  type: number;
  topic?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  hasFileData: boolean;
  fileUrl?: string;
  courseId: number;
  courseName: string;
  uploadedBy: string;
  uploadedAt: string;
  isRead?: boolean;
}

const materialTypeIcons: Record<number, { icon: string; color: string; label: string }> = {
  0: { icon: '📚', color: 'bg-blue-100 text-blue-700', label: 'Lecture' },
  1: { icon: '🎥', color: 'bg-rose-100 text-rose-700', label: 'Video' },
  2: { icon: '📄', color: 'bg-slate-100 text-slate-700', label: 'Document' },
  3: { icon: '📊', color: 'bg-orange-100 text-orange-700', label: 'Presentation' },
  4: { icon: '🔗', color: 'bg-violet-100 text-violet-700', label: 'Link' },
  5: { icon: '🖼️', color: 'bg-emerald-100 text-emerald-700', label: 'Image' },
  6: { icon: '📕', color: 'bg-red-100 text-red-700', label: 'PDF' },
  7: { icon: '📢', color: 'bg-amber-100 text-amber-700', label: 'Post' },
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getVimeoVideoId = (url: string): string | null => {
  const regex = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const materialId = parseInt(params.materialId as string);
  const { toast } = useToast();

  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showComments, setShowComments] = useState(true);

  useEffect(() => {
    const fetchMaterial = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch material
        const materialResponse = await fetch(`${API_URL}/api/materials/${materialId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (materialResponse.ok) {
          const materialData = await materialResponse.json();
          setMaterial(materialData);

          // Check if user is teacher
          const coursesResponse = await fetch(`${API_URL}/api/courses/my-courses`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (coursesResponse.ok) {
            const courses = await coursesResponse.json();
            const currentCourse = courses.find((c: { id: number; teacherId: number }) => c.id === courseId);
            setIsTeacher(currentCourse?.teacherId === user.userId);
          }
        } else {
          toast.error('Failed to load material');
          router.push(`/courses/${courseId}`);
        }
      } catch (error) {
        toast.error('Failed to load material');
        router.push(`/courses/${courseId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId, courseId, router, toast]);

  const handleDownload = async () => {
    if (!material) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/materials/${materialId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success('Download started');
      } else {
        toast.error('Failed to download file');
      }
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleMarkAsRead = async () => {
    if (!material || isTeacher) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/materials/${materialId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead: !material.isRead }),
      });

      if (response.ok) {
        setMaterial(prev => prev ? { ...prev, isRead: !prev.isRead } : null);
        toast.success(material.isRead ? 'Marked as unread' : 'Marked as completed');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading material...</p>
        </div>
      </div>
    );
  }

  if (!material) return null;

  const typeInfo = materialTypeIcons[material.type] || materialTypeIcons[2];
  const youtubeId = material.fileUrl ? getYouTubeVideoId(material.fileUrl) : null;
  const vimeoId = material.fileUrl ? getVimeoVideoId(material.fileUrl) : null;
  const hasVideoPreview = material.type === 1 && (youtubeId || vimeoId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Course
            </button>
            <div className="flex items-center gap-2">
              {!isTeacher && (
                <button
                  onClick={handleMarkAsRead}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    material.isRead
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {material.isRead ? 'Completed' : 'Mark as Done'}
                </button>
              )}
              {isTeacher && (
                <button
                  onClick={() => router.push(`/courses/${courseId}/materials/${materialId}/edit`)}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Material Card */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Video Preview */}
          {hasVideoPreview && (
            <div className="relative aspect-video bg-slate-900">
              {youtubeId && (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {vimeoId && (
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${typeInfo.color}`}>
                  <span className="text-lg">{typeInfo.icon}</span>
                  {typeInfo.label}
                </span>
                {material.topic && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {material.topic}
                  </span>
                )}
              </div>
              {!isTeacher && material.isRead && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Completed
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-4">{material.title}</h1>

            {/* Description */}
            {material.description && (
              <div className="prose prose-slate max-w-none mb-6">
                <p className="text-slate-600 whitespace-pre-wrap">{material.description}</p>
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {material.uploadedBy}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(material.uploadedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {material.fileSize && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {formatFileSize(material.fileSize)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {material.hasFileData && (
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download {material.fileName && `(${material.fileName})`}
                </button>
              )}
              {material.fileUrl && !hasVideoPreview && (
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Link
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setShowComments(!showComments)}
            className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100"
          >
            <h2 className="text-lg font-semibold text-slate-900">Comments</h2>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${showComments ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showComments && (
            <div className="p-6">
              <Comments entityType="Material" entityId={materialId} courseId={courseId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}




