import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FeedbackTrendChart from "@/components/FeedbackTrendChart";
import AIQuestionAnswer from "@/components/AIQuestionAnswer";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - 6);
trendStart.setHours(0, 0, 0, 0);

const recentFeedback = await prisma.feedback.findMany({
  where: {
    workspaceId,
    createdAt: {
      gte: trendStart,
    },
  },
  select: {
    createdAt: true,
  },
  orderBy: {
    createdAt: "asc",
  },
});

  const trendMap = new Map<string, number>();

  for (const feedback of recentFeedback) {
    const date = feedback.createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    trendMap.set(date, (trendMap.get(date) ?? 0) + 1);
  }

  const trendData = Array.from(trendMap.entries()).map(
    ([date, count]) => ({
      date,
      count,
    })
  );

trendStart.setDate(trendStart.getDate() - 6);
trendStart.setHours(0, 0, 0, 0);



  const topThemes = await prisma.theme.findMany({
  where: {
    workspaceId,
  },
  include: {
    _count: {
      select: {
        feedback: true,
      },
    },
  },
  orderBy: {
    feedback: {
      _count: "desc",
    },
  },
  take: 5,
});

  const [
    totalFeedback,
    positiveFeedback,
    negativeFeedback,
    neutralFeedback,
  ] = await Promise.all([
    prisma.feedback.count({
      where: { workspaceId },
    }),

    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "POSITIVE",
      },
    }),

    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEGATIVE",
      },
    }),

    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEUTRAL",
      },
    }),
  ]);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const newThisWeek = await prisma.feedback.count({
    where: {
      workspaceId,
      createdAt: {
        gte: startOfWeek,
      },
    },
  });

  const negativePercentage =
    totalFeedback === 0
      ? 0
      : Math.round((negativeFeedback / totalFeedback) * 100);

  const positivePercentage =
    totalFeedback === 0
      ? 0
      : Math.round((positiveFeedback / totalFeedback) * 100);

  const neutralPercentage =
    totalFeedback === 0
      ? 0
      : Math.round((neutralFeedback / totalFeedback) * 100);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">

        <h1 className="text-3xl font-bold">
          LOOP Dashboard
        </h1>

        <p className="mt-2 text-slate-400">
          Welcome, {session.user.name ?? session.user.email}
        </p>

        <div className="mt-6 flex gap-3">
  <a
    href="/qa"
    className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-slate-950 hover:bg-slate-200"
  >
    AI Q&A →
  </a>

  <a
    href="/report"
    className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
  >
    Voice-of-Customer Report →
  </a>
</div>

        <div className="mt-6">

</div>

        {/* Metrics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Feedback
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalFeedback}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Positive Feedback
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {positiveFeedback}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {positivePercentage}% of total
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Negative Feedback
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {negativeFeedback}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {negativePercentage}% of total
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              New This Week
            </p>

            <p className="mt-2 text-3xl font-bold">
              {newThisWeek}
            </p>
          </div>

        </div>

        {/* Sentiment */}
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            Sentiment Overview
          </h2>

          <div className="mt-6 space-y-5">

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-green-400">
                  Positive
                </span>

                <span className="text-slate-400">
                  {positiveFeedback} ({positivePercentage}%)
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{
                    width: `${positivePercentage}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">
                  Neutral
                </span>

                <span className="text-slate-400">
                  {neutralFeedback} ({neutralPercentage}%)
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{
                    width: `${neutralPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-red-400">
                  Negative
                </span>

                <span className="text-slate-400">
                  {negativeFeedback} ({negativePercentage}%)
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{
                    width: `${negativePercentage}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </div>
        {/* Top Themes */}
<div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
  <h2 className="text-xl font-semibold">
    Top Themes
  </h2>

  {topThemes.length === 0 ? (
    <p className="mt-4 text-sm text-slate-500">
      No themes available yet.
    </p>
  ) : (
    <div className="mt-6 space-y-4">
      {topThemes.map((theme) => (
        <div
          key={theme.id}
          className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0"
        >
          <div>
            <p className="font-medium text-white">
              {theme.name}
            </p>

            {theme.description && (
              <p className="mt-1 text-sm text-slate-500">
                {theme.description}
              </p>
            )}
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
            {theme._count.feedback}
          </span>
        </div>
      ))}
    </div>
  )}
</div>

<div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
  <h2 className="text-xl font-semibold">
    Feedback Trend
  </h2>

  <p className="mt-1 text-sm text-slate-500">
    Feedback received over the last 7 days
  </p>

  {trendData.length === 0 ? (
    <p className="mt-6 text-sm text-slate-500">
      No feedback received in the last 7 days.
    </p>
  ) : (
    <FeedbackTrendChart data={trendData} />
  )}
</div>


<AIQuestionAnswer />


        {/* Role */}
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Role
          </p>

          <p className="mt-1 text-lg font-semibold">
            {session.user.role}
          </p>
        </div>

      </div>
    </main>
  );
}