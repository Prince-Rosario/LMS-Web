"use client";
import { ReactNode } from "react";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./ConfirmDialog";
import { ChatProvider } from "@/contexts/ChatContext";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <ConfirmProvider>
                <ChatProvider>
                    {children}
                </ChatProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
}

