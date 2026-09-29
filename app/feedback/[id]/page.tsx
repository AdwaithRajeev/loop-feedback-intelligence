import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import AnalyzeFeedbackButton from "@/components/AnalyzeFeedbackButton";
import FeedbackStatus from "@/components/FeedbackStatus";

type FeedbackPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FeedbackDetailPage({
  params,
}: FeedbackPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const feedback = await prisma.feedback.findFirst({
    where: {
      id,
      workspaceId: session.user.workspaceId,
    },
    include: {
      themes: {
        include: {
          theme: true,
        },
      },
    },
  });

  if (!feedback) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <a
          href="/inbox"
          className="mb-6 inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          ← Back to Inbox
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Feedback Details</h1>

          <p className="mt-2 text-slate-400">
            Review customer feedback details
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <p className="mb-3 text-sm text-slate-400">
              Customer Feedback
            </p>

            <p className="text-lg leading-8 text-white">
              {feedback.content}
            </p>

            {feedback.customerLabel && (
              <p className="mt-4 text-sm text-slate-500">
                {feedback.customerLabel}
              </p>
            )}

            <AnalyzeFeedbackButton feedbackId={feedback.id} />
          </div>

          <div className="grid gap-6 border-b border-slate-800 p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Channel</p>

              <p className="mt-1 text-white">
                {feedback.channel}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Sentiment</p>

              <p
                className={`mt-1 ${
                  feedback.sentiment === "NEGATIVE"
                    ? "text-red-400"
                    : feedback.sentiment === "POSITIVE"
                      ? "text-green-400"
                      : "text-slate-300"
                }`}
              >
                {feedback.sentiment ?? "Pending"}
              </p>

              {feedback.sentimentScore !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  Score: {feedback.sentimentScore}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Feature Area
              </p>

              <p className="mt-1 text-white">
                {feedback.featureArea ?? "Pending"}
              </p>
            </div>


            <div>
              <p className="text-sm text-slate-500">Date</p>

              <p className="mt-1 text-slate-300">
                {feedback.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-b border-slate-800 p-6">
            <p className="mb-3 text-sm text-slate-500">
              AI Rationale
            </p>

            <p className="text-sm leading-6 text-slate-300">
              {feedback.rationale ?? "AI analysis has not been run yet."}
            </p>
          </div>

          <div className="p-6">
            <p className="mb-3 text-sm text-slate-500">
              Themes
            </p>

            {feedback.themes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {feedback.themes.map(({ theme }) => (
                  <span
                    key={theme.id}
                    className="rounded-full bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                  >
                    {theme.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No themes assigned yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}