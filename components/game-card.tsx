"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Game } from "@/lib/games";

const BUTTON_COLOR: Record<Game["color"], string> = {
  cyan: "",
  green: "",
  magenta: "magenta",
  yellow: "yellow",
};

export function GameCard({ game }: { game: Game }) {
  const tiltRef = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = "";
  };

  // The whole card is the link; "JUGAR" is visual only, since it led to the same detail page in the template.
  return (
    <Link
      ref={tiltRef}
      href={`/juegos/${game.id}`}
      className="card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="cover">
        <div className={"cover-bg " + game.cover}></div>
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <span className={"btn " + BUTTON_COLOR[game.color]} aria-hidden="true">
            JUGAR
          </span>
        </div>
      </div>
    </Link>
  );
}
