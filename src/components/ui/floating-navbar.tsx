"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export const FloatingNav = ({
  navItems,
  className,
  autoHide = false,
  leftIcon,
  cta,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
  autoHide?: boolean;
  leftIcon?: React.ReactNode;
  cta?: { label: string; href: string };
}) => {
  const { scrollYProgress } = useScroll();

  const [visible, setVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const TOP_LOCK = 0.2; // Keep navbar visible while within top 20% of the page

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // If autoHide is disabled, keep the navbar visible at all times
    if (!autoHide) {
      if (!visible) setVisible(true);
      return;
    }
    if (typeof current === "number") {
      const prev = scrollYProgress.getPrevious() ?? 0;
      const direction = current - prev;

      // Always show in the top section to prevent flicker/hide at the top
      if (scrollYProgress.get() <= TOP_LOCK) return setVisible(true);

      // Reveal on upward/no scroll, hide only when scrolling down
      setVisible(direction <= 0);
    }
  });

  if (!autoHide) {
    return (
      <div className="fixed top-6 inset-x-0 px-4 z-[5000]">
        <div
          className={cn(
            "flex items-center justify-between px-6 py-3 bg-card rounded-full shadow-lg w-full max-w-3xl mx-auto",
            "border border-border backdrop-blur",
            className
          )}
        >
          <div className="flex items-center">
            <div className="flex items-center mr-6">
              {leftIcon ?? (
                <div className="flex items-center gap-2">
                  <Image src="/logo-Te.svg" alt="TuringEyes" width={40} height={40} className="w-10 h-10" />
                  <span className="text-base font-medium font-heading text-foreground">TuringEyes</span>
                </div>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((navItem, idx) => (
              <Link
                key={`link-${idx}`}
                href={navItem.link}
                className="text-sm text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium"
              >
                {navItem.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href={cta?.href ?? "/start"}
              className="inline-flex items-center justify-center px-5 py-2 text-sm bg-foreground text-background rounded-full hover:bg-foreground/80 transition-colors"
            >
              {cta?.label ?? "Test Your Perception"}
            </Link>
          </div>

          <button
            className="md:hidden flex items-center"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
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
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-col divide-y divide-border">
                {navItems.map((navItem, idx) => (
                  <Link
                    key={`m-link-${idx}`}
                    href={navItem.link}
                    className="py-3 text-base text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    {navItem.name}
                  </Link>
                ))}
              </nav>
              {cta && (
                <Link
                  href={cta.href}
                  className="mt-4 inline-flex w-full items-center justify-center px-5 py-3 text-base bg-foreground text-background rounded-full hover:bg-foreground/80 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {cta.label}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="fixed top-6 inset-x-0 px-4 z-[5000]"
      >
        <div
          className={cn(
            "flex items-center justify-between px-6 py-3 bg-card rounded-full shadow-lg w-full max-w-3xl mx-auto",
            "border border-border backdrop-blur",
            className
          )}
        >
          <div className="flex items-center">
            <div className="flex items-center mr-6">
              {leftIcon ?? (
                <div className="flex items-center gap-2">
                  <Image src="/logo-Te.svg" alt="TuringEyes" width={40} height={40} className="w-10 h-10" />
                  <span className="text-base font-medium font-heading text-foreground">TuringEyes</span>
                </div>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((navItem, idx) => (
              <Link
                key={`link-${idx}`}
                href={navItem.link}
                className="text-sm text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium"
              >
                {navItem.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href={cta?.href ?? "/start"}
              className="inline-flex items-center justify-center px-5 py-2 text-sm bg-foreground text-background rounded-full hover:bg-foreground/80 transition-colors"
            >
              {cta?.label ?? "Test Your Perception"}
            </Link>
          </div>

          <button
            className="md:hidden flex items-center"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
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
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-col divide-y divide-border">
                {navItems.map((navItem, idx) => (
                  <Link
                    key={`m-link-${idx}`}
                    href={navItem.link}
                    className="py-3 text-base text-foreground hover:text-primary focus-visible:text-primary transition-colors font-medium text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    {navItem.name}
                  </Link>
                ))}
              </nav>
              {cta && (
                <Link
                  href={cta.href}
                  className="mt-4 inline-flex w-full items-center justify-center px-5 py-3 text-base bg-foreground text-background rounded-full hover:bg-foreground/80 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {cta.label}
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
