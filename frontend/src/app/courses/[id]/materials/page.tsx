"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Material = {
    id: number;
    title: string;
    description?: string;
    type: number; // 0=Lecture, 1=Video, 2=Document, 3=Presentation, 4=Link, 5=Image, 6=PDF
    fileName?: string;
    contentType?: string;
    fileSize?: number;
    hasFileData: boolean;
    fileUrl?: string;
    topic?: string;
    courseName: string;
    uploadedBy: string;
    uploadedAt: string;
};

type UserData = {
    userId: number;
    canTeach: boolean;
    canStudy: boolean;
};

export default function MaterialsPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;

    const [user, setUser] = useState<UserData | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadType, setUploadType] = useState<"file" | "video">("file");

    // Upload form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [materialType, setMaterialType] = useState(6); // PDF default
    const [topic, setTopic] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!userData || !token) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        loadMaterials(token);
    }, [courseId, router]);

    const loadMaterials = async (token: string) => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:5050/api/materials/course/${courseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                setMaterials(data);
            }
        } catch (error) {
            console.error("Failed to load materials:", error);
        } finally {
            setLoading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g., "data:application/pdf;base64,")
                const base64 = result.split(",")[1];
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileUpload = async () => {
        if (!file || !title) {
            alert("Please provide a title and select a file");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        setUploading(true);

        try {
            const base64Data = await fileToBase64(file);

            const payload = {
                title,
                description: description || undefined,
                type: materialType,
                fileDataBase64: base64Data,
                fileName: file.name,
                contentType: file.type,
                topic: topic || undefined,
                courseId: parseInt(courseId),
            };

            const res = await fetch("http://localhost:5050/api/materials/upload-file", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert("File uploaded successfully!");
                resetForm();
                loadMaterials(token);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to upload file");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    const handleVideoLinkAdd = async () => {
        if (!videoUrl || !title) {
            alert("Please provide a title and video URL");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        setUploading(true);

        try {
            const payload = {
                title,
                description: description || undefined,
                videoUrl,
                topic: topic || undefined,
                courseId: parseInt(courseId),
            };

            const res = await fetch("http://localhost:5050/api/materials/add-video-link", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert("Video link added successfully!");
                resetForm();
                loadMaterials(token);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to add video link");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to add video link");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (materialId: number, fileName?: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(
                `http://localhost:5050/api/materials/${materialId}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName || "download";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert("Failed to download file");
            }
        } catch (error) {
            console.error("Download error:", error);
            alert("Failed to download file");
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setTopic("");
        setFile(null);
        setVideoUrl("");
        setShowUploadForm(false);
    };

    const getMaterialTypeLabel = (type: number) => {
        const types = ["Lecture", "Video", "Document", "Presentation", "Link", "Image", "PDF"];
        return types[type] || "Unknown";
    };

    const getMaterialIcon = (type: number, hasFileData: boolean) => {
        if (type === 1) {
            // Video
            return (
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
            );
        } else if (type === 6 || type === 2) {
            // PDF or Document
            return (
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            );
        } else if (type === 5) {
            // Image
            return (
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            );
        } else {
            // Default
            return (
                <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
            );
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
                    <p className="text-sm text-slate-600">Loading materials...</p>
                </div>
            </div>
        );
    }

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
                        {user?.canTeach && (
                            <button
                                onClick={() => setShowUploadForm(!showUploadForm)}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                            >
                                {showUploadForm ? (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Material
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        Course Materials
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        {materials.length} material{materials.length !== 1 ? "s" : ""} available
                    </p>
                </div>
                {/* Upload Form */}
                {showUploadForm && user?.canTeach && (
                    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Add New Material</h2>

                        {/* Upload Type Tabs */}
                        <nav className="mt-6 flex gap-1 rounded-xl bg-slate-100/50 p-1">
                            <button
                                onClick={() => setUploadType("file")}
                                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                                    uploadType === "file"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Upload File
                            </button>
                            <button
                                onClick={() => setUploadType("video")}
                                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                                    uploadType === "video"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Add Video Link
                            </button>
                        </nav>

                        <div className="mt-6 space-y-5">
                            <div>
                                <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-900">
                                    Title
                                    <span className="ml-1 text-rose-500">*</span>
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    placeholder="Enter material title"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-900">
                                    Description
                                    <span className="ml-1.5 text-xs font-normal text-slate-500">(Optional)</span>
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    placeholder="Enter material description"
                                />
                            </div>

                            <div>
                                <label htmlFor="topic" className="mb-2 block text-sm font-medium text-slate-900">
                                    Topic
                                    <span className="ml-1.5 text-xs font-normal text-slate-500">(Optional)</span>
                                </label>
                                <input
                                    id="topic"
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    placeholder="e.g., Week 1, Chapter 3"
                                />
                            </div>

                            {uploadType === "file" ? (
                                <>
                                    <div>
                                        <label htmlFor="materialType" className="mb-2 block text-sm font-medium text-slate-900">
                                            Material Type
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>
                                        <select
                                            id="materialType"
                                            value={materialType}
                                            onChange={(e) => setMaterialType(parseInt(e.target.value))}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                        >
                                            <option value={6}>PDF</option>
                                            <option value={2}>Document</option>
                                            <option value={3}>Presentation</option>
                                            <option value={5}>Image</option>
                                            <option value={0}>Lecture Notes</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="file" className="mb-2 block text-sm font-medium text-slate-900">
                                            File (Max 5MB)
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="file"
                                            type="file"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                                        />
                                        {file && (
                                            <p className="mt-2 text-xs text-slate-600">
                                                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleFileUpload}
                                        disabled={uploading || !file || !title}
                                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Uploading...
                                            </span>
                                        ) : (
                                            "Upload File"
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="videoUrl" className="mb-2 block text-sm font-medium text-slate-900">
                                            Video URL (YouTube, Vimeo, etc.)
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="videoUrl"
                                            type="url"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleVideoLinkAdd}
                                        disabled={uploading || !videoUrl || !title}
                                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Adding...
                                            </span>
                                        ) : (
                                            "Add Video Link"
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Materials List */}
                {materials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 py-20">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">No materials yet</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            {user?.canTeach
                                ? "Upload your first material to get started"
                                : "Your teacher hasn't uploaded any materials yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {materials.map((material) => (
                            <div
                                key={material.id}
                                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
                            >
                                <div className="mb-4 flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        {getMaterialIcon(material.type, material.hasFileData)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-semibold text-slate-900 group-hover:text-slate-700">
                                            {material.title}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {getMaterialTypeLabel(material.type)}
                                        </p>
                                    </div>
                                </div>

                                {material.description && (
                                    <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                                        {material.description}
                                    </p>
                                )}

                                {material.topic && (
                                    <div className="mb-4">
                                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                            {material.topic}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-4 space-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                    <p>Uploaded by {material.uploadedBy}</p>
                                    <p>{new Date(material.uploadedAt).toLocaleDateString()}</p>
                                    {material.fileName && (
                                        <p className="truncate font-mono">{material.fileName} • {formatFileSize(material.fileSize)}</p>
                                    )}
                                </div>

                                {material.hasFileData ? (
                                    <button
                                        onClick={() => handleDownload(material.id, material.fileName)}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                ) : material.fileUrl ? (
                                    <a
                                        href={material.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Open Link
                                    </a>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}


