"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface HabitResetButtonProps {
  habitId: string;
}

export function HabitResetButton({ habitId }: HabitResetButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (loading) return;
    setOpen(false);
    setError(null);
  };

  const reset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/habits/${habitId}/reset`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          typeof data.error === "string" ? data.error : "Could not reset habit",
        );
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not reset habit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset habit
      </Button>

      <Dialog open={open} onClose={close} title="Reset habit?">
        <p className="text-sm leading-relaxed text-[#d8c9ad]">
          Clears all past logs and sets your start date to today. Streaks and
          completion stats start fresh. XP and badges are kept.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={close}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={reset}
            disabled={loading}
          >
            {loading ? "Resetting…" : "Reset habit"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
