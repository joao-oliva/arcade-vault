# SPEC 03 — Página "Acerca de" y formulario de contacto con Resend

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-02
> **Objetivo:** Portar a `/acerca` la página de `references/templates/home-about/about.jsx` y hacer que su formulario de contacto envíe un correo real al equipo mediante Resend.

## Por qué existe esta spec

La SPEC 02 dejó "Acerca de" visible en el Nav pero deshabilitado, con el badge "PRONTO".
La plantilla `home-about` incluye esa página: una sección de misión con tres highlights, un divisor de píxeles y un formulario de contacto.
En la plantilla el formulario solo simula el envío. Aquí se conecta a Resend para que el mensaje llegue de verdad al buzón del equipo, y se añaden los estados que la plantilla no contempla (enviando y error).

## Alcance

**Dentro:**

- Ruta `/acerca`, idéntica visualmente a `about.jsx`:
  1. Hero: kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT", párrafo de misión y tres highlights con icono pixel SVG (HEART magenta, BROWSER cyan, PLANT green) y sus textos.
  2. Divisor `about-divider` con dos barras y 24 píxeles parpadeantes (`animationDelay` de `i * 80` ms).
  3. Sección de contacto: kicker "▸ CONTACTO", título "CONTÁCTANOS", subtítulo, tres tips con LED y el formulario NOMBRE · CORREO ELECTRÓNICO · MENSAJE con el botón "▶  ENVIAR MENSAJE".
- Animación reveal en el divisor y en la sección de contacto, reutilizando `components/home/reveal-on-scroll.tsx` (respeta `prefers-reduced-motion` y deja todo visible sin JavaScript).
- Envío real del formulario: el cliente hace `fetch` a `POST /api/contact` (Route Handler) y este llama a Resend en el servidor:
  - Un único correo al buzón del equipo (`CONTACT_TO_EMAIL`), con `replyTo` igual al correo del usuario.
  - Asunto `[Arcade Vault] Mensaje de <nombre>`, cuerpo en texto plano y HTML mínimo con nombre, correo y mensaje (todo escapado en el HTML).
- Validación:
  - Cliente: si algún campo está vacío tras `trim`, animación `shake` y no se envía (como la plantilla).
  - Servidor: `trim` de todos los campos; nombre de 1 a 80 caracteres; correo válido por regex simple y como máximo 254 caracteres; mensaje de 10 a 2000 caracteres.
- Honeypot: campo oculto `website`. Si llega relleno, la API responde éxito sin llamar a Resend.
- Estados del formulario:
  - **Enviando:** botón deshabilitado con el texto "▶  TRANSMITIENDO…".
  - **Éxito:** la terminal verde de la plantilla ("MENSAJE RECIBIDO… GRACIAS, <NOMBRE>.") con el botón "ENVIAR OTRO MENSAJE", que vacía el formulario.
  - **Error:** la misma terminal en variante roja, con líneas `[OK]` y una línea final `[ERROR] <mensaje>` y el botón "REINTENTAR", que vuelve al formulario con los datos intactos.
- Variables de entorno en `.env.local` (ya creado con las claves vacías e ignorado por `.gitignore`): `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` (por defecto `Arcade Vault <onboarding@resend.dev>`). El usuario rellena los valores. Se añade `.env.example` con las tres claves vacías y la excepción `!.env.example` en `.gitignore`, porque hoy la regla `.env*` también lo ignora.
- Nav (escritorio y panel móvil): "Acerca de" pasa a ser un `Link` a `/acerca` con estado activo en `/acerca`. Se eliminan `AboutSoon` y los estilos `.nav-disabled` y `.soon-badge`.
- Portar a `app/globals.css` el bloque `ABOUT PAGE` de `references/templates/home-about/styles.css`, más la variante de error de la terminal y la regla de `prefers-reduced-motion` para los píxeles del divisor.
- Añadir la dependencia `resend`.

**Fuera de alcance (para specs futuras):**

