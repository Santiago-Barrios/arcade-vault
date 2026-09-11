# 02 · Landing Page (Home)

**Estado:** implementado
**Depende de:** SPEC 01
**Fecha:** 2026-09-10

**Objetivo:** Portar la landing page de `references/templates/home-about/home.jsx` a la ruta `/` de la app, moviendo la Biblioteca actual a `/games`.

## Alcance

**Dentro:**
- Nueva pantalla `/` (Home/landing), portada desde `references/templates/home-about/home.jsx`, con sus 6 secciones:
  - Hero con siluetas flotantes (`FloatingSilhouettes`) y CTAs (`EXPLORAR JUEGOS`, `CREAR CUENTA`).
  - «¿Por qué Arcade Vault?» — 4 feature cards con iconos pixel (`FeatureIcon`).
  - Preview de juegos — `mini-rail` con los primeros 6 `GAMES` (`MiniCard`), enlazando a `/juego/[id]`.
  - Stats (`12+ JUEGOS`, `MILES DE PARTIDAS`, `GLOBAL RANKING`).
  - Actividad en vivo — ticker de últimas puntuaciones + top 5 jugadores del día.
  - Precios + FAQ — plan único gratuito y 3 preguntas frecuentes.
  - CTA final (`INSERTAR MONEDA`).
- La Biblioteca actual (contenido hoy en `/`) se mueve a `/games`, sin cambios funcionales.
- Actualización de todos los enlaces internos que hoy asumen que `/` es la Biblioteca (`Nav`, botón "Volver al vault" en detalle, redirección post-login).
- Nuevo link "Inicio" en el `Nav` (desktop y panel móvil), apuntando a `/`.
- Animación `reveal` al hacer scroll (`IntersectionObserver`), portada del template.
- Portar a `app/globals.css` únicamente los bloques CSS que la landing necesita (ver Modelo de datos/Plan más abajo) — nada más.
- Textos en español y comportamiento responsive, igual que el template.

**Fuera de alcance:**
- La pantalla "Acerca de" / Contacto (`about.jsx`) y su CSS asociado. Se define en una spec posterior.
- La sección "GAMEPAD" del CSS del template (`home-about/styles.css` líneas 1151–1620) — `home.jsx` no la usa.
- Cualquier juego real jugable, backend, o persistencia server-side (sigue vigente lo definido en SPEC 01).
- Derivar el ticker de actividad o el top de jugadores desde `lib/data.ts` o `localStorage` — se usan literalmente los datos mock del template.
- Cambios funcionales a `/salon`, `/login`, `/juego/[id]` o `/juego/[id]/jugar` más allá de reapuntar los enlaces que asumían `/` como Biblioteca.

## Modelo de datos

No se introduce ninguna estructura de datos nueva en `lib/`. Los datos mock que la landing muestra (features, ticker de actividad, top jugadores, stats, FAQ) se definen como constantes locales dentro de `components/home.tsx`, tipadas inline, copiadas tal cual del template (`home.jsx`). El componente `MiniCard` reutiliza el tipo `Game` ya existente en `lib/data.ts` y consume `GAMES.slice(0, 6)`.

## Plan de implementación

1. **Mover Biblioteca a `/games`.** Crear `app/games/page.tsx` que renderiza `<Library />` (el mismo contenido que hoy expone `app/page.tsx`). `/` se deja intacto en este paso. La app sigue funcionando, con la Biblioteca accesible en ambas rutas temporalmente.
2. **Reapuntar enlaces internos.** En `components/nav.tsx`: el link "Biblioteca" pasa a `/games`; `isBiblioteca` pasa a `pathname === "/games" || pathname.startsWith("/juego")`; `handleSignOut` sigue redirigiendo a `/`. En `app/juego/[id]/page.tsx`: el botón "Volver al vault" apunta a `/games`. En `app/login/page.tsx`: la redirección tras login/registro/invitado apunta a `/games`. Cada cambio deja la navegación coherente con el nuevo mapa de rutas.
3. **CSS de la landing.** Copiar a `app/globals.css` (al final, sin tocar lo existente) los siguientes bloques de `references/templates/home-about/styles.css`:
   - `/* ===== HOME PAGE ===== */` (líneas 930–1070): hero, silos, secciones, features, mini-rail, stats, CTA final, `.reveal`.
   - `/* ===== ACTIVITY ===== */` (líneas 1621–1671): `.activity-grid`, `.ticker`, `.top-row`, `.lb-link`.
   - `/* ===== PRICING ===== */` (líneas 1672–1725): `.price-card`, `.pc-*`, `.pricing-faq`, `.faq-*`.
   - Los `@keyframes` nuevos que estos bloques requieren: `bounce`, `float`, `pulse-led`, `tickin`.
   No se copian los bloques `GAMEPAD` ni `ABOUT` del mismo archivo.
