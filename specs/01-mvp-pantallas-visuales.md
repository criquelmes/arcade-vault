# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-26
> **Objetivo:** Portar las cinco pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) a rutas del App Router con datos mock, sin implementar ningún juego.

---

## Por qué existe este spec

El repo tiene el tema visual ya portado (`app/globals.css` contiene todas las clases de `references/templates/styles.css`) y las fuentes cargadas en `app/layout.tsx`, pero `app/page.tsx` sigue siendo el template de Create Next App.
El template de referencia es una SPA con router por hash y globals en `window`.
Este spec traduce ese prototipo a la arquitectura real de Next.js 16 (App Router + Cache Components) manteniendo la fidelidad visual.

---

## Alcance

**Dentro:**

- Navbar global (logo, links Biblioteca / Salón de la Fama con estado activo, contador `CRÉDITOS · 03` estático, botón de sesión, menú hamburguesa móvil con panel lateral).
- Footer global `© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`.
- Pantalla **Biblioteca** en `/`: hero, buscador por nombre, chips de categoría, grilla de tarjetas con efecto tilt, estado vacío "NO HAY RESULTADOS".
- Pantalla **Detalle** en `/games/[id]`: portada, tags, descripción larga, stat-strip, botones "JUGAR AHORA" y "VOLVER AL VAULT", leaderboard mock de 10 filas.
- Pantalla **Reproductor** en `/games/[id]/play`: HUD (jugador, puntuación, vidas, nivel), botones PAUSA/REANUDAR, FIN, SALIR, arena CRT decorativa, overlay de pausa, modal "FIN DEL JUEGO" con guardado de puntaje simulado.
- Pantalla **Auth** en `/login`: pestañas Iniciar sesión / Crear cuenta, campo de correo solo en "Crear cuenta", botón "JUGAR COMO INVITADO", botones sociales decorativos.
- Pantalla **Salón de la Fama** en `/hall-of-fame`: pestañas por juego, podio top 3, tabla de 12 filas, fila "TU MEJOR MARCA" mock si hay usuario.
- Página 404 temática (`app/not-found.tsx`) usada por ids de juego inexistentes.
- Sesión mock en `localStorage` (`av_user`) compartida entre navbar, auth y reproductor.
- Guardado simulado de puntajes en `localStorage` (`av_scores`).

**Fuera de alcance (para specs futuros):**

- Cualquier juego jugable (Bloque Buster, Caída, Serpentina, etc.).
- Autenticación real, backend, validación de formularios o login social funcional.
- Mostrar los puntajes de `av_scores` en el detalle o el Salón de la Fama.
- Sistema de créditos funcional (el contador es estático).
- Menú desplegable del usuario (el botón `NOMBRE ▾` cierra sesión directamente, como en el template).
- Reescritura de estilos a utilidades Tailwind.
- Tests automatizados.

---

## Modelo de datos

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug usado en la URL, p. ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS de portada, p. ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;       // ya formateado, p. ej. "12.4K"
};

export const GAMES: Game[];                              // los 8 juegos de data.jsx, sin cambios
export const CATS: ("TODOS" | GameCategory)[];          // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function getGame(id: string): Game | undefined;
```

```ts
// lib/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[];             // port literal de data.jsx
```

```ts
// lib/session.ts — persistencia mock (solo cliente)
export type User = { name: string };            // name en mayúsculas, máx. 10 caracteres
export type SavedScore = { game: string; score: number; name: string; at: number };

// Claves de localStorage (mismas que el template, sin versionado):
//   "av_user"   → User | null (JSON)
//   "av_scores" → SavedScore[] (JSON)
```

Convenciones:

- Números se formatean con `toLocaleString("es-ES")`.
- Semillas idénticas al template: detalle `id.length * 17 + 3` con 10 filas; salón `id.length * 23 + 7` con 12 filas.

---

## Estructura de archivos

```
app/
  layout.tsx                    (modificado: Nav + <main className="av-main"> + footer)
  page.tsx                      (reemplazado: Biblioteca)
  not-found.tsx                 (nuevo)
  login/page.tsx                (nuevo)
  hall-of-fame/page.tsx         (nuevo)
  games/[id]/page.tsx           (nuevo: Detalle)
  games/[id]/play/page.tsx      (nuevo: Reproductor)