- Correo de acuse de recibo al usuario (exige dominio verificado en Resend).
- Plantillas con React Email o diseño arcade en el correo.
- Rate limiting, CAPTCHA o cualquier anti-spam más allá del honeypot.
- Guardar los mensajes en base de datos o un panel para leerlos.
- Verificar un dominio propio en Resend (es configuración de la cuenta, no código).
- Rellenar automáticamente nombre o correo con el usuario mock de `av_user`.
- Tests automatizados.

## Modelo de datos

```ts
// lib/contact.ts — validación compartida (sin "use server"; importable desde cliente y servidor)
export type ContactInput = { name: string; email: string; message: string };

export type ContactField = keyof ContactInput;

export const CONTACT_LIMITS = {
  nameMax: 80,
  emailMax: 254,
  messageMin: 10,
  messageMax: 2000,
} as const;

// Devuelve los datos normalizados (trim) o el primer error legible en español.
export function validateContact(raw: ContactInput):
  | { ok: true; data: ContactInput }
  | { ok: false; error: string };
```

```ts
// app/api/contact/route.ts — Route Handler, solo servidor
// Petición:  POST /api/contact   Content-Type: application/json
type ContactRequest = ContactInput & { website?: string }; // website = honeypot

// Respuesta (JSON en todos los casos)
export type ContactResponse = { ok: true } | { ok: false; error: string };

export async function POST(request: Request): Promise<Response>;
```

```ts
// components/about/contact-form.tsx — estado local del cliente
type FormStatus =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; name: string }
  | { status: "error"; error: string };
// Los valores del formulario viven en un useState aparte, así "REINTENTAR" los conserva.
```

Respuestas de la API:

