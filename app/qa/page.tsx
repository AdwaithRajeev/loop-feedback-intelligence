"use client";

import { useState } from "react";

export default function QAPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askQuestion() {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch("/api/qa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI answer");
      }

      setAnswer(data.answer);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">

        <a
          href="/dashboard"
          className="mb-6 inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          ← Back to Dashboard
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            AI Q&A
          </h1>

          <p className="mt-2 text-slate-400">
            Ask questions about your customer feedback.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <label
            htmlFor="question"
            className="text-sm font-medium text-slate-300"
          >
            Your Question
          </label>

          <textarea
            id="question"
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="e.g. What are the biggest customer complaints?"
            rows={4}
            className="mt-3 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-4 text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
          />

          <button
            onClick={askQuestion}
            disabled={loading}
            className="mt-4 rounded-lg bg-white px-5 py-3 text-sm font-medium text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask AI"}
          </button>

          {error && (
            <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {answer && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              AI Answer
            </h2>

            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
              {answer}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}