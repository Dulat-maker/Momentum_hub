"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ArrowRightIcon, LogoMark } from "./icons";
import { SiteLightning } from "./site-lightning";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Adapted from a shadcn-flavoured "cinematic footer". The original leaned on
 * shadcn tokens (--foreground, --primary, ...) that this project does not
 * define, so every colour is re-expressed with our own tokens, and the copy
 * is the hub's rather than the sample app's.
 */
const STYLES = `
.momentum-footer {
  --pill-bg-1: color-mix(in oklch, var(--color-fg) 7%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--color-fg) 2%, transparent);
  --pill-border: color-mix(in oklch, var(--color-fg) 12%, transparent);
  --pill-highlight: color-mix(in oklch, var(--color-fg) 14%, transparent);
  --pill-shadow: color-mix(in oklch, var(--color-brand-deep) 35%, transparent);

  --pill-bg-1-hover: color-mix(in oklch, var(--color-brand) 28%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--color-brand) 10%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--color-brand-mid) 55%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--color-brand) 45%, transparent);
}

@keyframes momentum-footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.95; }
}

@keyframes momentum-footer-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.momentum-footer-breathe {
  animation: momentum-footer-breathe 9s ease-in-out infinite alternate;
}

.momentum-footer-marquee {
  animation: momentum-footer-marquee 38s linear infinite;
}

.momentum-footer-grid {
  background-size: 64px 64px;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--color-fg) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--color-fg) 4%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 28%, black 72%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 28%, black 72%, transparent);
}

.momentum-footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, var(--color-brand) 42%, transparent) 0%,
    color-mix(in oklch, var(--color-brand-deep) 24%, transparent) 42%,
    transparent 70%
  );
}

.momentum-footer-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  border: 1px solid var(--pill-border);
  box-shadow:
    0 10px 30px -10px var(--pill-shadow),
    inset 0 1px 1px var(--pill-highlight);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: background 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              color 0.3s ease;
}

/* Only where a pointer can actually hover. On a touch screen :hover sticks
   after a tap and the button stays lit until something else is tapped. */
@media (hover: hover) and (pointer: fine) {
  .momentum-footer-pill:hover {
    background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
    border-color: var(--pill-border-hover);
    box-shadow: 0 20px 44px -12px var(--pill-shadow-hover);
    color: var(--color-fg);
  }
}

.momentum-footer-giant {
  font-size: 23vw;
  line-height: 0.78;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--color-fg) 7%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--color-brand-mid) 26%, transparent) 0%, transparent 62%);
  -webkit-background-clip: text;
  background-clip: text;
}

.momentum-footer-title {
  background: linear-gradient(180deg, var(--color-fg) 0%, color-mix(in oklch, var(--color-brand-mid) 70%, transparent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 24px color-mix(in oklch, var(--color-brand) 30%, transparent));
}

@media (prefers-reduced-motion: reduce) {
  .momentum-footer-breathe,
  .momentum-footer-marquee {
    animation: none;
  }
}
`;

const MARQUEE_PHRASES = [
  "Stay in motion. Stay in momentum",
  "Every scrimmage in one place",
  "Workshops and outreach days",
  "One account per team",
  "Honest feedback after the event",
  "Find your alliance partner",
];

/**
 * One pass of the strip. The track holds two of these and slides by exactly
 * half its width, so a pass has to be wider than the screen for the loop to
 * look seamless - six phrases clear that on any monitor.
 */
function MarqueeRun() {
  return (
    <div className="flex items-center gap-10 px-5">
      {MARQUEE_PHRASES.map((phrase, index) => (
        <span key={phrase} className="flex items-center gap-10">
          {phrase}
          <span
            aria-hidden="true"
            className={index % 2 === 0 ? "text-brand-mid" : "text-brand-soft"}
          >
            &#10022;
          </span>
        </span>
      ))}
    </div>
  );
}

