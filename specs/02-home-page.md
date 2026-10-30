# SPEC 02 — Home page de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-30
> **Objetivo:** Portar el home de `references/templates/home-about/home.jsx` a la ruta `/`, moviendo la Biblioteca a `/games`.

---

## Por qué existe este spec

SPEC 01 dejó la Biblioteca en `/` porque el template original no tenía landing.
El nuevo template `references/templates/home-about/` agrega un home (hero, features, preview de juegos, stats, actividad, precios y CTA final) que pasa a ser la puerta de entrada.
Eso obliga a reubicar la Biblioteca y a corregir todos los enlaces que asumían que `/` era la Biblioteca.
La página "Acerca de" del mismo template queda para otro spec.

---

## Alcance

**Dentro:**

- Home en `/` con las siete secciones del template, en este orden:
  1. **Hero:** siluetas pixel flotantes (8 SVG), eyebrow `▸ INSERTA UNA MONEDA_`, título en tres líneas, subtítulo, CTAs `▶ EXPLORAR JUEGOS` (→ `/games`) y `✦ CREAR CUENTA` (→ `/login?mode=signup`), indicador `DESLIZA ▼`.
  2. **// 01 ¿POR QUÉ ARCADE VAULT?:** 4 feature cards con íconos pixel (GAMEPAD, FREE, TROPHY, ROCKET).
  3. **// 02 JUEGOS DISPONIBLES AHORA:** rail con los primeros 6 juegos de `GAMES` (mini-card → `/games/<id>`) y botón `VER TODOS LOS JUEGOS →` (→ `/games`).
  4. **Stats:** 3 bloques; el primero muestra el conteo real `GAMES.length` en lugar de `12+`.
  5. **// 03 ACTIVIDAD EN VIVO:** ticker "ÚLTIMAS PUNTUACIONES" (7 filas) y "TOP JUGADORES · HOY" (5 filas con barra) con link `VER SALÓN →` (→ `/hall-of-fame`). Datos mock estáticos.
  6. **// 04 PRECIOS:** tarjeta "JUGADOR VAULT $0 / SIEMPRE" con lista, botón `EMPEZAR GRATIS →` (→ `/login?mode=signup`), sello `FREE PLAY` y 3 preguntas FAQ.
  7. **CTA final:** `¿LISTO PARA JUGAR?` + `INSERTAR MONEDA →` (→ `/games`).
- Animación "reveal" al hacer scroll (IntersectionObserver añade `.in` a cada `.reveal`).
- Biblioteca movida a `/games` (mismo hero `ARCADE VAULT` + `<Library />` que hoy tiene `/`).
- Navbar: nuevo link **Inicio** (`/`), Biblioteca apunta a `/games`; el logo sigue yendo a `/`. Aplica al navbar de escritorio y al panel móvil.
- Enlaces de "volver" redirigidos a `/games`: `VOLVER AL VAULT` en detalle y 404, `VOLVER A LA BIBLIOTECA` en el salón, `VOLVER AL VAULT` del modal del reproductor.
- `/login?mode=signup` abre el formulario en la pestaña CREAR CUENTA.
- Estilos del home portados a `app/globals.css` desde `references/templates/home-about/styles.css`.
- Copy ajustado a los datos reales: la feature "JUEGOS CLÁSICOS" nombra juegos propios (Bloque Buster, Caída, Serpentina) en vez de marcas reales.

**Fuera de alcance (para specs futuros):**

- Página "Acerca de" (`about.jsx`) con formulario de contacto, y su link en el navbar.
- Mostrar puntajes de `av_scores` en el ticker o el top de jugadores.
- Estadísticas reales (partidas por día, ranking global calculado).
- Cambios a la redirección post-login/invitado (sigue yendo a `/`, que ahora es el home).
- Reescritura de estilos a utilidades Tailwind.
- Tests automatizados.

---

## Modelo de datos

