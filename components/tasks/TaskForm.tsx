"use client";

import type { HabitCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { autoGapDays, WEEKDAY_ORDER, type Weekday } from "@/lib/task-helpers";

const WEEKDAY_BUTTONS: { value: Weekday; label: string }[] = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
];

interface TaskFormProps {
  categories: HabitCategory[];
  defaultValues?: {
    name?: string;
    description?: string;
    categoryId?: string;
    frequency?: string;
    frequencyValue?: number;
    bucket?: string;
    scheduledWeekdays?: Weekday[];
    minGapDays?: number | null;
    reminderEnabled?: boolean;
    reminderTime?: string;
  };
  taskId?: string;
}

export function TaskForm({ categories, defaultValues, taskId }: TaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(
    defaultValues?.reminderEnabled ?? false,
  );
  const [frequency, setFrequency] = useState(
    defaultValues?.frequency ?? "WEEKLY",
  );
  const [frequencyValueInput, setFrequencyValueInput] = useState(() =>
    String(defaultValues?.frequencyValue ?? 1),
  );
  const [bucket, setBucket] = useState(defaultValues?.bucket ?? "DAY");
  const [scheduledWeekdays, setScheduledWeekdays] = useState<Weekday[]>(
    defaultValues?.scheduledWeekdays ?? [...WEEKDAY_ORDER],
  );
  const [customGap, setCustomGap] = useState(defaultValues?.minGapDays != null);
  const [minGapDaysInput, setMinGapDaysInput] = useState(() =>
    String(defaultValues?.minGapDays ?? 1),
  );

  const timesPerPeriod = useMemo(
    () => parseTimesPerPeriod(frequencyValueInput),
    [frequencyValueInput],
  );

  const autoGapHint = useMemo(
    () => autoGapDays({ frequency, frequencyValue: timesPerPeriod }),
    [frequency, timesPerPeriod],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      description: (formData.get("description") as string) || undefined,
      categoryId: (formData.get("categoryId") as string) || undefined,
      frequency,
      frequencyValue: parseTimesPerPeriod(
        String(formData.get("frequencyValue")),
      ),
      bucket,
      scheduledWeekdays,
      minGapDays:
        customGap && timesPerPeriod > 1
          ? parseMinGapDays(String(formData.get("minGapDays")))
          : null,
      reminderEnabled,
      reminderTime: reminderEnabled
        ? (formData.get("reminderTime") as string) || undefined
        : undefined,
    };

    const url = taskId ? `/api/tasks/${taskId}` : "/api/tasks";
    const method = taskId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/tasks");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <div>
          <p className="section-kicker">Basics</p>
          <p className="mt-2 text-sm text-[#b4a58a]">
            Keep the title clear so it is easy to scan when the task becomes
            due.
          </p>
        </div>

        <Input
          label="Task name"
          name="name"
          id="name"
          placeholder="Weekly groceries"
          defaultValue={defaultValues?.name}
          required
        />

        <Input
          label="Short note"
          name="description"
          id="description"
          placeholder="Optional note"
          defaultValue={defaultValues?.description ?? ""}
        />

        <Select
          label="Category"
          name="categoryId"
          id="categoryId"
          defaultValue={defaultValues?.categoryId ?? ""}
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </section>

      <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
        <div>
          <p className="section-kicker">Cadence</p>
          <p className="mt-2 text-sm text-[#b4a58a]">
            Set how often the task should appear and how many times it belongs
            in that period.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            title="Daily"
            body="Use for everyday upkeep."
            active={frequency === "DAILY"}
            onClick={() => setFrequency("DAILY")}
          />
          <ChoiceCard
            title="Weekly"
            body="Use for common recurring chores."
            active={frequency === "WEEKLY"}
            onClick={() => setFrequency("WEEKLY")}
          />
          <ChoiceCard
            title="Fortnightly"
            body="Use when every two weeks feels right."
            active={frequency === "FORTNIGHTLY"}
            onClick={() => setFrequency("FORTNIGHTLY")}
          />
          <ChoiceCard
            title="Monthly"
            body="Use for lower-frequency maintenance."
            active={frequency === "MONTHLY"}
            onClick={() => setFrequency("MONTHLY")}
          />
        </div>

        <Input
          label="Times per period"
          name="frequencyValue"
          id="frequencyValue"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={frequencyValueInput}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "") {
              setFrequencyValueInput("");
              return;
            }
            if (!/^\d+$/.test(next)) return;
            const n = Number.parseInt(next, 10);
            if (n > 30) return;
            setFrequencyValueInput(next);
          }}
          onBlur={() => {
            setFrequencyValueInput((prev) => (prev === "" ? "1" : prev));
          }}
        />
      </section>

      <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
        <div>
          <p className="section-kicker">Time of day</p>
          <p className="mt-2 text-sm text-[#b4a58a]">
            Choose where this belongs in your day.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["MORNING", "Morning", "Earlier-day momentum"],
            ["DAY", "Day", "General daytime tasks"],
            ["EVENING", "Evening", "Reset before the day ends"],
            ["BEFORE_BED", "Before bed", "Last touchpoints at night"],
          ].map(([value, title, body]) => (
            <ChoiceCard
              key={value}
              title={title}
              body={body}
              active={bucket === value}
              onClick={() => setBucket(value)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
        <div>
          <p className="section-kicker">Active weekdays</p>
          <p className="mt-2 text-sm text-[#b4a58a]">
            Only show this task as due on the selected days.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {WEEKDAY_BUTTONS.map(({ value, label }) => {
            const active = scheduledWeekdays.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setScheduledWeekdays((current) => {
                    if (current.includes(value)) {
                      if (current.length === 1) return current;
                      return current.filter((day) => day !== value);
                    }
                    return [...current, value];
                  });
                }}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-[rgba(230,196,139,0.42)] bg-[rgba(199,154,82,0.18)] text-[#f7f0e1]"
                    : "border-[rgba(216,196,160,0.16)] bg-[rgba(247,240,225,0.04)] text-[#b4a58a]"
                }`}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {timesPerPeriod > 1 && (
        <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
          <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[rgba(216,196,160,0.14)] bg-[rgba(12,17,16,0.45)] p-4">
            <div>
              <p className="font-semibold text-[#f7f0e1]">Custom spacing</p>
              <p className="mt-1 text-sm text-[#b4a58a]">
                Stop repeat completions from bunching up too closely.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomGap((value) => !value)}
              className={`h-8 w-14 rounded-full border transition-colors ${
                customGap
                  ? "border-[rgba(230,196,139,0.42)] bg-[rgba(199,154,82,0.18)]"
                  : "border-[rgba(216,196,160,0.16)] bg-[rgba(247,240,225,0.04)]"
              }`}
              aria-pressed={customGap}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-[#fff7ea] transition-transform ${
                  customGap ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {customGap ? (
            <Input
              label="Minimum days between completions"
              name="minGapDays"
              id="minGapDays"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={minGapDaysInput}
              onChange={(e) => {
                const next = e.target.value;
                if (next === "") {
                  setMinGapDaysInput("");
                  return;
                }
                if (!/^\d+$/.test(next)) return;
                const n = Number.parseInt(next, 10);
                if (n > 365) return;
                setMinGapDaysInput(next);
              }}
              onBlur={() => {
                setMinGapDaysInput((prev) => (prev === "" ? "0" : prev));
              }}
            />
          ) : (
            <p className="text-sm text-[#b4a58a]">
              Auto spacing will aim for about {autoGapHint} day
              {autoGapHint === 1 ? "" : "s"} between completions.
            </p>
          )}
        </section>
      )}

      <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
        <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[rgba(216,196,160,0.14)] bg-[rgba(12,17,16,0.45)] p-4">
          <div>
            <p className="font-semibold text-[#f7f0e1]">Daily reminder</p>
            <p className="mt-1 text-sm text-[#b4a58a]">
              Turn on a gentle nudge so this does not fall off your radar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReminderEnabled((value) => !value)}
            className={`h-8 w-14 rounded-full border transition-colors ${
              reminderEnabled
                ? "border-[rgba(230,196,139,0.42)] bg-[rgba(199,154,82,0.18)]"
                : "border-[rgba(216,196,160,0.16)] bg-[rgba(247,240,225,0.04)]"
            }`}
            aria-pressed={reminderEnabled}
          >
            <span
              className={`block h-6 w-6 rounded-full bg-[#fff7ea] transition-transform ${
                reminderEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {reminderEnabled && (
          <Input
            label="Reminder time"
            name="reminderTime"
            id="reminderTime"
            type="time"
            defaultValue={defaultValues?.reminderTime ?? "09:00"}
          />
        )}
      </section>

      <input type="hidden" name="frequency" value={frequency} />
      <input type="hidden" name="bucket" value={bucket} />

      {error && (
        <p className="rounded-2xl bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : taskId ? "Update Task" : "Create Task"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function parseTimesPerPeriod(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.min(30, n);
}

function parseMinGapDays(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(365, n);
}
