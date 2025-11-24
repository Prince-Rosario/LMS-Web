"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "default";
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context;
}

interface DialogState extends ConfirmOptions {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "default",
        resolve: null,
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialog({
                isOpen: true,
                title: options.title,
                message: options.message,
                confirmText: options.confirmText || "Confirm",
                cancelText: options.cancelText || "Cancel",
                variant: options.variant || "default",
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        dialog.resolve?.(true);
        setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

    const handleCancel = () => {
        dialog.resolve?.(false);
        setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
    };

    const variantStyles = {
        danger: {
            icon: "bg-rose-100 text-rose-600",
            button: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
        },
        warning: {
            icon: "bg-amber-100 text-amber-600",
            button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
        },
        default: {
            icon: "bg-slate-100 text-slate-600",
            button: "bg-slate-900 hover:bg-slate-800 focus:ring-slate-500",
        },
    };

    const styles = variantStyles[dialog.variant || "default"];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Dialog Overlay */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[200] overflow-y-auto">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                        onClick={handleCancel}
                    />
                    
                    {/* Dialog */}
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div 
                            className="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 fade-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${styles.icon}`}>
                                {dialog.variant === "danger" ? (
                                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                ) : dialog.variant === "warning" ? (
                                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                ) : (
                                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>

                            {/* Content */}
                            <div className="mt-4 text-center">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {dialog.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    {dialog.message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                                >
                                    {dialog.cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
                                >
                                    {dialog.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

