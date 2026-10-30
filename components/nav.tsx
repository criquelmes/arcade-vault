"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useUser } from "@/lib/session";

type Section = "inicio" | "biblioteca" | "salon" | "about" | "auth";

function sectionOf(pathname: string | null): Section | null {
  if (pathname === null) return null;
  if (pathname === "/") return "inicio";
  if (pathname === "/games" || pathname.startsWith("/games/")) return "biblioteca";
  if (pathname.startsWith("/hall-of-fame")) return "salon";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/login")) return "auth";
  return null;
}

// Presentational nav. `pathname` is null while the active route is unknown
// (Suspense fallback during prerender), which renders no active link.
export function NavView({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const user = useUser();
  const section = sectionOf(pathname);
  const cls = (name: Section) => (section === name ? "active" : "");
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">ARCADE <span className="neon-magenta">VAULT</span></div>
        </Link>
        <div className="links">
          <Link href="/" className={cls("inicio")}>Inicio</Link>
          <Link href="/games" className={cls("biblioteca")}>Biblioteca</Link>
          <Link href="/hall-of-fame" className={cls("salon")}>Salón de la Fama</Link>
          <Link href="/about" className={cls("about")}>Acerca de</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={signOut}>{user.name} ▾</button>
        ) : (
          <Link href="/login" className="btn auth-btn">Iniciar Sesión</Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú" aria-expanded={open}>≡</button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")} inert={!open}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/" className={cls("inicio")} onClick={close}>Inicio</Link>
        <Link href="/games" className={cls("biblioteca")} onClick={close}>Biblioteca</Link>
        <Link href="/hall-of-fame" className={cls("salon")} onClick={close}>Salón de la Fama</Link>
        <Link href="/about" className={cls("about")} onClick={close}>Acerca de</Link>
        <Link href="/login" className={cls("auth")} onClick={close}>{user ? "Cuenta" : "Iniciar Sesión"}</Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>CRÉDITOS · 03</div>
      </aside>
    </>
  );
}

export function Nav() {
  return <NavView pathname={usePathname()} />;
}
