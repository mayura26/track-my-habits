"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NfcTokenCard } from "@/components/nfc/NfcTokenCard";

interface HabitDetailClientProps {
  habitId: string;
  nfcToken: string | null;
  nfcValue: string | null;
}

export function HabitDetailClient({
  habitId,
  nfcToken,
  nfcValue,
}: HabitDetailClientProps) {
  const [token, setToken] = useState(nfcToken);
  const [value, setValue] = useState(nfcValue);
  const router = useRouter();

  const handleUpdate = async () => {
    // Re-fetch habit data
    const res = await fetch(`/api/habits/${habitId}`);
    const data = await res.json();
    setToken(data.nfcToken);
    setValue(data.nfcValue);
    router.refresh();
  };

  return (
    <NfcTokenCard
      habitId={habitId}
      nfcToken={token}
      nfcValue={value}
      onUpdate={handleUpdate}
    />
  );
}
