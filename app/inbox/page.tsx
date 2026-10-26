
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-5 md:px-12">
        <h1 className="text-2xl font-bold tracking-tight">
          LOOP<span className="text-emerald-400">.</span>
        </h1>
        <span className="text-sm text-slate-400">
          Feedback Intelligence
        </span>
      </nav>

      <section className="mx-auto flex max-w-5xl flex-col px-6 py-24 md:px-12">
        <p className="mb-4 font-medium uppercase tracking-[0.25em] text-emerald-400">
          AI-Powered Insights
        </p>

        <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Turn customer feedback into your next big decision.
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Bring customer feedback together, discover meaningful patterns,
          and understand what your customers really need.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/dashboard"
            className="rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Open Dashboard
          </a>

          <a
            href="#features"
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold transition hover:bg-slate-900"
          >
            Explore Features
          </a>
        </div>

        <div
          id="features"
          className="mt-20 grid gap-5 md:grid-cols-3"
        >
          {[
            {
              title: "Collect",
              description:
                "Bring customer feedback into one place.",
            },
            {
              title: "Understand",
              description:
                "Discover recurring themes and customer sentiment.",
            },
            {
              title: "Improve",
              description:
                "Turn insights into actionable improvements.",
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h3 className="text-xl font-semibold text-emerald-400">
                {feature.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
