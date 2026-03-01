"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { HabitCategory } from "@prisma/client";

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
  };
  habitId?: string; // for edit mode
}

export function HabitForm({ categories, defaultValues, habitId }: HabitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [trackingType, setTrackingType] = useState(
    defaultValues?.trackingType ?? "BOOLEAN"
  );
  const [thresholdType, setThresholdType] = useState(
    defaultValues?.thresholdType ?? "DAILY"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      categoryId: formData.get("categoryId"),
      trackingType: formData.get("trackingType"),
      thresholdType: formData.get("thresholdType"),
      thresholdValue: Number(formData.get("thresholdValue")) || 1,
      thresholdWindow: formData.get("thresholdWindow")
        ? Number(formData.get("thresholdWindow"))
        : undefined,
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
      <Input
        label="Habit Name"
        name="name"
        id="name"
        placeholder="e.g., Morning meditation"
        defaultValue={defaultValues?.name}
        required
      />

      <Input
        label="Description (optional)"
        name="description"
        id="description"
        placeholder="What is this habit about?"
        defaultValue={defaultValues?.description ?? ""}
      />

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

      <Select
        label="Tracking Type"
        name="trackingType"
        id="trackingType"
        value={trackingType}
        onChange={(e) => setTrackingType(e.target.value)}
      >
        <option value="BOOLEAN">Boolean (done / not done)</option>
        <option value="COUNT">Count (numeric goal)</option>
      </Select>

      <Select
        label="Goal Type"
        name="thresholdType"
        id="thresholdType"
        value={thresholdType}
        onChange={(e) => setThresholdType(e.target.value)}
      >
        <option value="DAILY">Daily</option>
        <option value="WEEKLY_TOTAL">Weekly Total</option>
        <option value="ROLLING_WINDOW">Rolling Window</option>
      </Select>

      {trackingType === "COUNT" && (
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
      )}

      {thresholdType === "ROLLING_WINDOW" && (
        <Input
          label="Window (days)"
          name="thresholdWindow"
          id="thresholdWindow"
          type="number"
          min="2"
          placeholder="e.g., 7 for last 7 days"
          defaultValue={defaultValues?.thresholdWindow}
        />
      )}

      {thresholdType !== "ROLLING_WINDOW" && trackingType === "BOOLEAN" && (
        <input type="hidden" name="thresholdValue" value="1" />
      )}

      {error && <p className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : habitId ? "Update Habit" : "Create Habit"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
