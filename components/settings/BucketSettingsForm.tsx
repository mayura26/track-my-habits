"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Prefs {
  bucketMorningStart: number;
  bucketDayStart: number;
  bucketEveningStart: number;
  bucketBeforeBedStart: number;
}

interface BucketSettingsFormProps {
  defaultValues: Prefs;
}

function fmt(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  return `${hh.toString().padStart(2, "0")}:00`;
}

export function BucketSettingsForm({ defaultValues }: BucketSettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Prefs>(defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const setField = (key: keyof Prefs, n: number) => {
    setValues((v) => ({ ...v, [key]: n }));
    setSaved(false);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Morning start (hour)"
          name="bucketMorningStart"
          id="bucketMorningStart"
          type="number"
          min="0"
          max="23"
          value={values.bucketMorningStart}
          onChange={(e) =>
            setField("bucketMorningStart", Number(e.target.value) || 0)
          }
        />
        <Input
          label="Day start (hour)"
          name="bucketDayStart"
          id="bucketDayStart"
          type="number"
          min="0"
          max="23"
          value={values.bucketDayStart}
          onChange={(e) =>
            setField("bucketDayStart", Number(e.target.value) || 0)
          }
        />
        <Input
          label="Evening start (hour)"
          name="bucketEveningStart"
          id="bucketEveningStart"
          type="number"
          min="0"
          max="23"
          value={values.bucketEveningStart}
          onChange={(e) =>
            setField("bucketEveningStart", Number(e.target.value) || 0)
          }
        />
        <Input
          label="Before bed start (hour)"
          name="bucketBeforeBedStart"
          id="bucketBeforeBedStart"
          type="number"
          min="0"
          max="23"
          value={values.bucketBeforeBedStart}
          onChange={(e) =>
            setField("bucketBeforeBedStart", Number(e.target.value) || 0)
          }
        />
      </div>

      <div className="rounded-[20px] border border-[rgba(216,196,160,0.14)] bg-[rgba(8,12,10,0.28)] p-4 text-xs leading-6 text-[#b4a58a]">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6c48b]">
          Preview
        </p>
        <p>
          Morning: {fmt(values.bucketMorningStart)}–{fmt(values.bucketDayStart)}
        </p>
        <p>
          Day: {fmt(values.bucketDayStart)}–{fmt(values.bucketEveningStart)}
        </p>
        <p>
          Evening: {fmt(values.bucketEveningStart)}–
          {fmt(values.bucketBeforeBedStart)}
        </p>
        <p>
          Before Bed: {fmt(values.bucketBeforeBedStart)}–
          {fmt(values.bucketMorningStart)}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-900/20 p-3 text-sm text-green-400">
          Saved
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
