"use client";

import {
  Check,
  ClipboardCopy,
  ImagePlus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { generateTaskImagePrompt } from "@/lib/image-prompt";
import { toImageDeliveryUrl } from "@/lib/upload-paths";

interface TaskImageSectionProps {
  taskId: string;
  imageUrl: string | null;
  imagePrompt: string | null;
  name: string;
  description: string | null;
  frequency: string;
  bucket: string | null;
  categoryName: string | null;
}

export function TaskImageSection({
  taskId,
  imageUrl,
  imagePrompt,
  name,
  description,
  frequency,
  bucket,
  categoryName,
}: TaskImageSectionProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState(imagePrompt);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(
    imageUrl,
  );
  const [isPending, startTransition] = useTransition();
  const resolvedImageUrl = toImageDeliveryUrl(displayImageUrl);

  useEffect(() => {
    if (!previewUrl) {
      setDisplayImageUrl(imageUrl);
    }
  }, [imageUrl, previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleGenerate() {
    setSaving(true);
    const generated = generateTaskImagePrompt({
      name,
      description,
      frequency,
      bucket,
      categoryName,
    });
    setPrompt(generated);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagePrompt: generated }),
    });
    setSaving(false);
  }

  async function handleCopy() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleUpload(file: File) {
    const localPreview = URL.createObjectURL(file);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(localPreview);
    setDisplayImageUrl(localPreview);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("type", "task");
    form.append("id", taskId);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      const payload = (await res.json()) as { url?: string };
      if (payload.url) {
        setDisplayImageUrl(payload.url);
      }
      if (localPreview.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
      setPreviewUrl(null);
      startTransition(() => {
        router.refresh();
      });
    }
  }

  async function handleRemove() {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "task", id: taskId }),
    });
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setDisplayImageUrl(null);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-[26px] border border-[rgba(216,196,160,0.14)] bg-[rgba(247,240,225,0.03)] p-4">
      <div>
        <p className="section-kicker">Card artwork</p>
        <p className="mt-2 text-sm text-[#b4a58a]">
          Generate a prompt for AI image tools, then upload the result as a card
          background.
        </p>
      </div>

      {resolvedImageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-[20px] border border-[rgba(216,196,160,0.12)]">
          <Image
            src={resolvedImageUrl}
            alt={`Artwork for ${name}`}
            fill
            unoptimized={resolvedImageUrl.startsWith("blob:")}
            className="object-cover section-artwork-photo-dimmed"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <div className="section-artwork-card-scrim" aria-hidden />
          <div className="relative z-[2] flex h-full items-end justify-end gap-2 p-4">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={handleRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {prompt ? (
        <div className="space-y-3">
          <div className="max-h-48 overflow-y-auto rounded-[16px] border border-[rgba(216,196,160,0.1)] bg-[rgba(12,17,16,0.45)] p-4 font-mono text-xs leading-relaxed text-[#b4a58a]">
            {prompt}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ClipboardCopy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy prompt"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleGenerate}
              disabled={saving}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          type="button"
          onClick={handleGenerate}
          disabled={saving}
        >
          <ImagePlus className="h-4 w-4" />
          {saving ? "Generating..." : "Generate image prompt"}
        </Button>
      )}

      {prompt && !displayImageUrl && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-[20px] border-2 border-dashed border-[rgba(216,196,160,0.18)] bg-[rgba(247,240,225,0.02)] p-8 text-center transition-colors hover:border-[rgba(230,196,139,0.36)] hover:bg-[rgba(247,240,225,0.04)]"
        >
          <Upload className="h-8 w-8 text-[#8d826d]" />
          <p className="text-sm text-[#b4a58a]">
            {uploading
              ? "Uploading..."
              : isPending
                ? "Saving..."
                : "Click to upload your generated image"}
          </p>
          <p className="text-xs text-[#8d826d]">
            JPEG, PNG, or WebP up to 5 MB
          </p>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </section>
  );
}
