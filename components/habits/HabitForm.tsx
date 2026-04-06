"use client";

import type { HabitCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface HabitFormProps {
  categories: HabitCategory[];
  defaultValues?: {
    name?: string;
    description?: string;
    categoryId?: string;
    trackingType?: string;
    thresholdType?: string;
    thresholdValue?: number;
    thresholdWindow?: number;
    countIncrement?: number | null;
  };
  habitId?: string;
}

export function HabitForm({
  categories,
  defaultValues,
  habitId,
}: HabitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingType, setTrackingType] = useState(
    defaultValues?.trackingType ?? "BOOLEAN",
  );
  const [thresholdType, setThresholdType] = useState(
    defaultValues?.thresholdType ?? "DAILY",
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const startDateVal = formData.get("startDate") as string | null;
    const ciRaw = formData.get("countIncrement");
    let countIncrement: number | null | undefined;
    if (trackingType === "COUNT") {
      if (ciRaw === "" || ciRaw == null) {
        countIncrement = habitId ? null : undefined;
      } else {
        const n = Number(ciRaw);
        countIncrement =
          Number.isFinite(n) && n > 0 ? n : habitId ? null : undefined;
      }
    }

    const body = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      categoryId: formData.get("categoryId"),
      trackingType,
      thresholdType,
      thresholdValue: Number(formData.get("thresholdValue")) || 1,
      thresholdWindow: formData.get("thresholdWindow")
        ? Number(formData.get("thresholdWindow"))
        : undefined,
      ...(startDateVal
        ? { startDate: new Date(startDateVal).toISOString() }
        : {}),
      ...(trackingType === "COUNT" && countIncrement !== undefined
        ? { countIncrement }
        : {}),
      ...(trackingType === "BOOLEAN" ? { countIncrement: null } : {}),
    };

    const url = habitId ? `/api/habits/${habitId}` : "/api/habits";
    const method = habitId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/habits");
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
            Name the ritual and place it in a category you can recognize
            instantly.
          </p>
        </div>

        <Input
          label="Habit name"
          name="name"
          id="name"
          placeholder="Morning walk"
          defaultValue={defaultValues?.name}
          required
        />

        <Input
          label="Short note"
          name="description"
          id="description"
          placeholder="What keeps you coming back"
          defaultValue={defaultValues?.description ?? ""}
        />

        {!habitId && (
          <Input
            label="Start date"
            name="startDate"
            id="startDate"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        )}

        <Select
          label="Category"
          name="categoryId"
          id="categoryId"
          defaultValue={defaultValues?.categoryId}
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </section>

      <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
        <div>
          <p className="section-kicker">Tracking style</p>
          <p className="mt-2 text-sm text-[#b4a58a]">
            Choose the simplest way to mark success.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            title="Done / not done"
            body="Best for simple rituals you complete once."
            active={trackingType === "BOOLEAN"}
            onClick={() => setTrackingType("BOOLEAN")}
          />
          <ChoiceCard
            title="Count toward a goal"
            body="Best for steps, pages, reps, and other measurable habits."
            active={trackingType === "COUNT"}
            onClick={() => setTrackingType("COUNT")}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
        <div>
          <p className="section-kicker">Cadence</p>
          <p className="mt-2 text-sm text-[#b4a58a]">
            Decide how this habit should be evaluated.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ChoiceCard
            title="Daily"
            body="A fresh check-in every day."
            active={thresholdType === "DAILY"}
            onClick={() => setThresholdType("DAILY")}
          />
          <ChoiceCard
            title="Weekly total"
            body="Hit a target over the course of a week."
            active={thresholdType === "WEEKLY_TOTAL"}
            onClick={() => setThresholdType("WEEKLY_TOTAL")}
          />
          <ChoiceCard
            title="Rolling window"
            body="Stay consistent over the last few days."
            active={thresholdType === "ROLLING_WINDOW"}
            onClick={() => setThresholdType("ROLLING_WINDOW")}
          />
        </div>

        {trackingType === "COUNT" && (
          <>
            <Input
              label={
                thresholdType === "DAILY"
                  ? "Target per day"
                  : thresholdType === "WEEKLY_TOTAL"
                    ? "Target per week"
                    : "Times required"
              }
              name="thresholdValue"
              id="thresholdValue"
              type="number"
              min="1"
              step="any"
              defaultValue={defaultValues?.thresholdValue ?? 1}
              required
            />
            <Input
              label="Add per tap (optional)"
              name="countIncrement"
              id="countIncrement"
              type="number"
              min="0.1"
              step="any"
              placeholder="Auto from goal"
              defaultValue={
                defaultValues?.countIncrement != null
                  ? String(defaultValues.countIncrement)
                  : ""
              }
            />
            <p className="text-xs text-[#8d826d]">
              Leave blank to pick step size on the habit card (recommended), or
              set a fixed amount for every + tap.
            </p>
          </>
        )}

        {thresholdType === "ROLLING_WINDOW" && (
          <Input
            label="Window size in days"
            name="thresholdWindow"
            id="thresholdWindow"
            type="number"
            min="2"
            placeholder="7"
            defaultValue={defaultValues?.thresholdWindow}
          />
        )}

        {thresholdType !== "ROLLING_WINDOW" && trackingType === "BOOLEAN" && (
          <input type="hidden" name="thresholdValue" value="1" />
        )}
      </section>

      {error && (
        <p className="rounded-2xl bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : habitId ? "Update Habit" : "Create Habit"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