| Causa | HTTP | `error` |
| --- | --- | --- |
| Envío correcto u honeypot relleno | 200 | — (`{ ok: true }`) |
| Cuerpo que no es JSON o no tiene la forma esperada | 400 | "SOLICITUD INVÁLIDA" |
| Validación del servidor | 400 | El de `validateContact` (p. ej. "EL MENSAJE DEBE TENER AL MENOS 10 CARACTERES") |
| Falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL` | 500 | "SERVICIO DE CORREO NO CONFIGURADO" (y `console.error` en servidor) |
| Resend devuelve `error` o lanza excepción | 502 | "NO SE PUDO TRANSMITIR EL MENSAJE. INTÉNTALO DE NUEVO." (y `console.error` en servidor) |

Si el `fetch` falla por red o la respuesta no es JSON, el cliente muestra "NO SE PUDO CONECTAR CON EL SERVIDOR".

Convenciones:

- Los textos de error van en mayúsculas, como el resto de la terminal.
- La API key y los detalles del error de Resend nunca llegan al cliente.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/` lo relativo a Route Handlers (`route.ts`, métodos HTTP, comportamiento con Cache Components) y a variables de entorno. Sin cambios de código.
2. Instalar `resend`. Crear `.env.example` con `RESEND_API_KEY=`, `CONTACT_TO_EMAIL=` y `CONTACT_FROM_EMAIL=`, y añadir `!.env.example` a `.gitignore`. Comprobar con `git check-ignore` que `.env.local` sigue ignorado y `.env.example` no.
3. Portar a `app/globals.css` el bloque `ABOUT PAGE`. Añadir la variante roja de `.terminal-success` (p. ej. `.terminal-success.error`), la regla de `prefers-reduced-motion` para `.div-pixels span` y el estilo del botón deshabilitado si no existe. Eliminar `.nav-disabled` y `.soon-badge`.
4. Crear `components/about/highlight-icon.tsx` (Server Component) con los tres iconos SVG de la plantilla.
5. Crear `app/acerca/page.tsx` (Server Component) con el hero, los highlights, el divisor y la columna de introducción del contacto, más `<RevealOnScroll />`. En el hueco del formulario va un placeholder. Verificar que `/acerca` se ve igual que la plantilla.
6. Crear `lib/contact.ts` con `validateContact` y `CONTACT_LIMITS`.
7. Crear `app/api/contact/route.ts` con `POST`: parsear el JSON, honeypot, `validateContact`, lectura de las variables de entorno dentro del handler, llamada a `resend.emails.send` con `replyTo`, `subject`, `text` y `html` escapado, y respuestas según la tabla del modelo de datos. Probarlo con `curl` antes de tener el formulario.
8. Crear `components/about/contact-form.tsx` (cliente): inputs controlados, shake si hay vacíos, honeypot oculto (`aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`), `fetch("/api/contact", { method: "POST", … })` y las vistas formulario, enviando, éxito y error según `FormStatus`. Sustituir el placeholder del paso 5.
9. Actualizar `components/nav.tsx`: añadir la sección `"acerca"` en `sectionOf`, poner `Link` a `/acerca` en escritorio y móvil y eliminar `AboutSoon`.
10. Probar a mano con la API key que el usuario coloque en `.env.local`: envío correcto, error de validación del servidor (`curl` con mensaje corto), API key ausente, cuerpo inválido y honeypot relleno. Si la key aún no está, probar todo salvo el envío correcto y dejarlo anotado.
11. Pasar `npm run lint` y `npm run build` sin errores ni warnings nuevos.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/acerca` muestra el título "ACERCA DE ARCADE VAULT", el párrafo de misión y tres highlights con icono: "HECHO CON ❤️ PARA JUGADORES", "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR" y "PROYECTO EN CONSTANTE CRECIMIENTO".
- [ ] El divisor muestra 24 píxeles parpadeando y la sección "CONTÁCTANOS" muestra los tres tips y el formulario de tres campos.
- [ ] En el Nav y en el panel móvil, "Acerca de" navega a `/acerca`, aparece activo en esa ruta y ya no muestra el badge "PRONTO".
- [ ] Ninguna referencia a `nav-disabled`, `soon-badge` ni `AboutSoon` queda en `app/` ni en `components/`.
- [ ] Enviar con algún campo vacío produce la animación shake y no hace ninguna petición al servidor.
- [ ] Mientras se envía, el botón está deshabilitado y muestra "▶  TRANSMITIENDO…".
- [ ] Con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` válidos, un envío correcto muestra la terminal verde con "GRACIAS, <NOMBRE EN MAYÚSCULAS>." y el correo llega a `CONTACT_TO_EMAIL` con asunto `[Arcade Vault] Mensaje de <nombre>`.
- [ ] Al pulsar "Responder" en ese correo, el destinatario es el correo que escribió el usuario.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los tres campos vacíos.
- [ ] Un mensaje de menos de 10 caracteres en el formulario muestra la terminal roja con "[ERROR] EL MENSAJE DEBE TENER AL MENOS 10 CARACTERES" y no se envía ningún correo.
- [ ] `curl -X POST /api/contact` con un mensaje de menos de 10 caracteres responde 400 con `{ "ok": false, "error": "EL MENSAJE DEBE TENER AL MENOS 10 CARACTERES" }`.
- [ ] `curl -X POST /api/contact` con un cuerpo que no es JSON responde 400 con "SOLICITUD INVÁLIDA".
- [ ] `GET /api/contact` no envía nada y responde 405.
- [ ] Sin `RESEND_API_KEY`, enviar responde 500 y muestra la terminal roja con "SERVICIO DE CORREO NO CONFIGURADO". La página no lanza excepción.
- [ ] "REINTENTAR" vuelve al formulario con el nombre, el correo y el mensaje que había antes.
- [ ] Con el campo `website` relleno, la API responde 200 y Resend no recibe ninguna llamada.
- [ ] El campo honeypot no es visible ni alcanzable con Tab.
- [ ] `RESEND_API_KEY` no aparece en ningún bundle de cliente (buscarla en `.next/static` tras el build).
- [ ] El divisor y la sección de contacto aparecen con la animación reveal al hacer scroll. Con `prefers-reduced-motion: reduce` se ven sin animación y los píxeles no parpadean.
- [ ] Con JavaScript deshabilitado, todo el contenido de `/acerca` es visible.
- [ ] A 375 px de ancho `/acerca` no produce scroll horizontal y el formulario ocupa una sola columna.
- [ ] No aparecen errores de hidratación en la consola en `/acerca`.
- [ ] `.env.example` existe con las tres claves y git lo rastrea. `.env.local` sigue ignorado.

## Decisiones

