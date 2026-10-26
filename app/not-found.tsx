import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24, padding: "96px 24px" }}>
      <div className="pixel neon-magenta flicker" style={{ fontSize: "clamp(56px, 12vw, 112px)" }}>404</div>
      <div className="pixel neon-cyan" style={{ fontSize: 14 }}>PANTALLA NO ENCONTRADA</div>
      <p style={{ color: "var(--ink-dim)", maxWidth: 420 }}>Esta dirección no lleva a ningún juego del vault.</p>
      <Link href="/" className="btn lg">VOLVER AL VAULT</Link>
    </div>
  );
}
