"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FeedbackStatusProps = {
  feedbackId: string;
  currentStatus: "NEW" | "REVIEWED" | "ACTIONED";
};

export default function FeedbackStatus({
  feedbackId,
  currentStatus,
}: FeedbackStatusProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const newStatus = event.target.value as
      | "NEW"
      | "REVIEWED"
      | "ACTIONED";

    setLoading(true);

    try {
      const response = await fetch("/api/feedback/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setStatus(newStatus);
      router.refresh();
    } catch (error) {
      console.error("Status update error:", error);
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className="mt-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none"
    >
      <option value="NEW">NEW</option>
      <option value="REVIEWED">REVIEWED</option>
      <option value="ACTIONED">ACTIONED</option>
    </select>
  );
}