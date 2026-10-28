import Link from "next/link";
import { Suspense } from "react";
import { YourBestRow } from "@/components/your-best-row";
import { GAMES, getGame, seededScores } from "@/lib/games";

const TOP_CLASS = [" top1", " top2", " top3"];

export default function HallOfFamePage({ searchParams }: PageProps<"/salon">) {
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      {/* searchParams is request-time data under Cache Components, so only the board waits for it. */}
      <Suspense
        fallback={
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <span className="spinner" aria-label="Cargando" />
          </div>
        }
      >
        <HallBoard searchParams={searchParams} />
      </Suspense>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}

async function HallBoard({ searchParams }: Pick<PageProps<"/salon">, "searchParams">) {
  const { juego } = await searchParams;
  const requested = Array.isArray(juego) ? juego[0] : juego;
  const game = (requested && getGame(requested)) || GAMES[0];

  const rows = seededScores(game.id.length * 23 + 7, 12);
  const youRank = Math.floor(8 + (game.id.length % 4));
  const youScore = rows[5].score - 2400 || 9999;

  return (
    <>
      <div className="hall-tabs">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={`/salon?juego=${g.id}`}
            scroll={false}
            className={"chip" + (game.id === g.id ? " active" : "")}
            aria-current={game.id === g.id ? "page" : undefined}
          >
            {g.title}
          </Link>
        ))}
      </div>

      <div className="podium">
        <div className="podium-slot silver">
          <div className="rank-num">02</div>
          <div className="name">{rows[1].name}</div>
          <div className="score">{rows[1].score.toLocaleString("es-ES")}</div>
          <div className="date">{rows[1].date}</div>
        </div>
        <div className="podium-slot gold">
          <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>
            CAMPEÓN
          </div>
          <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
            01
          </div>
          <div className="name">{rows[0].name}</div>
          <div className="score" style={{ fontSize: 20 }}>
            {rows[0].score.toLocaleString("es-ES")}
          </div>
          <div className="date">{rows[0].date}</div>
        </div>
        <div className="podium-slot bronze">
          <div className="rank-num">03</div>
          <div className="name">{rows[2].name}</div>
          <div className="score">{rows[2].score.toLocaleString("es-ES")}</div>
          <div className="date">{rows[2].date}</div>
        </div>
      </div>

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((r, i) => (
          <div key={r.name} className={"tr" + (TOP_CLASS[i] ?? "")} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{r.score.toLocaleString("es-ES")}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
        <YourBestRow
          gameTitle={game.title}
          rank={youRank}
          score={youScore}
          animationDelay={`${rows.length * 50 + 50}ms`}
        />
      </div>
    </>
  );
}
