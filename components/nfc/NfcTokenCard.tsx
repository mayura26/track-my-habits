"use client";

import { useState } from "react";
import { Nfc, Copy, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface NfcTokenCardProps {
  habitId: string;
  nfcToken: string | null;
  nfcValue: string | null;
  onUpdate: () => void;
}

export function NfcTokenCard({ habitId, nfcToken, nfcValue, onUpdate }: NfcTokenCardProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    await fetch(`/api/habits/${habitId}/nfc`, { method: "POST" });
    setLoading(false);
    onUpdate();
  };

  const revoke = async () => {
    if (!confirm("Remove NFC token?")) return;
    setLoading(true);
    await fetch(`/api/habits/${habitId}/nfc`, { method: "DELETE" });
    setLoading(false);
    onUpdate();
  };

  const copy = () => {
    if (nfcValue) {
      navigator.clipboard.writeText(nfcValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Nfc className="h-5 w-5 text-[#7c3aed]" />
          <h3 className="font-medium text-[#f7f0e1]">NFC Token</h3>
        </div>

        {nfcToken ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-[#0d0d0d] p-3">
              <p className="text-xs text-[#b4a58a] mb-1">Token</p>
              <p className="font-mono text-sm text-[#f7f0e1]">{nfcToken}</p>
            </div>
            <div className="rounded-lg bg-[#0d0d0d] p-3">
              <p className="text-xs text-[#b4a58a] mb-1">NFC URL</p>
              <p className="text-xs text-[#f7f0e1] break-all">{nfcValue}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={copy} className="flex-1">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
              <Button variant="danger" size="sm" onClick={revoke} disabled={loading}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[#b4a58a] mb-4">
              Generate an NFC token to log this habit by tapping a physical NFC tag.
            </p>
            <Button onClick={generate} disabled={loading} variant="secondary">
              <Nfc className="h-4 w-4" />
              {loading ? "Generating..." : "Generate Token"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
