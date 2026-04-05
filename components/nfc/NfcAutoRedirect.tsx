"use client";

import { useEffect } from "react";

export function NfcAutoRedirect() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 5000);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
