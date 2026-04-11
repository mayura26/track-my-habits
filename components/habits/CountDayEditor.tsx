"use client";

import {
  type KeyboardEvent,
  useEffect,
  useState,
  type RefObject,
} from "react";

export interface CountDayEditorProps {
  /** Current total for the day (sum of completed logs). */
  value: number;
  thresholdValue: number;
  isPending: boolean;
  firstButtonRef: RefObject<HTMLButtonElement | null>;
  /** Save applies the entered total (including 0 as an explicit zero-day log). */
  onSave: (value: number) => void;
  /** Remove all logs for the day (history “Clear day”). */
  onClearDay: () => void;
  onCancel: () => void;
  /** When true, there is nothing to clear (e.g. day was never logged). */
  disableClear: boolean;
  inputId?: string;
}

export function CountDayEditor({
  value,
  thresholdValue,
  isPending,
  firstButtonRef,
  onSave,
  onClearDay,
  onCancel,
  disableClear,
  inputId = "count-day-value",
}: CountDayEditorProps) {
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const parsed = Number(draft);
  const isValid = Number.isFinite(parsed) && parsed >= 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave(parsed);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d826d]"
        >
          Value (target: {thresholdValue})
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          disabled={isPending}
          className="mt-2 w-full rounded-2xl border border-[rgba(216,196,160,0.22)] bg-[rgba(6,5,4,0.42)] px-4 py-3 text-lg font-semibold text-[#fff7ea] tabular-nums outline-none focus:border-[rgba(230,196,139,0.5)] disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-[#8d826d]">
          Save with 0 to record a zero for this day. Clear day removes all logs.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          ref={firstButtonRef}
          type="button"
          onClick={handleSave}
          disabled={isPending || !isValid}
          className="rounded-full border border-[rgba(230,196,139,0.5)] bg-[linear-gradient(135deg,#c79a52,#8c6737)] px-4 py-2.5 text-sm font-semibold text-[#fff9ef] transition-[filter] hover:brightness-110 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClearDay}
          disabled={isPending || disableClear}
          className="rounded-full border border-[rgba(216,196,160,0.22)] bg-[rgba(247,240,225,0.04)] px-4 py-2.5 text-sm font-semibold text-[#f7f0e1] transition-colors hover:bg-[rgba(247,240,225,0.08)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
        >
          Clear day
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="w-full text-xs text-[#8d826d] hover:text-[#f7f0e1]"
      >
        Cancel
      </button>
    </div>
  );
}