/** Pulls towards the cursor. Plain listeners, cleaned up on unmount. */
function MagneticPill({
  children,
  className = "",
  href,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Touch screens emulate one mousemove on tap and often never send
    // mouseleave, so the button slides out from under the finger and stays
    // there - which is why it felt stuck and needed a long press.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const onMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;

      gsap.to(element, {
        x: offsetX * 0.3,
        y: offsetY * 0.3,
        scale: 1.04,
        ease: "power2.out",
        duration: 0.4,
      });
    };

    const onLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        scale: 1,
        ease: "elastic.out(1, 0.35)",
        duration: 1.1,
      });
    };

    element.addEventListener("mousemove", onMove);
    element.addEventListener("mouseleave", onLeave);

    return () => {
      element.removeEventListener("mousemove", onMove);
      element.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(element);
    };
  }, []);

  const shared = `momentum-footer-pill inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={shared}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      ref={ref as React.Ref<HTMLButtonElement>}
      className={shared}
    >
      {children}
    </button>
  );
}

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantRef.current,
        { y: "12vh", scale: 0.85, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        },
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 45%",
            end: "bottom bottom",
            scrub: 1,
          },
        },
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* The curtain: clip-path on this wrapper is what keeps the fixed
          footer below hidden until this block scrolls into view. */}
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      >
        <footer className="momentum-footer fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-canvas text-fg">
          <div
            aria-hidden="true"
            className="momentum-footer-aurora momentum-footer-breathe pointer-events-none absolute top-1/2 left-1/2 z-0 h-[58vh] w-[78vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="momentum-footer-grid pointer-events-none absolute inset-0 z-0"
          />

          {/* The footer paints its own background over the page, so the
              lightning has to be drawn again inside it. */}
          <SiteLightning className="z-0" />

          <div
            ref={giantRef}
            aria-hidden="true"
            className="momentum-footer-giant font-display pointer-events-none absolute -bottom-[4vh] left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap"
          >
            MOMENTUM
          </div>

          <div className="absolute top-14 left-0 z-10 w-full -rotate-2 scale-110 overflow-hidden border-y border-line bg-canvas/60 py-3.5 shadow-2xl backdrop-blur-md">
            <div className="momentum-footer-marquee flex w-max text-xs font-semibold tracking-[0.3em] text-fg-muted uppercase md:text-sm">
              <MarqueeRun />
              <MarqueeRun />
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-24 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6">
            <h2
              ref={headingRef}
              className="momentum-footer-title font-display mb-10 text-center text-5xl font-semibold tracking-tight md:text-7xl"
            >
              Ready to begin?
            </h2>

            <div ref={linksRef} className="flex w-full flex-col items-center gap-5">
              <div className="flex w-full flex-wrap justify-center gap-4">
                <MagneticPill
                  href="/signup"
                  className="px-9 py-4 text-sm font-semibold text-fg md:text-base"
                >
                  Register your team
                  <ArrowRightIcon className="size-4" />
                </MagneticPill>

                <MagneticPill
                  href="/events"
                  className="px-9 py-4 text-sm font-semibold text-fg md:text-base"
                >
                  Browse events
                </MagneticPill>
              </div>

              <div className="mt-1 flex w-full flex-wrap justify-center gap-3 md:gap-5">
                <MagneticPill
                  href="/teams"
                  className="px-6 py-2.5 text-xs font-medium text-fg-muted md:text-sm"
                >
                  Teams
                </MagneticPill>
                <MagneticPill
                  href="/community"
                  className="px-6 py-2.5 text-xs font-medium text-fg-muted md:text-sm"
                >
                  Community
                </MagneticPill>
                <MagneticPill
                  href="/login"
                  className="px-6 py-2.5 text-xs font-medium text-fg-muted md:text-sm"
                >
                  Log in
                </MagneticPill>
              </div>
            </div>
          </div>

          <div className="relative z-20 flex w-full flex-col items-center justify-between gap-5 px-6 pb-8 md:flex-row md:px-12">
            <p className="order-2 text-[10px] font-semibold tracking-widest text-fg-dim uppercase md:order-1 md:text-xs">
              An independent project, not an official FIRST site.
            </p>

            <div className="momentum-footer-pill order-1 flex cursor-default items-center gap-2.5 rounded-full px-5 py-2.5 md:order-2">
              <LogoMark className="h-6 w-auto" />
              <span className="text-[10px] font-bold tracking-widest text-fg-muted uppercase md:text-xs">
                Built by
              </span>
              <span className="font-display text-xs font-semibold text-fg md:text-sm">
                Momentum
              </span>
              <span className="text-[10px] font-semibold text-brand-mid md:text-xs">
                #38157
              </span>
            </div>

            <MagneticPill
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              ariaLabel="Back to top"
              className="group order-3 size-12 text-fg-muted"
            >
              <svg
                className="size-5 transition-transform duration-300 group-hover:-translate-y-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </MagneticPill>
          </div>
        </footer>
      </div>
    </>
  );
}
