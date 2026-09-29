"use client";

import { useState } from "react";

type Report = {
  summary: string;
  sentimentOverview: string;
  topThemes: {
    name: string;
    description: string;
  }[];
  painPoints: string[];
  featureAreas: {
    name: string;
    description: string;
  }[];
  recommendations: string[];
};

export default function ReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateReport() {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate report"
        );
      }

      setReport(data.report);
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
      <div className="mx-auto max-w-5xl">

        <a
          href="/dashboard"
          className="mb-6 inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          ← Back to Dashboard
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Voice-of-Customer Report
          </h1>

          <p className="mt-2 text-slate-400">
            Generate an AI-powered summary of customer feedback,
            themes, pain points, and recommendations.
          </p>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Generating Report..."
            : "Generate Report"}
        </button>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-8 space-y-6">

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Executive Summary
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                {report.summary}
              </p>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Sentiment Overview
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                {report.sentimentOverview}
              </p>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Top Themes
              </h2>

              <div className="mt-5 space-y-4">
                {report.topThemes.map((theme, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                  >
                    <h3 className="font-medium text-white">
                      {theme.name}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {theme.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Customer Pain Points
              </h2>

              <ul className="mt-5 space-y-3">
                {report.painPoints.map((point, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Feature Areas
              </h2>

              <div className="mt-5 space-y-4">
                {report.featureAreas.map((area, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                  >
                    <h3 className="font-medium text-white">
                      {area.name}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {area.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Recommendations
              </h2>

              <ol className="mt-5 space-y-3">
                {report.recommendations.map(
                  (recommendation, index) => (
                    <li
                      key={index}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300"
                    >
                      <span className="mr-2 font-semibold text-white">
  {index + 1}.
</span>

{recommendation.replace(/^\d+\.\s*/, "")}
                    </li>
                  )
                )}
              </ol>
            </section>

          </div>
        )}
      </div>
    </main>
  );
}