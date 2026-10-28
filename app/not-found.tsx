import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in">
      <section className="av-hero" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <h1 className="flicker">404</h1>
        <div className="sub">
          FIN DE LA PARTIDA <span className="blink">_</span>
        </div>
        <p
          style={{
            maxWidth: 460,
            margin: "24px auto 32px",
            color: "var(--ink-dim)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Esta dirección no lleva a ningún juego del vault. Vuelve a la biblioteca y elige otro cartucho.
        </p>
        <Link href="/" className="btn lg">
          VOLVER AL VAULT
        </Link>
      </section>
    </div>
  );
}