```ts
// lib/home.ts — contenido mock del home (solo lectura, sin persistencia)
import type { GameColor } from "@/lib/games";

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export type Feature = { icon: FeatureIconKind; title: string; desc: string; color: GameColor };
export type Stat = { n: string; u: string; s: string };                        // n del primero = String(GAMES.length)
export type RecentScore = { player: string; game: string; score: number; ago: string; color: GameColor }; // ago: "hace 2 min"
export type TopPlayer = { rank: number; player: string; score: number };
export type Faq = { q: string; a: string };

export const FEATURES: Feature[];        // 4, copy del template (ajustado en "JUEGOS CLÁSICOS")
export const STATS: Stat[];              // 3
export const RECENT_SCORES: RecentScore[]; // 7 filas del template, literales
export const TOP_PLAYERS: TopPlayer[];   // 5 filas del template, literales
export const PRICING_PERKS: string[];    // 6 ítems de la lista de precios
export const FAQS: Faq[];                // 3
```

Convenciones:

- Números formateados con `toLocaleString("es-ES")` como en el template.
- El ancho de la barra del top es `100 - i * 16` %, calculado en el render.
- No hay claves nuevas en `localStorage`.

---

## Implementación

1. **Mover la Biblioteca a `/games`.** Crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (hero `ARCADE VAULT` + `<Library />`) y `metadata.title` "Biblioteca · Arcade Vault". `/` sigue mostrando la Biblioteca temporalmente. Prueba: `/games` y `/` se ven iguales.
2. **Actualizar navegación y enlaces.** En `components/nav.tsx`: agregar sección `"inicio"` (activa solo en `/`), Biblioteca activa en `/games` y `/games/*`, link Inicio en escritorio y panel móvil, link Biblioteca a `/games`. Cambiar a `/games` los `href`/`router.push` de `app/not-found.tsx`, `app/games/[id]/page.tsx`, `components/hall-of-fame.tsx` y `components/game-player.tsx`. `components/auth-form.tsx` no cambia su redirección.
3. **Portar estilos.** Copiar a `app/globals.css` los bloques `HOME PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING` de `references/templates/home-about/styles.css`, más `@keyframes float` y cualquier keyframe/clase usada por esos bloques que falte. Agregar regla `@media (prefers-reduced-motion: reduce)` que deja `.reveal` visible sin transición. Prueba: `npm run build` sin errores.
4. **Datos del home.** Crear `lib/home.ts` con el modelo de datos de arriba.
5. **Arte pixel.** Crear `components/pixel-art.tsx` con `FloatingSilhouettes` y `FeatureIcon` (port literal de los SVG del template, Server Components).
6. **Reveal.** Crear `components/reveal-observer.tsx` (`"use client"`) que en un efecto observa todos los `.reveal`, añade `.in` al intersectar (threshold 0.12) y desconecta en el cleanup. No renderiza nada.
7. **Home, parte 1.** Reemplazar `app/page.tsx` por el home con `<RevealObserver />`, Hero, sección // 01 y sección // 02 (mini-cards como `<Link>` a `/games/<id>`). Prueba: `/` muestra el hero y el rail de 6 juegos.
8. **Home, parte 2.** Agregar Stats y // 03 ACTIVIDAD EN VIVO.
9. **Home, parte 3.** Agregar // 04 PRECIOS y CTA final.
10. **Signup directo.** En `components/auth-form.tsx`, leer `mode` con `useSearchParams()` y usar `"up"` como pestaña inicial si `mode === "signup"`. Envolver `<AuthForm />` en `<Suspense>` dentro de `app/login/page.tsx` (exigido por Cache Components). Consultar `node_modules/next/dist/docs/` antes de escribirlo.

---

## Criterios de aceptación

