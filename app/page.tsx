import Link from "next/link";

// Temporary placeholder until the landing page lands in step 8 of SPEC 02.
export default function Home() {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
        <Link href="/biblioteca" className="btn lg" style={{ marginTop: 24 }}>
          ▶ EXPLORAR JUEGOS
        </Link>
      </section>
    </div>
  );
}
