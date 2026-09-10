# 01 · MVP Pantallas Visuales

**Estado:** implementado
**Depende de:** —
**Fecha:** 2026-09-09

**Objetivo:** Portar a Next.js App Router (TypeScript) las 5 pantallas del prototipo estático en `references/templates/` (biblioteca, detalle de juego, reproductor simulado, autenticación y salón de la fama), como una experiencia únicamente visual sin implementar ningún juego real.

## Alcance

**Dentro:**
- Rutas reales de App Router:
  - `/` — Biblioteca (grid de juegos, búsqueda, filtro por categoría).
  - `/juego/[id]` — Detalle del juego (info, tabla de mejores puntuaciones, botón jugar).
  - `/juego/[id]/jugar` — Reproductor simulado (HUD, arena CRT animada por CSS, modal de fin de partida).
  - `/login` — Autenticación (tabs iniciar sesión / crear cuenta, invitado, botones sociales decorativos).
  - `/salon` — Salón de la Fama (tabs por juego, podio top 3, tabla de ranking).
- `Nav` (barra superior + panel móvil) presente en todas las pantallas vía `app/layout.tsx`.
- Datos mock de juegos y jugadores (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) portados a un módulo TypeScript tipado.
- Sesión de usuario simulada: login/registro acepta cualquier dato, no valida contra backend; persiste en `localStorage`. Opción "jugar como invitado" que navega sin loguear.
- Guardado de puntuaciones simuladas del reproductor en `localStorage` (mismo comportamiento que el template: al terminar la partida falsa, el usuario puede guardar su score con iniciales).
- La pantalla de reproductor mantiene la simulación falsa completa del template (puntuación que sube sola por `setInterval`, vidas, nivel, pausa, fin de juego, modal de guardado) — sigue siendo un mock visual, no un juego jugable.
- Estilos: reutilizar las clases ya portadas en `app/globals.css` (nav, botones, hero, filtros, grid, cards, cover-*, detail, player, auth, salón). Cualquier maquetación nueva o ajuste estructural que no exista ya como clase se resuelve con utilidades de Tailwind directamente en el JSX, no se agregan más clases custom a `globals.css` salvo que sea indispensable portar algo del template que falte.
- Textos en español, igual que el template.
- Responsive: mantener los breakpoints y comportamiento móvil (menú hamburguesa) del template.

**Fuera de alcance:**
- Cualquier juego real jugable (Bloque Buster, Caída, Serpentina, etc.). El "reproductor" sigue siendo una simulación visual, igual que en el template.
- Backend, API routes, base de datos o autenticación real (OAuth de Google/GitHub son botones decorativos sin funcionalidad).
- Persistencia server-side o multi-dispositivo de sesión/puntuaciones.
- Cambios al modelo de negocio, nuevas pantallas o funcionalidades no presentes en `references/templates/`.
- SEO avanzado, accesibilidad exhaustiva o internacionalización más allá de lo que ya trae el template.

## Modelo de datos

Módulo `lib/data.ts` (o similar), tipado en TypeScript, portado desde `references/templates/data.jsx`:

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // clase CSS cover-*
  color: GameColor;
  best: number;
  plays: string;
}

export const GAMES: Game[];
export const CATS: ("TODOS" | GameCategory)[];
export const PLAYERS: string[];

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}
export function seededScores(seed: number, count?: number): ScoreRow[];
```

Módulo `lib/storage.ts` (client-only helpers sobre `localStorage`, mismas claves que el template):

```ts
export interface User { name: string }
export interface ScoreEntry { game: string; score: number; name: string; at: number }

