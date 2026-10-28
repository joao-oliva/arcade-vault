"use client";

import { useUser } from "@/components/user-provider";

type Props = { gameTitle: string; rank: number; score: number; animationDelay: string };

export function YourBestRow({ gameTitle, rank, score, animationDelay }: Props) {
  const { user } = useUser();
  if (!user) return null;

  return (
    <>
      <div className="tr you-label">▸ TU MEJOR MARCA EN {gameTitle}</div>
      <div className="tr you" style={{ animationDelay }}>
        <div className="rk" style={{ color: "var(--yellow)" }}>
          #{String(rank).padStart(2, "0")}
        </div>
        <div className="pl" style={{ color: "var(--yellow)" }}>
          {user.name}
        </div>
        <div className="sc" style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>
          {score.toLocaleString("es-ES")}
        </div>
        <div className="dt">11/05/2026</div>
      </div>
    </>
  );
}
