# 04 · Integración de Supabase

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-09-15

**Objetivo:** Conectar el proyecto Next.js al proyecto de Supabase ya existente (`owszpgqbpsxelstqvzmx`), dejando clientes de browser/servidor listos y una ruta de verificación, sin implementar autenticación ni persistencia de datos todavía.

## Alcance

**Dentro:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr` como dependencias del proyecto.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` (no versionado) y su plantilla en `.env.template`, con los valores del proyecto `owszpgqbpsxelstqvzmx` ya existente (obtenidos vía MCP de Supabase: URL `https://owszpgqbpsxelstqvzmx.supabase.co` y la clave `anon`/`publishable` del proyecto).
- Cliente de navegador `lib/supabase/client.ts`, siguiendo el patrón oficial de `@supabase/ssr` (`createBrowserClient`).
- Cliente de servidor `lib/supabase/server.ts`, siguiendo el patrón oficial de `@supabase/ssr` (`createServerClient` sobre `next/headers`), para usar en Server Components y Route Handlers.
- `middleware.ts` en la raíz del proyecto para refrescar el token de sesión de Supabase en cada request, siguiendo el patrón oficial de `@supabase/ssr` para Next.js App Router (parte del setup estándar recomendado por Supabase, aunque todavía no hay ningún flujo de auth que lo dispare).
- Ruta de verificación `app/api/health/supabase/route.ts` (`GET`): usa el cliente de servidor para hacer una llamada mínima (p. ej. `auth.getSession()` o una consulta trivial) y responde `{ ok: true }` (200) si Supabase responde, o `{ ok: false, error }` (500) si falla — sin dejar escapar una excepción sin capturar.
- Verificar (antes de dar el spec por cerrado en la implementación) que no existan tablas ni políticas RLS pendientes de considerar: el proyecto está confirmado vacío (schema `public` sin tablas) al momento de escribir este spec.

**Fuera de alcance (para specs futuras):**

- Autenticación real (login/registro con Supabase Auth, sesión de usuario, reemplazo de `lib/storage.ts` / `av_user`). Se define en un spec posterior.
- Cualquier tabla, esquema o migración de base de datos (juegos, puntuaciones, usuarios). Se define en specs posteriores según se necesiten.
- Persistencia de puntuaciones o leaderboard real (reemplazo de `av_scores` y de `seededScores` en `/salon`). Fuera de esta spec.
- Row Level Security, roles o políticas de acceso — no hay tablas todavía, no aplica.
- Supabase Storage, Edge Functions o Realtime — no solicitados.
- Cualquier cambio a `components/nav.tsx`, `/login`, `/salon` u otras pantallas existentes.



## Modelo de datos

No se introduce ninguna tabla ni estructura de datos persistente — el proyecto de Supabase no tiene tablas (`public` vacío) y esta spec no las crea.

Variables de entorno (`.env.local`, no versionadas; plantilla en `.env.template`):

- `NEXT_PUBLIC_SUPABASE_URL=https://owszpgqbpsxelstqvzmx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave anon/publishable del proyecto, obtenida desde el dashboard de Supabase o vía MCP>`

Contrato de la ruta de verificación:

```ts
// GET /api/health/supabase
// Respuesta 200: { ok: true }
// Respuesta 500: { ok: false, error: string }
```



## Plan de implementación

