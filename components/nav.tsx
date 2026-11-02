"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useUser } from "@/components/user-provider";

type Section = "inicio" | "biblioteca" | "salon" | "acerca" | "auth";

function sectionOf(pathname: string | null): Section | null {
  if (pathname === null) return null;
  if (pathname === "/") return "inicio";
  if (pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos")) return "biblioteca";
  if (pathname.startsWith("/salon")) return "salon";
  if (pathname.startsWith("/acerca")) return "acerca";
  if (pathname.startsWith("/auth")) return "auth";
  return null;
}

// usePathname suspends on unlisted dynamic params under Cache Components, so the
// fallback renders the same bar without an active link.
export function Nav() {
  return (
    <Suspense fallback={<NavBar pathname={null} />}>
      <NavWithPathname />
    </Suspense>
  );
}

function NavWithPathname() {
  return <NavBar pathname={usePathname()} />;
}

function NavBar({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useUser();
  const section = sectionOf(pathname);
  const activeClass = (s: Section) => (section === s ? "active" : "");
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={activeClass("inicio")}>
            Inicio
          </Link>
          <Link href="/biblioteca" className={activeClass("biblioteca")}>
            Biblioteca
          </Link>
          <Link href="/salon" className={activeClass("salon")}>
            Salón de la Fama
          </Link>
          <Link href="/acerca" className={activeClass("acerca")}>
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={logout}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={activeClass("inicio")} onClick={close}>
          Inicio
        </Link>
        <Link href="/biblioteca" className={activeClass("biblioteca")} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={activeClass("salon")} onClick={close}>
          Salón de la Fama
        </Link>
        <Link href="/acerca" className={activeClass("acerca")} onClick={close}>
          Acerca de
        </Link>
        <Link href="/auth" className={activeClass("auth")} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
