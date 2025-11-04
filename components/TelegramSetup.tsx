"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Send, Loader2 } from "lucide-react";

interface TelegramSetupProps {
  userId: string;
  currentChatId?: string | null;
  isEnabled?: boolean;
  onUpdate?: () => void;
}

export function TelegramSetup({
  userId,
  currentChatId,
  isEnabled = false,
  onUpdate,
}: TelegramSetupProps) {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<
    "connected" | "disconnected" | "checking"
  >(currentChatId ? "connected" : "disconnected");

  // Get bot username from environment or default
  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "your_bot";
  const verificationLink = `https://t.me/${botUsername}?start=verify_${userId}`;

  useEffect(() => {
    setStatus(currentChatId ? "connected" : "disconnected");
  }, [currentChatId]);

  const handleTestNotification = async () => {
    if (!currentChatId) {
      toast({
        title: "Not Connected",
        description: "Please connect your Telegram account first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const response = await fetch("/api/notifications/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: currentChatId,
          message: `
🧪 *Test Notification*

This is a test notification from iProxy!

If you received this message, your Telegram notifications are working correctly. ✅

You will receive notifications for:
• Order confirmations
• Proxy activations
• Important account updates
          `.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Test Sent!",
          description: "Check your Telegram for the test message",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Failed to send test notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing notification:", error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_chat_id: null,
          notify_telegram: false,
        }),
      });

      if (response.ok) {
        setStatus("disconnected");
        toast({
          title: "Disconnected",
          description: "Telegram notifications have been disabled",
        });
        onUpdate?.();
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect Telegram",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className="bg-neutral-800 rounded-xl p-6"
      style={{ border: "1px solid rgb(64, 64, 64)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            Telegram Notifications
          </h3>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {status === "connected" ? (
            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full border border-gray-500/20 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {status === "connected" ? (
        <div className="space-y-4">
          {/* Connected Info */}
          <div className="bg-neutral-900 rounded-lg p-8">
            <p className="text-sm text-neutral-300 mb-2">
              Your Telegram account is connected
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              Chat ID: {currentChatId}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleTestNotification}
              disabled={isTesting}
              className="flex-1 px-4 py-2 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Test
                </>
              )}
            </button>

            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-neutral-900 rounded-lg p-5">
            <p className="text-sm text-neutral-300 mb-3 font-semibold">
              How to connect:
            </p>
            <ol className="text-sm text-neutral-400 space-y-2 list-decimal list-inside">
              <li>Click the button below to open Telegram</li>
              <li>Click "START" in the bot chat</li>
              <li>You'll be automatically connected!</li>
            </ol>
          </div>

          {/* Connect Button */}
          <a
            href={verificationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium rounded-lg transition-colors text-center flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            Open Telegram Bot
          </a>
        </div>
      )}
    </div>
  );
}