- [ ] `/` muestra el home con hero, // 01, // 02, stats, // 03, // 04 y CTA final, en ese orden.
- [ ] `/games` muestra la Biblioteca con buscador, chips y grilla, igual que antes en `/`.
- [ ] El navbar muestra Inicio, Biblioteca y Salón de la Fama, en escritorio y en el panel móvil.
- [ ] Inicio está activo solo en `/`; Biblioteca está activa en `/games`, `/games/<id>` y `/games/<id>/play`.
- [ ] `▶ EXPLORAR JUEGOS`, `VER TODOS LOS JUEGOS →` e `INSERTAR MONEDA →` navegan a `/games`.
- [ ] `✦ CREAR CUENTA` y `EMPEZAR GRATIS →` navegan a `/login?mode=signup` y el formulario abre en CREAR CUENTA con el campo de correo visible.
- [ ] `/login` sin parámetro abre en INICIAR SESIÓN.
- [ ] El rail de // 02 muestra exactamente 6 mini-cards y cada una navega a `/games/<id>` del juego correcto.
- [ ] El primer bloque de stats muestra `8` (el valor de `GAMES.length`).
- [ ] La feature "JUEGOS CLÁSICOS" no menciona Arkanoid, Tetris ni Snake.
- [ ] `VER SALÓN →` navega a `/hall-of-fame`.
- [ ] Las secciones con `.reveal` empiezan invisibles y aparecen al entrar en el viewport.
- [ ] Con `prefers-reduced-motion: reduce` las secciones `.reveal` se ven sin animación.
- [ ] `VOLVER AL VAULT` (detalle, 404, modal del reproductor) y `VOLVER A LA BIBLIOTECA` (salón) navegan a `/games`.
- [ ] Iniciar sesión o entrar como invitado redirige a `/` (el home).
- [ ] Con ancho < 900px, feature-grid, activity-grid y pricing-grid se reacomodan según los media queries del template.
- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] La consola del navegador no muestra errores de hidratación en `/`, `/games` ni `/login?mode=signup`.

---

## Decisiones

- **Sí:** home en `/` y Biblioteca en `/games`. Encaja con `/games/[id]` existente: el listado y el detalle comparten prefijo.
- **No:** Biblioteca en `/library` o home en `/home`. Rompe la jerarquía de URLs o deja la landing fuera de la raíz.
- **Sí:** "Acerca de" en un spec aparte; su link en el navbar llega con su página. Evita un link a la 404.
- **No:** incluir `/about` aquí. Agrega un formulario y otra pantalla a un spec que ya toca navegación.
- **Sí:** ajustar el copy a los datos reales (`GAMES.length`, nombres propios). El template contradice el catálogo y nombra marcas de terceros.
- **No:** copiar literal `12+ JUEGOS` y "Arkanoid, Tetris, Snake".
- **Sí:** `/login?mode=signup` para abrir directo en CREAR CUENTA. Los dos CTAs de registro cumplen lo que prometen.
- **Sí:** los botones de "volver" van a `/games`; la redirección post-login queda en `/`. "Volver al vault" significa volver al catálogo; tras entrar, el home es la bienvenida.
- **Sí:** actividad en vivo con mock estático en `lib/home.ts`. Mostrar `av_scores` sigue diferido como en SPEC 01.
- **No:** mezclar `av_scores` en el ticker. Requiere componente cliente y lógica de merge.
- **Sí:** el home es Server Component; solo `RevealObserver` es cliente. El contenido se prerenderiza completo.
- **No:** convertir todo el home en cliente como el template (`useReveal` dentro de `Home`).
- **Sí:** mini-cards y CTAs como `<Link>`, no `onClick` con `navigate`. Navegación real del App Router con prefetch.
- **Sí:** portar los bloques CSS del template a `app/globals.css`, como en SPEC 01.
- **No:** reescribir a utilidades Tailwind.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `.reveal` arranca con `opacity: 0`; sin JS o si el observer falla, las secciones quedan invisibles | `RevealObserver` se monta en la misma página; regla `prefers-reduced-motion` las muestra siempre. Aceptado para el caso sin JS. |
| `useSearchParams()` en `/login` bajo Cache Components exige `<Suspense>`; sin él falla el build | Paso 10 envuelve `<AuthForm />` en `<Suspense>` y se consulta `node_modules/next/dist/docs/` antes. |
| Algún enlace a `/` que significaba "Biblioteca" queda sin actualizar | El paso 2 lista los cinco puntos encontrados; buscar `href="/"` y `push("/")` antes de cerrar. |
| Los bloques CSS del template usan keyframes o variables no portados | Paso 3 revisa cada `animation:` de los bloques copiados contra `globals.css`. |
| Navbar con un link más desborda antes del breakpoint actual | Verificar a 900–1100px; si desborda, ajustar el breakpoint del navbar en `globals.css`. |

---

## Lo que **no** está en este spec

- Página "Acerca de" ni formulario de contacto.
- Puntajes guardados (`av_scores`) visibles en el home.
- Estadísticas o rankings reales.
- Migración de estilos a Tailwind.
- Tests automatizados.

Cada uno, si llega, va en su propio spec.
