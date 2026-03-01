"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-xl border border-[#2a2a2a] bg-[#141414] p-0 text-[#f5f5f5] backdrop:bg-black/60 open:flex open:flex-col"
      onClose={onClose}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-[#2a2a2a] px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#888888] hover:bg-[#2a2a2a] hover:text-[#f5f5f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}