4. **Componente Home.** Crear `components/home.tsx` (`"use client"`) portando `home.jsx`: hook `useReveal` (IntersectionObserver sobre `.reveal`), `FloatingSilhouettes`, `FeatureIcon`, `MiniCard`, y las 6 secciones descritas en el Alcance. El `navigate(...)` del template se traduce a `next/link` (`<Link href="...">`) o `useRouter().push(...)` según corresponda a cada CTA.
5. **Montar la landing.** Reescribir `app/page.tsx` para renderizar `<Home />` en vez de `<Library />`.
6. **Link "Inicio" en el Nav.** Añadirlo como primer link en la lista de desktop y en el panel móvil de `components/nav.tsx`, activo cuando `pathname === "/"`. No se añade "Acerca de".
7. **Verificación y limpieza.** Ejecutar `npm run lint`. Revisar visualmente las 6 rutas (`/`, `/games`, `/juego/[id]`, `/juego/[id]/jugar`, `/login`, `/salon`) en viewport desktop y móvil (<840px), confirmando que no queda ningún enlace roto ni referencia residual a `/` como Biblioteca.

Cada paso deja la app funcional y navegable con `npm run dev`.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores; `/`, `/games`, `/juego/[id]`, `/juego/[id]/jugar`, `/login` y `/salon` son accesibles por URL directa.
- [ ] `/` muestra la landing con las 6 secciones (hero, features, preview de juegos, stats, actividad en vivo, precios+FAQ, CTA final) con el contenido del template.
- [ ] `/games` muestra la Biblioteca con el mismo comportamiento que tenía antes en `/` (grid de `GAMES`, búsqueda, filtro por categoría).
- [ ] Las secciones marcadas `.reveal` aparecen animadas al hacer scroll hasta ellas.
- [ ] Los 6 `MiniCard` del preview de juegos navegan a `/juego/[id]` correcto al hacer click.
- [ ] Los CTAs de la landing navegan correctamente: "EXPLORAR JUEGOS" e "INSERTAR MONEDA" → `/games`; "CREAR CUENTA" y "EMPEZAR GRATIS" → `/login`; "VER SALÓN" → `/salon`.
- [ ] El `Nav` muestra "Inicio" resaltado en `/` y "Biblioteca" resaltado en `/games` y en `/juego/*`; ningún link del `Nav` apunta a una ruta inexistente.
- [ ] El botón "Volver al vault" en el detalle de juego y la redirección tras login/registro/invitado apuntan a `/games`, no a `/`.
- [ ] `app/globals.css` no contiene clases `.gp-*` (gamepad) ni `.about-*` — solo los bloques HOME, ACTIVITY y PRICING descritos en el plan.
- [ ] `npm run lint` pasa sin errores nuevos introducidos por este trabajo.

## Decisiones tomadas y descartadas

- **Biblioteca en `/games`** en vez de `/biblioteca`: decisión explícita del usuario.
- **Datos de actividad/stats como mock literal del componente**, en vez de derivarlos de `lib/data.ts` o `localStorage`: mantiene la spec fiel al template y evita introducir lógica de agregación no pedida; coherente con el enfoque "MVP visual" de SPEC 01.
- **Añadir solo los bloques CSS nuevos a `app/globals.css`**, en vez de reemplazar el archivo por `home-about/styles.css` completo: aunque este último es superset del original portado en SPEC 01, `app/globals.css` ya diverge de ese original por la integración con Tailwind v4 (`@theme inline`) y `next/font` (`--font-pixel`, `--font-mono-av`); reemplazar el archivo arriesgaría perder esa integración. Se excluyen explícitamente los bloques GAMEPAD y ABOUT porque `home.jsx` no los usa.
- **No incluir "Acerca de" en el Nav ni en el alcance**: esa pantalla no se define en esta spec; añadir el link ahora generaría una ruta 404. Se deja para la spec que porte `about.jsx`.
- **Reapuntar enlaces existentes en vez de usar redirects**: al mover la Biblioteca a `/games`, se prefiere corregir cada referencia interna (Nav, detalle, login) antes que dejar un `redirect()` de `/` a `/games`, ya que `/` ahora tiene contenido propio (la landing) y no debe redirigir.

## Riesgos identificados

- `components/home.tsx` usa `IntersectionObserver` dentro de un hook (`useReveal`), lo que obliga a marcarlo como Client Component (`"use client"`); omitirlo rompe en build/runtime.
- Mover la portada de `/` a `/games` puede dejar enlaces rotos si se pasa por alto alguna referencia; el paso 2 del plan es el punto de mayor riesgo de regresión. Las typed routes de Next 16 (`LayoutProps`, `PageProps`) ayudan a detectar en tiempo de build referencias a rutas que ya no existen.
- `toLocaleString("es-ES")` en el ticker y el top de jugadores puede producir mismatch de hidratación si el locale del servidor difiere del cliente; si ocurre, resolver formateando los números con una función determinista en vez de `toLocaleString`.
- Los bloques CSS copiados desde el template podrían colisionar con utilidades de Tailwind v4 ya presentes en `app/globals.css`; revisar visualmente tras el paso 3.
