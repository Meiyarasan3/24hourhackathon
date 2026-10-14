"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"off" | "connecting" | "live" | "polling">(() => {
    if (!enabled) return "off";
    return createClient() ? "connecting" : "polling";
  });

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const poll = window.setInterval(() => router.refresh(), 30000);
    if (!supabase) return () => window.clearInterval(poll);

    const channel = supabase
      .channel("public-announcements")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        router.refresh();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setMode("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setMode("polling");
      });

    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [enabled, router]);

  if (!enabled) return null;

  const label =
    mode === "live"
      ? "Realtime connected. New announcements refresh this page."
      : mode === "polling"
        ? "Checking for announcement updates every 30 seconds."
        : "Connecting to announcement updates.";

  return <p className="text-xs text-muted-foreground">{label}</p>;
}
