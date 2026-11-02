"use client";

import { useEffect } from "react";

const READY_CLASS = "reveal-ready";

// Fades .reveal sections in as they enter the viewport. The CSS only hides .reveal while <html>
// carries READY_CLASS, so without JavaScript (or without IntersectionObserver) everything stays visible.
export function RevealOnScroll() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );

    root.classList.add(READY_CLASS);
    // Sections already on screen get .in on the observer's first callback.
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      root.classList.remove(READY_CLASS);
    };
  }, []);

  return null;
}
