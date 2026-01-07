"use client";
import { ReactNode } from "react";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./ConfirmDialog";
import { ChatProvider } from "@/contexts/ChatContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <ConfirmProvider>
                <NotificationProvider>
                    <ChatProvider>
                        {children}
                    </ChatProvider>
                </NotificationProvider>
            </ConfirmProvider>
        </ToastProvider>
    );
}

