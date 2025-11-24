"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        warning: (message: string) => void;
        info: (message: string) => void;
    };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: "text-emerald-500",
        text: "text-emerald-800",
    },
    error: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        icon: "text-rose-500",
        text: "text-rose-800",
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: "text-amber-500",
        text: "text-amber-800",
    },
    info: {
        bg: "bg-sky-50",
        border: "border-sky-200",
        icon: "text-sky-500",
        text: "text-sky-800",
    },
};

const ToastIcon = ({ type }: { type: ToastType }) => {
    const iconClass = `h-5 w-5 ${toastStyles[type].icon}`;
    
    switch (type) {
        case "success":
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            );
        case "error":
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        case "warning":
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        case "info":
            return (
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const styles = toastStyles[toast.type];
    
    return (
        <div
            className={`
                pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3.5 shadow-lg
                ${styles.bg} ${styles.border}
                animate-in slide-in-from-top-2 fade-in duration-300
            `}
            role="alert"
        >
            <ToastIcon type={toast.type} />
            <p className={`flex-1 text-sm font-medium ${styles.text}`}>
                {toast.message}
            </p>
            <button
                onClick={() => onDismiss(toast.id)}
                className={`rounded-lg p-1 transition-colors hover:bg-black/5 ${styles.text}`}
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newToast: Toast = { id, message, type };
        
        setToasts((prev) => [...prev, newToast]);
        
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    const toast = {
        success: (message: string) => addToast(message, "success"),
        error: (message: string) => addToast(message, "error"),
        warning: (message: string) => addToast(message, "warning"),
        info: (message: string) => addToast(message, "info"),
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            
            {/* Toast Container */}
            <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center gap-2 p-4 pt-20">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

