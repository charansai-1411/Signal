"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import { Experience } from "./Experience";

const bg =
  "radial-gradient(1200px 700px at 28% 18%, #fff7ec 0%, #faf7f2 42%, #f2e8d6 100%)";

export default function Landing() {
  const progressRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: bg }}>
      {/* Subtle scroll-progress rail (right edge, driven from scroll each frame) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          right: "26px",
          top: "50%",
          transform: "translateY(-50%)",
          height: "42vh",
          width: "2px",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "color-mix(in srgb, var(--ink) 12%, transparent)",
            borderRadius: "2px",
          }}
        />
        <div
          ref={progressRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "2px",
            height: "100%",
            background: "var(--accent)",
            transformOrigin: "top",
            transform: "scaleY(0)",
            borderRadius: "2px",
            boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 55%, transparent)",
          }}
        />
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `calc(${p * 100}% - 2px)`,
              left: "-1px",
              width: "4px",
              height: "4px",
              borderRadius: "9999px",
              background: "color-mix(in srgb, var(--ink) 22%, transparent)",
            }}
          />
        ))}
      </div>

      {/* Fixed top bar (normal DOM, always clickable) */}
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="pointer-events-auto font-sans text-label font-semibold uppercase tracking-[0.18em] text-accent">
          Signal
        </span>
        <a
          href="/dashboard"
          className="pointer-events-auto rounded-full border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color-mix(in_srgb,#fff_70%,transparent)] px-5 py-2 font-sans text-[0.875rem] font-semibold text-ink backdrop-blur-sm transition-all hover:border-accent hover:text-accent"
        >
          Go to Dashboard →
        </a>
      </nav>

      <Canvas
        camera={{ position: [0, 0.3, 13.6], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ScrollControls pages={5} damping={0.42}>
          <Experience />
          <ScrollProgressDriver targetRef={progressRef} />

          <Scroll html style={{ width: "100%" }}>
            <Section index={0} align="left">
              <Eyebrow>Signal — for the project lead CC’d on everything</Eyebrow>
              <h1 className="font-display text-[3.5rem] font-semibold leading-[1.02] tracking-[-0.02em] text-ink sm:text-[5.75rem]">
                Find the decision<br />in the noise.
              </h1>
              <p className="mt-5 max-w-[34ch] text-[1.1875rem] leading-relaxed text-ink-muted">
                A single decision is scattered across six channels. Signal reads
                the mess and tells you the one thing that matters.
              </p>
              <div className="mt-8 font-sans text-label uppercase tracking-[0.14em] text-ink-muted">
                Scroll ↓
              </div>
            </Section>

            <Section index={1} align="right">
              <Eyebrow>The problem</Eyebrow>
              <h2 className="font-display text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.01em] text-ink sm:text-[4.25rem]">
                Six channels.<br />Nobody’s wrong.<br />Nothing’s resolved.
              </h2>
              <p className="mt-5 max-w-[34ch] text-[1.1875rem] leading-relaxed text-ink-muted">
                WhatsApp, email, Slack, the client, the calendar, the team — all
                talking past each other.
              </p>
            </Section>

            <Section index={2} align="left">
              <Eyebrow style={{ color: "var(--status-contra)" }}>The catch</Eyebrow>
              <h2 className="font-display text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.01em] text-ink sm:text-[4.25rem]">
                Two of them<br />
                <span style={{ color: "var(--status-contra)" }}>contradict</span> each other.
              </h2>
              <p className="mt-5 max-w-[38ch] font-mono text-[1.05rem] leading-relaxed text-ink">
                “keep the launch on Friday” vs “we moved it to Monday.” They
                cannot both be true.
              </p>
            </Section>

            <Section index={3} align="right">
              <Eyebrow>Why it matters</Eyebrow>
              <h2 className="font-display text-[2.75rem] font-semibold leading-[1.06] tracking-[-0.01em] text-ink sm:text-[4.25rem]">
                And no one notices —<br />until it’s built wrong.
              </h2>
              <p className="mt-5 max-w-[34ch] text-[1.1875rem] leading-relaxed text-ink-muted">
                Execution has no undo. The disagreement was always there, buried
                in the thread.
              </p>
            </Section>

            {/* Finale: headline at top, CTA at bottom, the 3D Decision card
                stays clear in the centre. */}
            <section
              style={{
                position: "absolute",
                top: "400vh",
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "13vh 6vw 8vh",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div>
                <Eyebrow>The resolution</Eyebrow>
                <h2 className="font-display text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.02em] text-ink sm:text-[4.25rem]">
                  One decision.<br />Caught in time.
                </h2>
              </div>
              <a
                href="/dashboard"
                style={{ pointerEvents: "auto" }}
                className="accent-underline inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-sans text-[1.0625rem] font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5"
              >
                Go to Dashboard →
              </a>
            </section>
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}

/** Lives inside ScrollControls; writes scroll offset straight to the rail's
 *  transform each frame (no React re-render). */
function ScrollProgressDriver({
  targetRef,
}: {
  targetRef: React.RefObject<HTMLDivElement>;
}) {
  const scroll = useScroll();
  useFrame(() => {
    const el = targetRef.current;
    if (el) el.style.transform = `scaleY(${scroll.offset})`;
  });
  return null;
}

function Eyebrow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="mb-4 font-sans text-label font-semibold uppercase tracking-[0.16em] text-accent"
      style={style}
    >
      {children}
    </div>
  );
}

function Section({
  index,
  align,
  children,
}: {
  index: number;
  align: "left" | "right" | "center";
  children: React.ReactNode;
}) {
  const justify =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  const textAlign = align === "center" ? "center" : "left";
  return (
    <section
      style={{
        position: "absolute",
        top: `${index * 100}vh`,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        padding: "0 8vw",
        textAlign,
        pointerEvents: "none",
      }}
    >
      <div style={{ maxWidth: 640 }}>{children}</div>
    </section>
  );
}
