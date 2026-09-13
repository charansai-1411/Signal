"use client";

import dynamic from "next/dynamic";

// The 3D landing is client-only (WebGL) and heavy, so load it without SSR and
// show a lightweight, on-brand fallback while it initialises (also the graceful
// path for no-WebGL / reduced-capability clients).
const Landing = dynamic(() => import("@/components/landing/Landing"), {
  ssr: false,
  loading: () => <Fallback />,
});

export default function Page() {
  return <Landing />;
}

function Fallback() {
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center px-6 text-center"
      style={{
        background:
          "radial-gradient(1200px 700px at 28% 18%, #fff7ec 0%, #faf7f2 42%, #f2e8d6 100%)",
      }}
    >
      <div className="mb-4 font-sans text-label font-semibold uppercase tracking-[0.18em] text-accent">
        Signal
      </div>
      <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[4rem]">
        Find the decision in the noise.
      </h1>
      <p className="mt-4 max-w-[34ch] text-[1.0625rem] leading-relaxed text-ink-muted">
        Preparing the experience…
      </p>
      <a
        href="/dashboard"
        className="accent-underline mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 font-sans text-[1rem] font-semibold text-white shadow-card"
      >
        Go to Dashboard →
      </a>
    </div>
  );
}
