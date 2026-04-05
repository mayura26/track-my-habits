"use client";

import { Plus, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const LUCIDE_ICONS = [
  "Heart",
  "Dumbbell",
  "User",
  "BookOpen",
  "Users",
  "Star",
  "Zap",
  "Music",
  "Code",
  "Briefcase",
  "Coffee",
  "Home",
  "Globe",
  "Camera",
];
const PRESET_COLORS = [
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#3b82f6",
  "#eab308",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f59e0b",
];

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  _count: { habits: number };
}

interface CategoriesClientProps {
  categories: Category[];
}

export function CategoriesClient({
  categories: initialCategories,
}: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(LUCIDE_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, icon }),
    });

    setLoading(false);
    if (res.ok) {
      const newCat = await res.json();
      setCategories((prev) => [...prev, { ...newCat, _count: { habits: 0 } }]);
      setName("");
      setShowForm(false);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "Failed to create category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mindfulness"
                required
              />

              <div>
                <p className="mb-1.5 block text-sm font-medium text-[#f7f0e1]">
                  Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === c
                          ? "border-[#fff7ea] scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 block text-sm font-medium text-[#f7f0e1]">
                  Icon
                </p>
                <div className="flex flex-wrap gap-2">
                  {LUCIDE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                        icon === ic
                          ? "border-[rgba(230,196,139,0.36)] bg-[rgba(199,154,82,0.18)] text-[#fff2d3]"
                          : "border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.04)] text-[#b4a58a] hover:text-[#f7f0e1]"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="surface-panel flex items-center gap-4 rounded-[26px] p-4"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
            >
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#f7f0e1]">{cat.name}</p>
              <p className="text-xs text-[#b4a58a]">
                {cat._count.habits} habits
              </p>
            </div>
            {cat.isDefault ? (
              <Badge variant="default">System</Badge>
            ) : (
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-[#b4a58a] transition-colors hover:bg-[rgba(247,240,225,0.05)] hover:text-red-400"
                title="Delete category"
                disabled={cat._count.habits > 0}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
