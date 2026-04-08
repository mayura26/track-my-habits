"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function TestPushButton() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Failed to send test notification");
        return;
      }

      if (data.sent === 0) {
        setStatus("error");
        setMessage(
          "No push subscriptions found. Make sure you allowed notifications in your browser.",
        );
        return;
      }

      setStatus("success");
      setMessage(`Notification sent to ${data.sent} device(s)`);
    } catch {
      setStatus("error");
      setMessage("Network error — is the server running?");
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending..." : "Send Test Notification"}
      </Button>

      {status === "success" && (
        <p className="rounded-lg bg-green-900/20 p-3 text-sm text-green-400">
          {message}
        </p>
      )}
      {status === "error" && (
        <p className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}
