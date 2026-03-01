"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const LUCIDE_ICONS = ["Heart", "Dumbbell", "User", "BookOpen", "Users", "Star", "Zap", "Music", "Code", "Briefcase", "Coffee", "Home", "Globe", "Camera"];
const PRESET_COLORS = ["#22c55e", "#f97316", "#a855f7", "#3b82f6", "#eab308", "#ef4444", "#ec4899", "#06b6d4", "#84cc16", "#f59e0b"];

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

export function CategoriesClient({ categories: initialCategories }: CategoriesClientProps) {
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
                <label className="mb-1.5 block text-sm font-medium text-[#f5f5f5]">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === c ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#f5f5f5]">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {LUCIDE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                        icon === ic
                          ? "bg-[#7c3aed] text-white"
                          : "bg-[#1c1c1c] text-[#888888] hover:text-[#f5f5f5]"
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
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
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
            className="flex items-center gap-4 rounded-xl border border-[#2a2a2a] bg-[#141414] p-4"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
            >
              <Tag className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#f5f5f5]">{cat.name}</p>
              <p className="text-xs text-[#888888]">{cat._count.habits} habits</p>
            </div>
            {cat.isDefault ? (
              <Badge variant="default">System</Badge>
            ) : (
              <button
                onClick={() => handleDelete(cat.id)}
                className="rounded-lg p-1.5 text-[#888888] hover:bg-[#2a2a2a] hover:text-red-400 transition-colors"
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
