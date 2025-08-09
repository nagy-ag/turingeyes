"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { BadgeGroup } from "@/components/base/badges/badge-groups";

type Step = {
  number: number;
  title: string;
  description: string;
};

function useQuarterCountdown(zone: string = "Europe/Berlin") {
  function remainingSeconds() {
    const now = DateTime.now().setZone(zone);
    const end = now.endOf("quarter");
    const secs = end.diff(now, "seconds").seconds;
    return Math.max(0, Math.floor(secs));
  }

  const [seconds, setSeconds] = useState<number>(() => remainingSeconds());

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(remainingSeconds());
    }, 1000);
    return () => clearInterval(id);
  }, [zone]);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted = `${days}d:${pad(hours)}h:${pad(minutes)}m:${pad(secs)}s`;

  return { days, hours, minutes, seconds: secs, formatted };
}

function ReportPreviewCard() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold">Preview of Your Report</h3>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Sample
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        After the test you’ll instantly see your score and how you compare to the global average.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Your Accuracy</span>
            <span className="font-semibold">80%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: "80%" }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Global Average</span>
            <span className="font-semibold">62%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-full bg-foreground/70" style={{ width: "62%" }} />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-sm bg-primary" /> Your score
            <span className="inline-block h-3 w-3 rounded-sm bg-foreground/70 ml-4" /> Global avg
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ number, title, description }: Step) {
  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {number}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function TuringEyesLandingPage() {
  const { formatted } = useQuarterCountdown();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="flex justify-center w-full py-6 px-4">
        <div className="flex items-center justify-between px-6 py-3 bg-card rounded-full shadow-lg w-full max-w-3xl relative z-10 border border-border">
          <div className="flex items-center">
            <div className="flex items-center mr-6">
              <div className="flex items-center gap-2">
                <Image src="/logo-Te.svg" alt="TuringEyes" width={40} height={40} className="w-10 h-10" />
                <span className="text-base font-medium font-heading text-foreground">TuringEyes</span>
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#how"
              className="text-sm text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium"
            >
              How It Works
            </a>
            <a
              href="#publications"
              className="text-sm text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium"
            >
              Publications
            </a>
            <a
              href="#about"
              className="text-sm text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium"
            >
              About
            </a>
          </nav>
          <div className="hidden md:block">
            <a
              href="/start"
              className="inline-flex items-center justify-center px-5 py-2 text-sm bg-foreground text-background rounded-full hover:bg-foreground/80 transition-colors"
            >
              Test Your Perception
            </a>
          </div>
          <button
            className="md:hidden flex items-center"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Icon icon={mobileOpen ? "lucide:x" : "lucide:menu"} className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[6000]" role="dialog" aria-modal="true" id="mobile-nav">
          <div
            className="absolute inset-0 bg-transparent backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-4 left-4 top-16 md:top-24 rounded-2xl border border-border bg-card text-card-foreground shadow-lg p-4">
            <div className="relative flex items-center justify-center mb-2">
              <div className="flex items-center gap-2">
                <Image src="/logo-Te.svg" alt="TuringEyes" width={28} height={28} className="w-7 h-7" />
                <span className="font-heading font-medium text-foreground">TuringEyes</span>
              </div>
              <button
                className="absolute right-2 top-2 p-2 rounded-md text-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <Icon icon="lucide:x" className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col divide-y divide-border">
              <a
                href="#how"
                className="py-3 text-base text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium text-center"
                onClick={() => setMobileOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#publications"
                className="py-3 text-base text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium text-center"
                onClick={() => setMobileOpen(false)}
              >
                Publications
              </a>
              <a
                href="#about"
                className="py-3 text-base text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium text-center"
                onClick={() => setMobileOpen(false)}
              >
                About
              </a>
            </nav>
            <a
              href="/start"
              className="mt-4 inline-flex w-full items-center justify-center px-5 py-3 text-base bg-foreground text-background rounded-full hover:bg-foreground/80 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Test Your Perception
            </a>
          </div>
        </div>
      )}
      <div className="absolute inset-0 opacity-5">
        <div style={{}} className="h-full w-full" />
      </div>
      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <a href="/start" aria-live="polite" className="inline-block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            <BadgeGroup
              addonText={formatted}
              size="lg"
              color="brand"
              theme="light"
              align="leading"
              className="cursor-pointer select-none bg-primary/10 text-primary ring-primary/25 hover:bg-primary/5 [&>span:first-child]:bg-background [&>span:first-child]:ring-primary/30 [&>svg]:text-current"
            >
              Join the challenge
            </BadgeGroup>
          </a>
        </div>
        <h1 className="font-heading text-6xl md:text-7xl font-bold bg-gradient-to-b from-foreground to-primary/75 bg-clip-text text-transparent mb-6 tracking-tight">
          TuringEyes
        </h1>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-8 max-w-2xl">
          Test Your Ability to Spot AI-Generated Images
        </h2>
        <p className="text-lg text-muted-foreground mb-12 max-w-3xl leading-relaxed">
          Join thousands of users in the ultimate visual intelligence challenge. Can you distinguish
          between human creativity and artificial intelligence? Put your perception skills to the
          test with our curated collection of images.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <a
            href="/start"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg font-semibold"
          >
            Start Testing
          </a>
          <a
            href="#leaderboard"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground px-8 py-3 text-lg font-semibold"
          >
            View Leaderboard
          </a>
        </div>
      </main>

      {/* Report Preview Section */}
      <section aria-labelledby="report-preview" className="relative z-10 px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 id="report-preview" className="font-heading text-xl md:text-2xl font-semibold mb-4">
            See What You’ll Get
          </h2>
          <p className="text-muted-foreground mb-6">
            A quick snapshot of your performance, broken down against the global average.
          </p>
          <ReportPreviewCard />
        </div>
      </section>
      {/* How It Works */}
      <section id="how" aria-labelledby="how-title" className="relative z-10 px-6 py-16 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <h2 id="how-title" className="font-heading text-2xl md:text-3xl font-semibold mb-8 text-center">
            How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              number={1}
              title="Quick Onboarding"
              description="Two fast questions to calibrate your profile (skill & country)."
            />
            <StepCard
              number={2}
              title="Core Test"
              description="Decide Human or AI per image, then rate confidence. We record response time invisibly."
            />
            <StepCard
              number={3}
              title="Results & Upgrade"
              description="Instant score with global comparison. Save via email/Google and optionally add demographics."
            />
          </div>
        </div>
      </section>

      {/* Publications */}
      <section id="publications" aria-labelledby="pubs-title" className="relative z-10 px-6 py-16 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <h2 id="pubs-title" className="font-heading text-2xl md:text-3xl font-semibold mb-6 text-center">
            Publications
          </h2>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Curated research and articles about human perception vs. AI-generated imagery. Links coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" aria-labelledby="about-title" className="relative z-10 px-6 py-16 scroll-mt-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="about-title" className="font-heading text-2xl md:text-3xl font-semibold mb-4">
            About TuringEyes
          </h2>
          <p className="text-muted-foreground">
            TuringEyes is a fast, delightful challenge to measure how well people can distinguish
            AI-generated from human-made images — while collecting high-quality, privacy-aware data
            to advance research. No visible timers, just your intuition.
          </p>
        </div>
      </section>
      {/* Footer */}
      <footer className="relative z-10 px-6 pt-12 pb-6 border-t border-border">
        <div className="relative z-10 max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
          
          {/* Left side: Logo & Tagline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo-Te.svg" alt="TuringEyes" width={24} height={24} className="w-6 h-6" />
              <span className="font-heading font-medium text-foreground">TuringEyes</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Advancing visual AI literacy through interactive testing and research.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TuringEyes. All rights reserved.
            </p>
          </div>

          {/* Right side: Links */}
          <div className="flex flex-col sm:flex-row sm:justify-end sm:gap-12 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/start" className="text-muted-foreground hover:text-primary transition-colors">Test Interface</a></li>
                <li><a href="#leaderboard" className="text-muted-foreground hover:text-primary transition-colors">Leaderboard</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Statistics</a></li>
                <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">AI Detection Tips</a></li>
                <li><a href="#publications" className="text-muted-foreground hover:text-primary transition-colors">Research Papers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Feedback</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Background Watermark */}
        <div className="pointer-events-none select-none mt-4 md:mt-6">
          <div className="w-[80vw] mx-auto">
            <div className="text-center text-transparent bg-clip-text bg-gradient-to-b from-background to-foreground/5 font-heading font-bold text-[12.5vw] leading-none whitespace-nowrap">
              TuringEyes
            </div>
          </div>
        </div>
      </footer>


    </div>
  );
}

export default TuringEyesLandingPage;
