// src/pages/Home.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiKeyModal } from "../features/api-key/ApiKeyModal";

/**
 * Flow:
 * - Hero section with crisp heading and readable subtext
 * - Primary CTA: Get started (accent, high contrast)
 * - Secondary CTA: How it works (outline)
 * - No translucent overlays; background uses subtle radial vignette only
 */
export function Home() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const steps: ReadonlyArray<{ id: number; title: string; desc: string }> = [
    {
      id: 1,
      title: "Upload your paper",
      desc: "PDF or DOCX. We parse and prepare claims for extraction.",
    },
    {
      id: 2,
      title: "Streamed claims",
      desc: "Claims appear live in the dashboard, categorized by citation strength.",
    },
    {
      id: 3,
      title: "Validate sources",
      desc: "Upload cited PDFs to verify support semantically, not just by keywords.",
    },
    {
      id: 4,
      title: "Act on gaps",
      desc: "For uncited claims, review suggested references and update your paper. We store your answers for 2 hours",
    },
  ];

  return (
    <>
      <div className="relative min-h-screen">
        {/* Subtle vignette for depth, not transparency */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 50% -10%, rgba(79, 140, 255, 0.18) 0%, rgba(15, 17, 21, 0) 60%)",
          }}
        />

        <div className="mx-auto max-w-5xl px-4 pt-28 text-center">
          <h1 className="mx-auto max-w-3xl text-5xl font-extrabold tracking-tight">
            Verify claims. Build trust. Save time.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg subtle">
            PaperTrail AI highlights cited, weakly cited, and uncited claims -
            then verifies them semantically against their sources. 
          </p>

          <div className="mt-9 flex items-center justify-center gap-4">
            <button className="btn btn-accent" onClick={() => setOpen(true)}>
              Get Started with PaperTrail AI
            </button>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <FeatureCard
              title="Extract claims"
              desc="Find factual statements and their in-text citations."
            />
            <FeatureCard
              title="Verify semantically"
              desc="Retrieve best passages and verify support beyond keyword match."
            />
            <FeatureCard
              title="Act with confidence"
              desc="Color-coded verdicts, reasoning, and suggested citations."
            />
          </div>

          <section id="how-it-works" className="mt-24 text-left">
            <h2 className="text-2xl font-semibold">How it works</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {steps.map((s) => (
                <article
                  key={s.id}
                  className="card p-5 hover:brightness-[1.06]"
                >
                  <div className="mb-3 inline-flex items-center gap-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
                      style={{ background: "var(--accent)", color: "#0b0e14" }}
                      aria-hidden
                    >
                      {s.id}
                    </span>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                  </div>
                  <p className="text-sm subtle">{s.desc}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <ApiKeyModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => navigate("/app")}
      />
    </>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card p-5 hover:brightness-110">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm subtle">{desc}</p>
    </div>
  );
}
