"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import type { Game } from "@/lib/games";
import { saveScore, useUser } from "@/lib/session";

type Run = { score: number; level: number };

const POINTS_PER_LEVEL = 2500;

// Level goes up once each time the score crosses a multiple of POINTS_PER_LEVEL.
function runReducer(run: Run, action: { type: "tick"; delta: number } | { type: "reset" }): Run {
  if (action.type === "reset") return { score: 0, level: 1 };
  const score = run.score + action.delta;
  return { score, level: 1 + Math.floor(score / POINTS_PER_LEVEL) };
}

export function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const user = useUser();
  const [{ score, level }, dispatch] = useReducer(runReducer, { score: 0, level: 1 });
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  // null until edited in the modal, so the HUD follows the session once it hydrates.
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const name = nameInput ?? (user ? user.name : "INVITADO");

  useEffect(() => {
    if (over || paused) return;
    const t = setInterval(() => dispatch({ type: "tick", delta: Math.floor(10 + Math.random() * 90) }), 220);
    return () => clearInterval(t);
  }, [over, paused]);

  const endGame = () => setOver(true);
  const restart = () => { dispatch({ type: "reset" }); setLives(3); setPaused(false); setOver(false); setSaved(false); };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat"><div className="l">Jugador</div><div className="v" style={{ color: "var(--ink)" }}>{name}</div></div>
          <div className="hud-stat"><div className="l">Puntuación</div><div className="v">{score.toLocaleString("es-ES")}</div></div>
          <div className="hud-stat lives"><div className="l">Vidas</div><div className="v">{"♥ ".repeat(lives).trim() || "—"}</div></div>
          <div className="hud-stat level"><div className="l">Nivel</div><div className="v">{String(level).padStart(2, "0")}</div></div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused(p => !p)}>{paused ? "REANUDAR" : "PAUSA"}</button>
          <button className="btn magenta" onClick={endGame}>FIN</button>
          <button className="btn ghost" onClick={() => router.push(`/games/${game.id}`)}>SALIR</button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>PULSA REANUDAR PARA CONTINUAR</div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
            <h2 id="game-over-title">FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input value={name} onChange={(e) => setNameInput(e.target.value.toUpperCase().slice(0, 10))} placeholder="TUS INICIALES" aria-label="Tus iniciales" />
                <button className="btn yellow" onClick={() => { saveScore({ game: game.id, score, name }); setSaved(true); }}>GUARDAR PUNTUACIÓN</button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>JUGAR DE NUEVO</button>
              <button className="btn magenta" onClick={() => router.push("/games")}>VOLVER AL VAULT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
