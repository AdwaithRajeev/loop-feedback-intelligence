import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import StatusDropdown from "@/components/StatusDropdown";

const PAGE_SIZE = 10;

type InboxPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    channel?: string;
    sentiment?: string;
    status?: string;
    theme?: string;
  }>;
};

export default async function InboxPage({
  searchParams,
}: InboxPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const search = params.search?.trim() ?? "";
  const channel = params.channel ?? "";
  const page = Math.max(Number(params.page) || 1, 1);
  const sentiment = params.sentiment ?? "";
  const status = params.status ?? "";
  const theme = params.theme ?? "";

  const skip = (page - 1) * PAGE_SIZE;

  const workspaceId = session.user.workspaceId;

  const where = {
    workspaceId,

    ...(search
      ? {
          content: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),

    ...(channel
      ? {
          channel: channel as
            | "MANUAL"
            | "CSV"
            | "SIMULATED",
        }
      : {}),

    ...(sentiment
      ? {
          sentiment: sentiment as
            | "POSITIVE"
            | "NEUTRAL"
            | "NEGATIVE",
        }
      : {}),

    ...(status
      ? {
          status: status as
            | "NEW"
            | "REVIEWED"
            | "ACTIONED",
        }
      : {}),

    ...(theme
      ? {
          themes: {
            some: {
              theme: {
                name: theme,
              },
            },
          },
        }
      : {}),
  };

  const [feedback, totalFeedback] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: PAGE_SIZE,
    }),

    prisma.feedback.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalFeedback / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feedback Inbox</h1>

        <p className="mt-2 text-slate-400">
          Review and manage customer feedback
        </p>
      </div>

      {/* Filters */}
      <form
        action="/inbox"
        method="GET"
        className="mb-6 flex flex-wrap gap-3"
      >
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search feedback..."
          className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
        />

        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="ACTIONED">Actioned</option>
        </select>

        <select
          name="theme"
          defaultValue={theme}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
        >
          <option value="">All Themes</option>
          <option value="Pricing">Pricing</option>
          <option value="Performance">Performance</option>
          <option value="Support">Support</option>
          <option value="UX">UX</option>
          <option value="Features">Features</option>
          <option value="Reliability">Reliability</option>
          <option value="Onboarding">Onboarding</option>
        </select>

        <select
          name="channel"
          defaultValue={channel}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
        >
          <option value="">All Channels</option>
          <option value="MANUAL">Manual</option>
          <option value="CSV">CSV</option>
          <option value="SIMULATED">Simulated</option>
        </select>

        <select
          name="sentiment"
          defaultValue={sentiment}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
        >
          <option value="">All Sentiments</option>
          <option value="POSITIVE">Positive</option>
          <option value="NEUTRAL">Neutral</option>
          <option value="NEGATIVE">Negative</option>
        </select>

        <button
          type="submit"
          className="rounded-lg bg-white px-5 py-3 font-medium text-slate-950 hover:bg-slate-200"
        >
          Search
        </button>
      </form>

      {/* Feedback table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 bg-slate-950">
              <tr>
                <th className="px-6 py-4 text-sm text-slate-400">
                  Feedback
                </th>

                <th className="px-6 py-4 text-sm text-slate-400">
                  Channel
                </th>

                <th className="px-6 py-4 text-sm text-slate-400">
                  Sentiment
                </th>

                <th className="px-6 py-4 text-sm text-slate-400">
                  Themes
                </th>

                <th className="px-6 py-4 text-sm text-slate-400">
                  Status
                </th>

                <th className="px-6 py-4 text-sm text-slate-400">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {feedback.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-800 last:border-0"
                >
                  <td className="max-w-md px-6 py-4">
  <a
    href={`/feedback/${item.id}`}
    className="block hover:text-blue-400"
  >
    <p className="text-sm text-white">
      {item.content}
    </p>

    {item.customerLabel && (
      <p className="mt-1 text-xs text-slate-500">
        {item.customerLabel}
      </p>
    )}
  </a>
</td>

<td className="px-6 py-4 text-sm text-slate-300">
  {item.channel}
</td>

<td className="px-6 py-4">
  <span
    className={
      item.sentiment === "NEGATIVE"
        ? "text-red-400"
        : item.sentiment === "POSITIVE"
          ? "text-green-400"
          : "text-slate-400"
    }
  >
    {item.sentiment ?? "Pending"}
  </span>
</td>
                  

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.themes.map(({ theme }) => (
                        <span
                          key={theme.id}
                          className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300"
                        >
                          {theme.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
  <StatusDropdown
    feedbackId={item.id}
    currentStatus={item.status}
  />
</td>



                  <td className="px-6 py-4 text-sm text-slate-400">
                    {item.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {feedback.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No feedback found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages || 1}
          </p>

          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/inbox?page=${page - 1}&search=${encodeURIComponent(
                  search,
                )}&channel=${encodeURIComponent(
                  channel,
                )}&sentiment=${encodeURIComponent(
                  sentiment,
                )}&status=${encodeURIComponent(
                  status,
                )}&theme=${encodeURIComponent(theme)}`}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
              >
                Previous
              </a>
            )}

            {page < totalPages && (
              <a
                href={`/inbox?page=${page + 1}&search=${encodeURIComponent(
                  search,
                )}&channel=${encodeURIComponent(
                  channel,
                )}&sentiment=${encodeURIComponent(
                  sentiment,
                )}&status=${encodeURIComponent(
                  status,
                )}&theme=${encodeURIComponent(theme)}`}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
              >
                Next
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}