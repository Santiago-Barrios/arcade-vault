# 03 · Página About y envío de contacto (Resend)

**Estado:** Aprobado  
**Depende de:** SPEC 02
**Fecha:** 2026-09-13

**Objetivo:** Portar la pantalla "Acerca de" de `references/templates/home-about/about.jsx` a la ruta `/about`, conectando su formulario de contacto a un envío de correo real vía Resend.

## Alcance

**Dentro:**

- Nueva pantalla `/about`, portada desde `references/templates/home-about/about.jsx`, con sus 3 secciones:
  - Hero (`.about-hero`) con misión y `highlight-row` de 3 destacados (`HighlightIcon`).
  - Divider animado (`.about-divider`, `reveal`).
  - Contacto (`.about-contact`, `reveal`) con formulario (nombre, correo, mensaje).
- Endpoint real `app/api/contact/route.ts` que recibe el formulario y envía el correo con el paquete `resend`.
- Validación client-side igual al template (campos vacíos → `shake`) más validación server-side básica en el route handler.
- Cuatro estados de UI en el formulario: inicial, enviando, éxito (pantalla terminal del template), error (nuevo, no existe en el template).
- Link "Acerca de" en el `Nav` (desktop y panel móvil), apuntando a `/about` — pendiente desde SPEC 02.
- Animación `reveal` en el divider y la sección de contacto, mismo patrón `useReveal` que `components/home.tsx`.
- Bloque CSS `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` (líneas 1071–1150) portado a `app/globals.css`.
- Dependencia `resend` añadida a `package.json` y variables `CONTACT_EMAIL_TO` / `CONTACT_EMAIL_FROM` añadidas a `.env.local` (`RESEND_API_KEY` ya existe).

**Fuera de alcance (para specs futuras):**

- Persistencia server-side del mensaje de contacto (base de datos, `localStorage`, logs estructurados) — este spec solo envía el correo.
- Rate limiting o protección anti-spam (captcha, honeypot, límite por IP).
- Dominio propio verificado en Resend — se usa el dominio de pruebas `onboarding@resend.dev` como remitente.
- Correo de confirmación al usuario que llenó el formulario — solo se notifica al equipo (`CONTACT_EMAIL_TO`).
- Cambios a `home.tsx`, `library.tsx` u otras rutas más allá de agregar el link "Acerca de" al `Nav`.
- Bloque `GAMEPAD` del CSS del template — no usado por `about.jsx`.



## Modelo de datos

No se introduce persistencia. El único contrato nuevo es el payload que viaja del formulario al endpoint:

```ts
// ContactPayload — cuerpo del POST a /api/contact
interface ContactPayload {
  name: string;
  email: string;
  message: string;
}
```

Variables de entorno (`.env.local`, no versionadas):

- `RESEND_API_KEY` — ya configurada.
- `CONTACT_EMAIL_TO=santiago.developer.lab@gmail.com` — destinatario fijo de los mensajes de contacto.
- `CONTACT_EMAIL_FROM=onboarding@resend.dev` — remitente, dominio de pruebas de Resend.

El estado de UI (`sending`, `sent`, `error`) vive solo en `useState` local de `components/about.tsx`; no se comparte ni persiste entre sesiones.

## Plan de implementación

1. **Dependencia y variables de entorno.** `npm install resend`. Añadir a `.env.local` las claves `CONTACT_EMAIL_TO=santiago.developer.lab@gmail.com` y `CONTACT_EMAIL_FROM=onboarding@resend.dev` (junto a `RESEND_API_KEY`, ya presente). La app sigue funcionando igual, sin nada nuevo montado todavía.
2. **CSS de About.** Copiar a `app/globals.css` (al final, sin tocar lo existente) el bloque `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` (líneas 1071–1150), incluyendo `@keyframes pxblink` y la animación `shake`. No se copia `GAMEPAD`.
3. **Route handler de contacto.** Crear `app/api/contact/route.ts` (`POST`): valida que `name`, `email` y `message` no estén vacíos (400 si faltan), instancia `Resend` con `RESEND_API_KEY`, y llama a `resend.emails.send({ from: process.env.CONTACT_EMAIL_FROM, to: process.env.CONTACT_EMAIL_TO, subject: ..., text/html con los 3 campos })`. Responde `{ ok: true }` (200) o `{ ok: false, error }` (500) — nunca deja escapar una excepción sin capturar.
4. **Componente About.** Crear `components/about.tsx` (`"use client"`) portando `about.jsx`: `useReveal` local (mismo patrón que `components/home.tsx`, sin extraerlo a un hook compartido), `HighlightIcon`, y las 3 secciones. El `onSubmit` pasa de simular el envío a hacer `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })`; se agregan los estados `sending` (deshabilita el botón, muestra "ENVIANDO…") y `error` (mensaje inline tipo terminal, ver Criterios de aceptación) en vez de saltar directo a `sent`.
5. **Página** `/about`**.** Crear `app/about/page.tsx` que renderiza `<About />`.
6. **Link "Acerca de" en el Nav.** Añadirlo en `components/nav.tsx`, en la lista de desktop y en el panel móvil, apuntando a `/about`, activo cuando `pathname === "/about"`.
7. **Verificación y limpieza.** Ejecutar `npm run lint`. Probar manualmente: envío con campos vacíos (dispara `shake`, no llama a la API), envío completo exitoso (llega el correo a `santiago.developer.lab@gmail.com`), y un fallo simulado (p. ej. `RESEND_API_KEY` inválida temporalmente) para confirmar que el estado de error se muestra sin dejar la pantalla en blanco.