components/
  nav.tsx                       (cliente)
  footer.tsx
  library.tsx                   (cliente: búsqueda + filtros)
  game-card.tsx                 (cliente: tilt)
  leaderboard.tsx
  game-player.tsx               (cliente)
  auth-form.tsx                 (cliente)
  hall-of-fame.tsx              (cliente: pestañas)
lib/
  games.ts
  scores.ts
  session.ts
```

---

## Plan de implementación

1. **Datos.** Crear `lib/games.ts` y `lib/scores.ts` portando `data.jsx` con los tipos del modelo. Verificar: `npx tsc --noEmit` pasa.
2. **Sesión mock.** Crear `lib/session.ts` con `useUser()` (basado en `useSyncExternalStore` sobre `av_user`, snapshot de servidor `null`), `signIn(user)`, `signOut()` y `saveScore(entry)`. `signIn`/`signOut` emiten un evento para que todos los suscriptores se actualicen.
3. **Shell.** Crear `components/nav.tsx` (activo vía `usePathname`: Biblioteca activa en `/` y `/games/*`) y `components/footer.tsx`. Montarlos en `app/layout.tsx` alrededor de `<main className="av-main">`. Verificar: `npm run dev` muestra nav y footer sobre la página por defecto.
4. **Biblioteca.** Reemplazar `app/page.tsx` por el hero + `components/library.tsx` + `components/game-card.tsx`. Tarjeta y botón JUGAR navegan con `Link`/`router.push` a `/games/[id]`.
5. **Detalle + 404.** Crear `app/games/[id]/page.tsx` (Server Component, `PageProps<"/games/[id]">`, `generateStaticParams` desde `GAMES`, `notFound()` si `getGame` devuelve `undefined`) y `components/leaderboard.tsx`. Crear `app/not-found.tsx` con estilo arcade y botón a `/`.
6. **Reproductor.** Crear `app/games/[id]/play/page.tsx` (resuelve el juego en servidor, `notFound()` si no existe) y `components/game-player.tsx` portando `reproductor.jsx`: intervalo de puntaje, subida de nivel, pausa, fin, reinicio, modal y `saveScore`. Nombre inicial = `user.name` o `"INVITADO"`. SALIR → `/games/[id]`.
7. **Auth.** Crear `app/login/page.tsx` y `components/auth-form.tsx`. Enviar → `signIn({ name: (usuario || "PLAYER1").toUpperCase().slice(0, 10) })` y navegar a `/`. "JUGAR COMO INVITADO" → `signOut()` y navegar a `/`.
8. **Salón de la Fama.** Crear `app/hall-of-fame/page.tsx` y `components/hall-of-fame.tsx` portando `salon.jsx` (pestañas, podio, tabla, fila "TU MEJOR MARCA" cuando `useUser()` no es `null`).
9. **Limpieza.** Eliminar assets del scaffold que ya no se usen en `public/` solo si ninguna pantalla los referencia. Pasar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `/` muestra el hero "ARCADE VAULT" y 8 tarjetas de juego.
- [ ] Escribir "ca" en el buscador deja solo las tarjetas CAÍDA y ROCAS.
- [ ] Pulsar el chip SHOOTER deja solo INVASORES y ROCAS.
- [ ] Buscar "zzz" muestra "NO HAY RESULTADOS".
- [ ] Pasar el mouse sobre una tarjeta la inclina; al salir vuelve a su posición.
- [ ] Clic en una tarjeta navega a `/games/<id>` con título, descripción larga y leaderboard de 10 filas.
- [ ] `/games/no-existe` y `/games/no-existe/play` muestran la 404 temática.
- [ ] "JUGAR AHORA" navega a `/games/<id>/play` y la puntuación del HUD aumenta sola.
- [ ] PAUSA detiene la puntuación y muestra "EN PAUSA"; REANUDAR la reanuda.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] "GUARDAR PUNTUACIÓN" agrega una entrada a `localStorage["av_scores"]` y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] En `/login`, la pestaña CREAR CUENTA muestra el campo de correo; INICIAR SESIÓN lo oculta.
- [ ] Enviar el formulario con usuario "px_kai" redirige a `/` y el navbar muestra "PX_KAI ▾".
- [ ] Recargar la página mantiene la sesión; pulsar "PX_KAI ▾" cierra sesión y vuelve a mostrar "Iniciar Sesión".
- [ ] Con sesión iniciada, el reproductor muestra el nombre del usuario en el HUD.
- [ ] `/hall-of-fame` muestra podio y 12 filas; cambiar de pestaña cambia los nombres y puntajes.
- [ ] Con sesión iniciada, `/hall-of-fame` muestra la fila "TU MEJOR MARCA"; sin sesión no aparece.
- [ ] El link activo del navbar es Biblioteca en `/` y `/games/*`, y Salón de la Fama en `/hall-of-fame`.
- [ ] Con ancho < 900px aparece el botón ≡ y abre el panel lateral; elegir un link lo cierra.
- [ ] La consola del navegador no muestra errores de hidratación en ninguna pantalla.

---

## Decisiones

- **Sí:** rutas reales del App Router (`/`, `/games/[id]`, `/games/[id]/play`, `/login`, `/hall-of-fame`). URLs compartibles y Server Components donde no hay interacción.
- **No:** SPA por hash como el template. Ignora el App Router y obliga a que todo sea cliente.
- **Sí:** slugs de URL en inglés (`/games`, `/play`, `/login`, `/hall-of-fame`), aunque la UI siga en español.
- **No:** slugs en español (`/juegos`, `/jugar`, `/auth`, `/salon`). Descartado tras la primera revisión.
- **Sí:** sesión mock en `localStorage["av_user"]`. Permite ver los estados con/sin usuario sin backend.
- **Sí:** `useSyncExternalStore` para leer la sesión. Evita mismatches de hidratación (el servidor siempre renderiza "sin usuario") y sincroniza navbar, salón y reproductor sin un Context provider.
- **No:** Context provider en el layout. Agrega un componente cliente envolviendo todo el árbol sin necesidad.
- **Sí:** simulación del reproductor idéntica al template, incluido el guardado en `av_scores`. Deja listo el flujo de fin de partida para cuando existan juegos.
- **No:** mostrar `av_scores` en leaderboards. Requiere lógica de merge; va en otro spec.
- **Sí:** reusar las clases ya portadas en `app/globals.css`. Máxima fidelidad con mínimo trabajo.
- **No:** reescribir a utilidades Tailwind. Mucho trabajo y riesgo de diferencias visuales.
- **Sí:** datos en `lib/games.ts` y `lib/scores.ts`, componentes en `components/`.
- **Sí:** `notFound()` + `app/not-found.tsx` temático para ids inexistentes.
- **Sí:** claves `av_user` y `av_scores` sin versionado, iguales al template. Son datos mock descartables.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Cache Components exige que lo dinámico esté en `<Suspense>` o cacheado; `params` es dinámico | `generateStaticParams` en `/games/[id]` y `/games/[id]/play`; consultar `node_modules/next/dist/docs/` antes de escribir las páginas. |
| Leer `localStorage` en el render provoca errores de hidratación | Toda lectura pasa por `useUser()` con snapshot de servidor `null`. |
| `localStorage` no disponible (modo privado) o JSON corrupto | `lib/session.ts` envuelve lecturas/escrituras en `try/catch` y cae a `null` / `[]`. |
| `setInterval` del reproductor sigue corriendo al salir | Limpiar el intervalo en el cleanup del efecto, como el template. |

---

## Lo que **no** está en este spec

- Ningún juego jugable.
- Autenticación real ni login social.
- Puntajes guardados visibles en rankings.
- Créditos funcionales.
- Migración de estilos a Tailwind.
- Tests automatizados.

Cada uno, si llega, va en su propio spec.