1. **Dependencias.** `npm install @supabase/supabase-js @supabase/ssr`. La app sigue funcionando igual, sin nada nuevo montado todavía.
2. **Variables de entorno.** Añadir a `.env.local` (creándolo si no existe) `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los valores del proyecto `owszpgqbpsxelstqvzmx`. Añadir ambas claves (con placeholders, sin el valor real) a `.env.template`, junto a `RESEND_API_KEY` ya existente.
3. **Cliente de navegador.** Crear `lib/supabase/client.ts` exportando una función `createClient()` que llama a `createBrowserClient` de `@supabase/ssr` con las dos variables `NEXT_PUBLIC_`*.
4. **Cliente de servidor.** Crear `lib/supabase/server.ts` exportando una función `createClient()` (async, dado que Next 16 requiere `await cookies()`) que llama a `createServerClient` de `@supabase/ssr`, leyendo/escribiendo cookies vía `next/headers`.
5. **Middleware de sesión.** Crear `middleware.ts` en la raíz portando el patrón oficial de Supabase (`updateSession` sobre el cliente de servidor), con `matcher` excluyendo assets estáticos. No añade ninguna lógica de redirección ni de protección de rutas — solo refresca el token si existe.
6. **Ruta de verificación.** Crear `app/api/health/supabase/route.ts` (`GET`): instancia el cliente de servidor, hace una llamada mínima (`auth.getSession()`), captura cualquier excepción, y responde `{ ok: true }` o `{ ok: false, error }` según corresponda.
7. **Verificación y limpieza.** Ejecutar `npm run lint` y `npm run dev`; visitar `/api/health/supabase` y confirmar `{ ok: true }`. Consultar `node_modules/next/dist/docs/` si algo del patrón de `@supabase/ssr` (cookies async, middleware) choca con las breaking changes de Next 16.

Cada paso deja la app funcional y navegable con `npm run dev`.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores.
- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen como dependencias en `package.json`.
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `.env.template` documenta ambas claves sin exponer el valor real.
- [ ] `lib/supabase/client.ts` exporta un `createClient()` que instancia un cliente de navegador válido.
- [ ] `lib/supabase/server.ts` exporta un `createClient()` que instancia un cliente de servidor válido, compatible con Server Components y Route Handlers de Next 16.
- [ ] `middleware.ts` existe en la raíz y refresca la sesión de Supabase en cada request, sin romper ninguna ruta existente (`/`, `/games`, `/juego/[id]`, `/login`, `/salon`, `/about`).
- [ ] `GET /api/health/supabase` responde `{ ok: true }` con status 200 cuando Supabase está accesible.
- [ ] Si las variables de entorno faltan o son inválidas, `GET /api/health/supabase` responde `{ ok: false, error }` con status 500, sin tumbar el servidor.
- [ ] No se crea ninguna tabla, política RLS, ni lógica de autenticación/persistencia — el proyecto de Supabase sigue con el schema `public` vacío tras esta spec.
- [ ] `npm run lint` pasa sin errores nuevos introducidos por este trabajo.



## Decisiones tomadas y discardas

- **Sí:** dividir en specs — esta cubre solo la integración técnica (clientes + verificación); auth real y persistencia de puntuaciones/leaderboard quedan para specs futuras — decisión explícita del usuario.
- **Sí:** usar el proyecto Supabase ya existente (`owszpgqbpsxelstqvzmx`, referenciado en `.mcp.json`) en vez de crear uno nuevo — decisión explícita del usuario; confirmado vacío (sin tablas) antes de escribir la spec.
- **Sí:** `@supabase/supabase-js` + `@supabase/ssr` (en vez de solo `@supabase/supabase-js`) — decisión explícita del usuario; sienta la base de cookies/sesión que el futuro spec de auth va a necesitar, siguiendo el patrón oficial de Next.js App Router.
- **Sí:** clientes separados `lib/supabase/client.ts` / `lib/supabase/server.ts` (en vez de un solo archivo) — decisión explícita del usuario; es el patrón oficial recomendado por Supabase para distinguir contexto browser/servidor.
- **Sí:** ruta `app/api/health/supabase` como criterio de verificación — decisión explícita del usuario; deja un artefacto persistente en el repo para confirmar la integración, en vez de una verificación manual que no queda documentada.
- **Sí:** incluir `middleware.ts` de refresco de sesión ya en esta spec, aunque todavía no hay flujos de auth que lo usen — es parte del setup estándar de `@supabase/ssr` para Next.js App Router documentado por Supabase; no introduce lógica de negocio, solo la plomería que el spec de auth reutilizará.
- **No:** método de autenticación (email/password, OAuth, magic link) — el usuario indicó explícitamente que auth queda fuera de esta spec; se decide en el spec correspondiente.
- **No:** username vs. email como identificador de login — mismo motivo, fuera de esta spec.
- **No:** cualquier tabla o esquema de base de datos — no hay entidades que persistir todavía; se definen en specs futuras según necesidad real (puntuaciones, perfiles, etc.).



## Riesgos identificados

- Next 16 puede tener breaking changes en el manejo de cookies (`cookies()` async) que afecten el patrón oficial de `@supabase/ssr` para Server Components; el paso 7 exige consultar `node_modules/next/dist/docs/` antes de dar el patrón por válido sin probarlo.
- El `matcher` de `middleware.ts` mal configurado puede interceptar rutas estáticas o assets y degradar rendimiento; usar el patrón de exclusión recomendado por Supabase (excluir `_next/static`, `_next/image`, favicon, etc.).
- Si `NEXT_PUBLIC_SUPABASE_ANON_KEY` se copia mal o expira, `/api/health/supabase` fallará; el criterio de aceptación de la respuesta `{ ok: false }` existe justamente para hacer ese fallo visible en vez de silencioso.

