"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFeedbackPage() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [channel, setChannel] = useState("MANUAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          customerLabel,
          channel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create feedback");
      }

      router.push("/inbox");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add Feedback</h1>

          <p className="mt-2 text-slate-400">
            Add a new customer feedback item.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Feedback
            </label>

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Enter customer feedback..."
              rows={6}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Customer Label
            </label>

            <input
              type="text"
              value={customerLabel}
              onChange={(event) => setCustomerLabel(event.target.value)}
              placeholder="Example: Customer #101"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Channel
            </label>

            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            >
              <option value="MANUAL">Manual</option>
              <option value="CSV">CSV</option>
              <option value="SIMULATED">Simulated</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-5 py-3 font-medium text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Feedback"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/inbox")}
              className="rounded-lg border border-slate-700 px-5 py-3 font-medium text-white hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}