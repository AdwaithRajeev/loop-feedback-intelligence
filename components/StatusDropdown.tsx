"use client";

import { useState } from "react";


type StatusDropdownProps = {
  feedbackId: string;
  currentStatus: "NEW" | "REVIEWED" | "ACTIONED";
};

export default function StatusDropdown({
  feedbackId,
  currentStatus,
}: StatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const newStatus = event.target.value as
      | "NEW"
      | "REVIEWED"
      | "ACTIONED";

    setStatus(newStatus);
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

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      setStatus(currentStatus);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-300 outline-none disabled:opacity-50"
    >
      <option value="NEW">New</option>
      <option value="REVIEWED">Reviewed</option>
      <option value="ACTIONED">Actioned</option>
    </select>
  );
}