Cada paso deja la app funcional y navegable con `npm run dev`.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores; `/about` es accesible por URL directa.
- [ ] `/about` muestra las 3 secciones del template (hero con `highlight-row`, divider, contacto) con los textos del template.
- [ ] Enviar el formulario con algún campo vacío dispara el `shake` y no hace ninguna llamada a `/api/contact`.
- [ ] Enviar el formulario completo hace `POST` a `/api/contact`; si Resend responde OK, se muestra la pantalla terminal de éxito con el nombre ingresado.
- [ ] El correo enviado llega a `santiago.developer.lab@gmail.com` con el nombre, correo y mensaje ingresados en el formulario.
- [ ] Si `/api/contact` falla (red o error de Resend), el formulario se mantiene visible (no pasa a la pantalla de éxito) con un mensaje de error inline y permite reintentar sin recargar la página.
- [ ] Mientras la petición está en curso, el botón de envío muestra un estado "enviando" y queda deshabilitado hasta que la respuesta llega.
- [ ] El `Nav` muestra "Acerca de" resaltado en `/about`, tanto en desktop como en el panel móvil; ningún link del `Nav` apunta a una ruta inexistente.
- [ ] `app/globals.css` incluye las clases `.about-*`, `.highlight-*`, `.contact-*`, `.terminal-success`, `.term-*` — sin clases `.gp-*` (gamepad).
- [ ] `npm run lint` pasa sin errores nuevos introducidos por este trabajo.



## Decisiones tomadas y descartadas

- **Sí:** `onboarding@resend.dev` como remitente — decisión explícita del usuario; no hay dominio propio verificado en Resend todavía.
- **Sí:** destinatario fijo `santiago.developer.lab@gmail.com` vía `CONTACT_EMAIL_TO` — decisión explícita del usuario; no es configurable desde la UI.
- **Sí:** estado de error inline con reintento (en vez de dejar la excepción sin manejar) — decisión explícita del usuario; evita que un fallo de red deje el formulario roto sin feedback.
- **No:** persistencia del mensaje en base de datos o `localStorage` — coherente con el enfoque "MVP visual" de SPEC 01/02; el correo es el único registro.
- **No:** extraer `useReveal` a un hook compartido — se duplica igual que en `components/home.tsx`; evita introducir una carpeta `hooks/` no pedida por una sola línea de reuso.
- **No:** rate limiting o captcha anti-spam — no discutido con el usuario; se deja para una spec futura si el formulario recibe abuso real.



## Riesgos identificados


| Riesgo                                                                                                                                                                       | Mitigación                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onboarding@resend.dev` solo permite enviar al email verificado de la cuenta Resend; si `santiago.developer.lab@gmail.com` no es esa cuenta, el envío fallará en producción. | El estado de error del paso 4 hace visible el fallo en vez de fallar en silencio; verificar la cuenta Resend antes de dar por cerrado el paso 7. |
| `RESEND_API_KEY`, `CONTACT_EMAIL_TO` y `CONTACT_EMAIL_FROM` viven solo en `.env.local` (no versionado).                                                                      | Al desplegar (Vercel u otro) hay que configurar las 3 variables manualmente en el proveedor, o el envío fallará ahí aunque funcione en local.    |




## Qué **no** está en este spec

- Persistencia de mensajes de contacto en base de datos.
- Rate limiting o protección anti-spam (captcha, honeypot).
- Dominio propio verificado en Resend (se usa el dominio de pruebas por ahora).
- Correo de confirmación automático al usuario que envió el formulario.
- Cambios a otras páginas o rutas fuera de `Nav` y `About`.

Cada uno de estos, si se necesita, va en su propia spec.