export function getUser(): User | null;
export function setUser(user: User | null): void; // av_user
export function saveScore(entry: Omit<ScoreEntry, "at">): void; // av_scores
```

No se introduce ninguna otra estructura de datos nueva.

## Plan de implementación

1. **Datos y utilidades.** Crear `lib/data.ts` (GAMES, CATS, PLAYERS, seededScores tipados) y `lib/storage.ts` (helpers de sesión/puntuaciones en localStorage). Sistema queda igual de funcional (solo se añaden módulos, nada roto).
2. **Nav global.** Crear `components/nav.tsx` (client component) portando `nav.jsx`: logo, links activos por ruta (`usePathname`), contador de créditos estático, botón de sesión (login/logout usando `lib/storage.ts`), panel móvil con backdrop. Integrarlo en `app/layout.tsx` para que aparezca en todas las páginas.
3. **Biblioteca (`/`).** Reescribir `app/page.tsx` portando `biblioteca.jsx`: hero, buscador, chips de categoría, grid de `GameCard` (client component con efecto tilt), estado vacío. Usa `next/link` hacia `/juego/[id]`.
4. **Detalle (`/juego/[id]`).** Crear `app/juego/[id]/page.tsx` portando `detalle.jsx`: cover, tags, descripción, stats, leaderboard con `seededScores`, botones "Jugar ahora" (→ `/juego/[id]/jugar`) y "Volver al vault" (→ `/`). `notFound()` si el id no existe en `GAMES`.
5. **Reproductor (`/juego/[id]/jugar`).** Crear `app/juego/[id]/jugar/page.tsx` (client component) portando `reproductor.jsx`: HUD, arena CRT animada, pausa, fin de juego, modal para guardar puntuación (usa `lib/storage.ts` y el usuario de sesión si existe, o "INVITADO"). Botón "Salir" vuelve a `/juego/[id]`.
6. **Autenticación (`/login`).** Crear `app/login/page.tsx` (client component) portando `auth.jsx`: tabs iniciar sesión/crear cuenta, campos, botón "jugar como invitado", botones sociales decorativos (sin acción real). Al enviar el formulario, guarda usuario simulado con `lib/storage.ts` y redirige a `/`.
7. **Salón de la Fama (`/salon`).** Crear `app/salon/page.tsx` (client component) portando `salon.jsx`: tabs por juego, podio top 3, tabla completa, fila destacada "tu mejor marca" si hay sesión iniciada.
8. **Footer y limpieza.** Mover el `<footer>` del template a `app/layout.tsx` (junto al Nav). Confirmar que `app/globals.css` no requiere clases adicionales; si falta alguna (p. ej. algo no capturado en la primera migración), portarla. Eliminar contenido de ejemplo del scaffold (`create-next-app`) que ya no aplique.

Cada paso deja la app funcional y navegable con `npm run dev`.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores y las 5 rutas (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/login`, `/salon`) son accesibles por URL directa.
- [ ] El `Nav` aparece en las 5 pantallas, resalta el link activo, y el menú hamburguesa funciona en viewport móvil (<840px).
- [ ] La Biblioteca muestra las 8 tarjetas de `GAMES`, filtra por categoría, busca por texto y muestra el estado "NO HAY RESULTADOS" cuando no hay coincidencias.
- [ ] Click en una tarjeta o en "JUGAR" navega a `/juego/[id]` con el detalle correcto (cover, descripción, stats, leaderboard de 10 filas).
- [ ] "JUGAR AHORA" navega a `/juego/[id]/jugar`; el HUD muestra puntuación incrementando sola, pausa detiene el incremento, "FIN" abre el modal de fin de juego con la puntuación final.
- [ ] Guardar la puntuación en el modal la persiste en `localStorage` bajo `av_scores` y muestra el mensaje de confirmación.
- [ ] En `/login`, enviar el formulario (login o registro) o pulsar "jugar como invitado" navega a `/` y actualiza el estado de sesión visible en el `Nav`.
- [ ] Cerrar sesión desde el `Nav` limpia `localStorage` (`av_user`) y el botón vuelve a mostrar "Iniciar Sesión".
- [ ] `/salon` muestra podio (top 3) y tabla de 12 filas por juego seleccionado; si hay sesión iniciada, muestra la fila "tu mejor marca".
- [ ] No existe ningún archivo, componente o lógica que implemente un juego real (colisiones, física, input de teclado para jugar, etc.) — el reproductor es visual/simulado únicamente.
- [ ] `npm run lint` pasa sin errores nuevos introducidos por este trabajo.

## Decisiones tomadas y descartadas

- **Rutas reales de App Router** en vez de replicar el routing por hash del template: se descarta el hash-routing porque Next.js ya resuelve navegación real con URLs limpias; es la opción nativa del framework y la que pidió el usuario.
- **CSS existente + Tailwind para lo nuevo**, en vez de reescribir todo a Tailwind: `app/globals.css` ya tiene portado el look exacto del template (neón, scanlines, clip-paths); reescribirlo a utilidades arriesgaba perder fidelidad visual sin necesidad. Tailwind se usa para cualquier maquetación estructural adicional no cubierta por esas clases.
- **`localStorage` mock para sesión y puntuaciones**, igual que el template: no hay backend en este MVP, y el usuario confirmó mantener el mismo comportamiento simulado (login acepta cualquier dato, "invitado" no loguea).
- **Mantener la simulación falsa completa del reproductor** (setInterval de puntuación, HUD, modal), en vez de una versión estática: el usuario confirmó que sigue siendo 100% mock visual y no cuenta como "implementar un juego".
- **Sin API routes ni base de datos**: fuera de alcance explícito; toda la app es client-side sobre datos mock y `localStorage`.

## Riesgos identificados

- Los efectos `useState`/`useEffect` del reproductor y el tilt 3D de las tarjetas requieren marcar los componentes como Client Components (`"use client"`); si se omite, Next.js fallará en build o en runtime por usar hooks en un Server Component.
- `localStorage` no existe durante el renderizado en servidor: los componentes que lo usan deben leerlo solo dentro de `useEffect` o en el cliente, para evitar mismatches de hidratación.
