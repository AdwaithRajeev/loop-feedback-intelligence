
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-5 md:px-12">
        <h1 className="text-2xl font-bold">
          LOOP<span className="text-emerald-400">.</span>
        </h1>
        <span className="text-sm text-slate-400">
          Feedback Intelligence
        </span>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-24 md:px-12">
        <p className="mb-4 font-medium uppercase tracking-widest text-emerald-400">
          AI-Powered Insights
        </p>

        <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Turn customer feedback into your next big decision.
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Understand customer sentiment, discover patterns, and turn
          feedback into actionable business insights.
        </p>

        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-300"
        >
          Open Dashboard
        </a>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {[
            ["Collect", "Bring customer feedback together."],
            ["Understand", "Discover sentiment and recurring themes."],
            ["Improve", "Turn insights into better decisions."],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-xl font-semibold text-emerald-400">
                {title}
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
