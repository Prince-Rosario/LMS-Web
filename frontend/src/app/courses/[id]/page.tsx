"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

type UserData = {
  userId: number;
  firstName: string;
  lastName: string;
  role: number;
  canTeach: boolean;
  canStudy: boolean;
};

type Course = {
  id: number;
  title: string;
  description?: string;
  invitationCode: string;
  teacherName: string;
  teacherId: number;
  status: number;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
};

type Material = {
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
};

const materialTypeIcons: Record<number, { icon: string; color: string; label: string }> = {
  0: { icon: "📚", color: "bg-blue-50 text-blue-700 border-blue-200", label: "Lecture" },
  1: { icon: "🎥", color: "bg-rose-50 text-rose-700 border-rose-200", label: "Video" },
  2: { icon: "📄", color: "bg-slate-50 text-slate-700 border-slate-200", label: "Document" },
  3: { icon: "📊", color: "bg-orange-50 text-orange-700 border-orange-200", label: "Presentation" },
  4: { icon: "🔗", color: "bg-violet-50 text-violet-700 border-violet-200", label: "Link" },
  5: { icon: "🖼️", color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Image" },
  6: { icon: "📕", color: "bg-red-50 text-red-700 border-red-200", label: "PDF" },
  7: { icon: "📢", color: "bg-amber-50 text-amber-700 border-amber-200", label: "Post" }
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postTopic, setPostTopic] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [topics, setTopics] = useState<string[]>([]);
  const [attachmentType, setAttachmentType] = useState<"none" | "file" | "link">("none");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    loadCourseDetails(token);
    loadMaterials(token);
  }, [courseId, router]);

  useEffect(() => {
    // Filter materials by topic
    if (selectedTopic === "all") {
      setFilteredMaterials(materials);
    } else {
      setFilteredMaterials(materials.filter(m => m.topic === selectedTopic));
    }
  }, [selectedTopic, materials]);

  const loadCourseDetails = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5050/api/courses/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const courses = await res.json();
        const foundCourse = courses.find((c: Course) => c.id === parseInt(courseId));

        if (foundCourse) {
          setCourse(foundCourse);
          const userData = JSON.parse(localStorage.getItem("user") || "{}");
          setIsTeacher(foundCourse.teacherId === userData.userId);
        } else {
          alert("Course not found");
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Failed to load course:", error);
      alert("Failed to load course details");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (token: string) => {
    try {
      const res = await fetch(
        `http://localhost:5050/api/materials/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setMaterials(data);

        // Extract unique topics
        const uniqueTopics = Array.from(new Set(data.map((m: Material) => m.topic).filter(Boolean)));
        setTopics(uniqueTopics as string[]);
      }
    } catch (error) {
      console.error("Failed to load materials:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setAttachmentFile(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim()) {
      alert("Please enter a title");
      return;
    }

    if (attachmentType === "link" && attachmentUrl && !attachmentUrl.startsWith("http")) {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setPosting(true);
    try {
      const token = localStorage.getItem("token");

      const postData: any = {
        courseId: parseInt(courseId),
        title: postTitle,
        description: postDescription || null,
        topic: postTopic || null,
      };

      // Handle file attachment
      if (attachmentType === "file" && attachmentFile) {
        const base64Data = await convertFileToBase64(attachmentFile);
        postData.fileDataBase64 = base64Data;
        postData.fileName = attachmentFile.name;
        postData.contentType = attachmentFile.type;
      }

      // Handle link attachment
      if (attachmentType === "link" && attachmentUrl) {
        postData.attachmentUrl = attachmentUrl;
      }

      const res = await fetch("http://localhost:5050/api/materials/create-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (res.ok) {
        setPostTitle("");
        setPostDescription("");
        setPostTopic("");
        setAttachmentType("none");
        setAttachmentFile(null);
        setAttachmentUrl("");
        setShowPostForm(false);
        loadMaterials(token!);
      } else {
        const errorData = await res.json();
        alert(`Failed to create post: ${errorData.title || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleMarkAsRead = async (materialId: number, isCurrentlyRead: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5050/api/materials/mark-as-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialId: materialId,
          isRead: !isCurrentlyRead,
        }),
      });

      if (res.ok) {
        // Update local state
        setMaterials(materials.map(m =>
          m.id === materialId ? { ...m, isRead: !isCurrentlyRead } : m
        ));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDownload = async (materialId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5050/api/materials/${materialId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const material = materials.find(m => m.id === materialId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = material?.fileName || "download";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download:", error);
      alert("Failed to download file");
    }
  };

  if (loading || !course || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading course...</p>
        </div>
      </div>
    );
  }

  const statusBadge = () => {
    switch (course.status) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Pending
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const readCount = materials.filter(m => m.isRead).length;
  const totalCount = materials.length;
  const progressPercentage = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              {!isTeacher && totalCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Progress:</span>
                  <span className="font-semibold text-slate-900">{progressPercentage}%</span>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {statusBadge()}
            </div>
          </div>
        </div>
      </header>

      {/* Course Hero */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {course.title}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {course.description || "No description"}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {course.teacherName}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Code: {course.invitationCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4">
            {/* Create Post Card (Teachers only) */}
            {isTeacher && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {!showPostForm ? (
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <span className="text-lg font-semibold text-slate-700">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors">
                      Share something with your class...
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Create Post</h3>
                      <button
                        onClick={() => {
                          setShowPostForm(false);
                          setPostTitle("");
                          setPostDescription("");
                          setPostTopic("");
                          setAttachmentType("none");
                          setAttachmentFile(null);
                          setAttachmentUrl("");
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Title"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={postDescription}
                      onChange={(e) => setPostDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                    />
                    <input
                      type="text"
                      placeholder="Topic (optional)"
                      value={postTopic}
                      onChange={(e) => setPostTopic(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />

                    {/* Attachment Options */}
                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Add Attachment (Optional)
                      </label>
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => {
                            setAttachmentType("none");
                            setAttachmentFile(null);
                            setAttachmentUrl("");
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${attachmentType === "none"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => {
                            setAttachmentType("file");
                            setAttachmentUrl("");
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${attachmentType === "file"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                        >
                          📎 File
                        </button>
                        <button
                          onClick={() => {
                            setAttachmentType("link");
                            setAttachmentFile(null);
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${attachmentType === "link"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                        >
                          🔗 Link
                        </button>
                      </div>

                      {attachmentType === "file" && (
                        <div>
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                            className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          />
                          {attachmentFile && (
                            <p className="mt-2 text-sm text-slate-600">
                              Selected: {attachmentFile.name} ({Math.round(attachmentFile.size / 1024)}KB)
                            </p>
                          )}
                        </div>
                      )}

                      {attachmentType === "link" && (
                        <input
                          type="url"
                          placeholder="https://example.com/resource"
                          value={attachmentUrl}
                          onChange={(e) => setAttachmentUrl(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowPostForm(false);
                          setPostTitle("");
                          setPostDescription("");
                          setPostTopic("");
                          setAttachmentType("none");
                          setAttachmentFile(null);
                          setAttachmentUrl("");
                        }}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={posting || !postTitle.trim()}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {posting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Materials Feed */}
            {filteredMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900">No content yet</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isTeacher ? "Create a post or upload materials to get started" : "Your instructor hasn't posted anything yet"}
                </p>
                {isTeacher && (
                  <button
                    onClick={() => router.push(`/courses/${courseId}/materials`)}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload Material
                  </button>
                )}
              </div>
            ) : (
              filteredMaterials.map((material) => {
                const typeInfo = materialTypeIcons[material.type] || materialTypeIcons[2];
                return (
                  <div
                    key={material.id}
                    className={`rounded-xl border ${!isTeacher && material.isRead
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-slate-200 bg-white'
                      } p-6 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${typeInfo.color}`}>
                        <span className="text-2xl">{typeInfo.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 truncate">{material.title}</h3>
                            {material.description && (
                              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{material.description}</p>
                            )}
                          </div>
                          {!isTeacher && (
                            <button
                              onClick={() => handleMarkAsRead(material.id, material.isRead || false)}
                              className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${material.isRead
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              title={material.isRead ? "Mark as unread" : "Mark as read"}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          {material.topic && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {material.topic}
                            </span>
                          )}
                          <span>•</span>
                          <span>{material.uploadedBy}</span>
                          <span>•</span>
                          <span>{new Date(material.uploadedAt).toLocaleDateString()}</span>
                        </div>

                        {/* Actions */}
                        {(material.hasFileData || material.fileUrl) && (
                          <div className="mt-4 flex gap-2">
                            {material.hasFileData && (
                              <button
                                onClick={() => handleDownload(material.id)}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download {material.fileName}
                              </button>
                            )}
                            {material.fileUrl && (
                              <a
                                href={material.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open Link
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Filter by Topic */}
            {topics.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Filter by Topic</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedTopic("all")}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedTopic === "all"
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    All Topics ({materials.length})
                  </button>
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${selectedTopic === topic
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {topic} ({materials.filter(m => m.topic === topic).length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {isTeacher ? (
                  <>
                    <button
                      onClick={() => router.push(`/courses/${courseId}/materials`)}
                      className="flex w-full items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Upload Material
                    </button>
                    <button
                      onClick={() => router.push(`/courses/${courseId}/edit`)}
                      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Course
                    </button>
                    <button
                      onClick={() => router.push(`/courses/${courseId}/students`)}
                      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Manage Students
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => router.push(`/courses/${courseId}/materials`)}
                    className="flex w-full items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    View All Materials
                  </button>
                )}
              </div>
            </div>

            {/* Course Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Course Code</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
                  {course.invitationCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(course.invitationCode);
                    alert("Code copied!");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
