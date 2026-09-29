"use client";

import { useState } from "react";

type AnalyzeFeedbackButtonProps = {
  feedbackId: string;
};

export default function AnalyzeFeedbackButton({
  feedbackId,
}: AnalyzeFeedbackButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/feedback/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze feedback");
      }

      setMessage("AI analysis completed");

      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to analyze feedback",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze with AI"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}