- **Sí:** ruta `/acerca`. Corta y en español, coherente con `/biblioteca` y `/salon`.
- **No:** `/acerca-de` ni `/about`. La primera es más larga sin aportar nada; la segunda rompe la convención en español.
- **Sí:** Route Handler `POST /api/contact` llamado con `fetch` desde el cliente, que a su vez llama a Resend. Decisión del usuario: separa la API del formulario y se puede probar con `curl`. La API key no sale del servidor.
- **No:** Server Action con `useActionState`. Era la recomendación inicial, descartada por elección del usuario.
- **Sí:** el formulario necesita JavaScript para enviar. El contenido de la página sigue visible sin JavaScript.
- **Sí:** un único correo al equipo con `replyTo` del usuario. Funciona con `onboarding@resend.dev` sin verificar dominio.
- **No:** acuse de recibo al usuario. Requiere dominio verificado en Resend; queda para otra spec.
- **Sí:** destinatario y remitente configurables por variables de entorno, con `.env.example` documentado. Permite cambiar buzón o dominio sin tocar código.
- **Sí:** terminal en variante de error con "REINTENTAR" que conserva los datos. Mantiene la estética de la plantilla y no hace perder lo escrito.
- **No:** mensaje inline o solo shake para los errores del servidor. Rompen la estética o no informan.
- **Sí:** validación manual en `lib/contact.ts`, compartida por cliente y servidor. Sin dependencias nuevas; el cliente mantiene el shake de la plantilla y el servidor es la fuente de verdad.
- **No:** Zod. Una dependencia más para cuatro reglas.
- **Sí:** honeypot como única medida anti-spam, devolviendo éxito falso. Cero dependencias y no da pistas al bot.
- **No:** rate limit en memoria. No es fiable en un despliegue serverless.
- **Sí:** correo en texto plano más HTML mínimo escapado. Suficiente para un buzón interno y sin riesgo de inyección HTML.
- **No:** React Email. Más dependencias y trabajo para un correo que solo lee el equipo.
- **Sí:** habilitar "Acerca de" en el Nav y borrar `AboutSoon`, `.nav-disabled` y `.soon-badge`. No queda código muerto.
- **Sí:** la página es un Server Component y solo `contact-form.tsx` y `reveal-on-scroll.tsx` son cliente. Minimiza el JavaScript enviado.
- **Sí:** reutilizar `RevealOnScroll` de la SPEC 02 en lugar del `useEffect` de la plantilla. Ya cubre `prefers-reduced-motion` y el caso sin JavaScript.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Con `onboarding@resend.dev`, Resend solo entrega al correo dueño de la cuenta | Documentarlo en `.env.example`. `CONTACT_TO_EMAIL` debe ser ese correo hasta verificar un dominio. |
| La API key se filtra al cliente | Solo se lee dentro de `app/api/contact/route.ts` y nunca con prefijo `NEXT_PUBLIC_`. El criterio de aceptación busca la clave en `.next/static`. |
| Inyección de HTML en el cuerpo del correo | Escapar `&`, `<`, `>`, `"` y `'` en nombre, correo y mensaje antes de construir el HTML. |
| El endpoint público puede llamarse directamente, sin pasar por el formulario | El servidor valida todo y aplica el honeypot. Por encima de eso, el riesgo se acepta (ver la fila de spam). |
| Leer `process.env` en un Route Handler con Cache Components da comportamientos inesperados | Revisar la doc en el paso 1. Las variables se leen dentro del handler, no a nivel de módulo. |
| La API key todavía no está en `.env.local` al implementar | La API responde "SERVICIO DE CORREO NO CONFIGURADO" sin romper la página. El envío real se verifica cuando el usuario pegue la key. |
| Spam masivo por bots que ignoran el honeypot | Aceptado en esta spec. Si ocurre, una spec futura añade rate limiting o CAPTCHA. |
| Al borrar `.nav-disabled` y `.soon-badge` se rompe algo que los reutilice | Buscar ambos selectores en `app/` y `components/` antes de eliminarlos. |

## Lo que **no** está en esta spec

- Acuse de recibo al usuario y verificación de dominio en Resend.
- Correos con React Email.
- Rate limiting o CAPTCHA.
- Persistencia de los mensajes y panel para leerlos.
- Autorrelleno del formulario con el usuario mock.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
