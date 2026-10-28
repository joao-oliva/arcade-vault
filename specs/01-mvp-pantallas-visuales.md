# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-28
> **Objetivo:** Portar a Next.js App Router las cinco pantallas de `references/templates/` (Biblioteca, Detalle, Reproductor, Acceso y Salón de la Fama) con datos mock y sin implementar ningún juego real.

## Por qué existe esta spec

Las plantillas son un prototipo React cargado por CDN con Babel en el navegador y un router por hash.
Este MVP las convierte en rutas reales de Next 16 para tener una base navegable sobre la que las siguientes specs implementarán juegos, backend y autenticación.
`app/globals.css` ya contiene los estilos de `references/templates/styles.css` portados (fuentes vía `next/font` y tokens en `@theme inline`), así que esta spec no toca estilos salvo ajustes puntuales.

## Alcance

**Dentro:**

- Layout global con `Nav` (escritorio + panel móvil con hamburguesa) y footer, fieles a `nav.jsx` y `app.jsx`.
- Ruta `/` — Biblioteca: hero, buscador por nombre, chips de categoría, grilla de tarjetas con efecto tilt y estado "NO HAY RESULTADOS".
- Ruta `/juegos/[id]` — Detalle: portada, tags, descripción, franja de estadísticas, botones "JUGAR AHORA" y "VOLVER AL VAULT", leaderboard de 10 filas.
- Ruta `/juegos/[id]/jugar` — Reproductor simulado: HUD (jugador, puntuación, vidas, nivel), arena CRT decorativa animada, puntuación que sube sola, PAUSA/REANUDAR, FIN, SALIR y modal "FIN DEL JUEGO" con guardar puntuación, jugar de nuevo y volver.
- Ruta `/auth` — Acceso: pestañas INICIAR SESIÓN / CREAR CUENTA, campo de correo solo en "crear", botón invitado y botones sociales decorativos.
- Ruta `/salon` — Salón de la Fama: pestañas por juego vía `?juego=<id>`, podio top 3, tabla de 12 filas y fila "TU MEJOR MARCA" si hay usuario.
- Login mock: el usuario se guarda en `localStorage` (`av_user`); el Nav muestra su nombre y al pulsarlo cierra sesión.
- Guardado mock de puntuaciones en `localStorage` (`av_scores`).
- `notFound()` para ids de juego inexistentes y página `app/not-found.tsx` con estética arcade.
- Datos mock tipados en `lib/games.ts`.

**Fuera de alcance (para specs futuras):**

- Cualquier juego jugable real (canvas, input de teclado/táctil, lógica de colisiones).
- Autenticación real, validación de formularios, OAuth de Google/GitHub.
- Backend, base de datos o API de puntuaciones.
- Leer `av_scores` para alimentar leaderboards o la fila "TU MEJOR MARCA" (se mantienen los valores simulados de la plantilla).
- Contador de créditos funcional (se muestra fijo "CRÉDITOS · 03").
- Tests automatizados (no hay framework configurado).
- Migrar las clases CSS a utilidades Tailwind.

## Modelo de datos

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;          // slug usado en /juegos/[id] y ?juego=
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS de portada, p. ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;       // "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date "DD/MM/2026"

export const GAMES: Game[];                                  // los 8 juegos de data.jsx, mismos valores
export const CATS: readonly ["TODOS", ...GameCategory[]];
export function getGame(id: string): Game | undefined;
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinista, mismo algoritmo que data.jsx
```

```ts
// Persistencia mock en localStorage (mismas claves que la plantilla)
type StoredUser = { name: string };                          // clave "av_user", name en mayúsculas, máx. 10 chars
type StoredScore = { game: string; score: number; name: string; at: number }; // clave "av_scores", array
```

Convenciones:

- Semillas idénticas a la plantilla: Detalle usa `seededScores(id.length * 17 + 3, 10)`, Salón usa `seededScores(id.length * 23 + 7, 12)`.
- Números formateados con `toLocaleString("es-ES")`.

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/` las guías de rutas dinámicas (`params`/`searchParams` como Promise), `generateStaticParams`, `notFound`, `Link`/`usePathname` y el comportamiento de Cache Components con `searchParams` (requiere `<Suspense>`). Sin cambios de código.
2. Crear `lib/games.ts` con tipos, `GAMES`, `CATS`, `getGame` y `seededScores`. Verificar con `npm run build`.
3. Crear `components/user-provider.tsx` (Client Component): contexto con `user`, `login(name)`, `logout()` y `saveScore(entry)` sobre `localStorage`, leyendo tras el montaje para evitar desajustes de hidratación y envolviendo los accesos en try/catch.
4. Crear `components/nav.tsx` (cliente, `usePathname` + `Link`, panel móvil) y `components/footer.tsx`; montarlos en `app/layout.tsx` junto al provider dentro de `<main className="av-main">`. Verificar que el Nav marca "Biblioteca" activo en `/`, `/juegos/*` y "Salón de la Fama" en `/salon`.
5. Reemplazar `app/page.tsx` por la Biblioteca: hero en servidor y `components/library-browser.tsx` (cliente) con buscador, chips y grilla; `components/game-card.tsx` con tilt y navegación a `/juegos/[id]`.
6. Crear `app/juegos/[id]/page.tsx` (Detalle) con `generateStaticParams` sobre `GAMES`, `notFound()` si `getGame` devuelve `undefined`, y `components/leaderboard.tsx`.
7. Crear `app/not-found.tsx` con estética arcade y botón "VOLVER AL VAULT".
8. Crear `app/juegos/[id]/jugar/page.tsx` + `components/game-player.tsx` (cliente): HUD, arena CRT, intervalo de puntuación (220 ms), subida de nivel, pausa, modal de fin con guardado vía `saveScore` y estado "PUNTUACIÓN GUARDADA".
9. Crear `app/auth/page.tsx` + `components/auth-form.tsx` (cliente): pestañas, submit que llama `login` y navega a `/`, botón invitado que llama `logout` y navega a `/`.
10. Crear `app/salon/page.tsx`: lee `searchParams.juego` (por defecto el primer juego, ids inválidos caen al primero), pestañas como `Link` a `?juego=<id>`, podio y tabla; fila "TU MEJOR MARCA" en un pequeño componente cliente que consume el contexto de usuario.
11. Pasar `npm run lint` y `npm run build` sin errores ni warnings nuevos.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` muestra el hero "ARCADE VAULT" y 8 tarjetas de juego.
- [ ] Escribir "ser" en el buscador deja solo "SERPENTINA".
- [ ] Pulsar el chip "SHOOTER" deja solo "INVASORES" y "ROCAS".
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta navega a `/juegos/<id>` con título, descripción larga, estadísticas y 10 filas de leaderboard.
- [ ] `/juegos/no-existe` responde con la página 404 temática.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar` y la puntuación del HUD aumenta sola.
- [ ] "PAUSA" detiene la puntuación y muestra "EN PAUSA"; "REANUDAR" la reanuda.
- [ ] "FIN" abre el modal "FIN DEL JUEGO"; "GUARDAR PUNTUACIÓN" añade una entrada a `av_scores` en localStorage y muestra "PUNTUACIÓN GUARDADA".
- [ ] "JUGAR DE NUEVO" reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] En `/auth`, la pestaña "CREAR CUENTA" muestra el campo de correo y "INICIAR SESIÓN" lo oculta.
- [ ] Enviar el formulario con usuario "px_kai" redirige a `/` y el Nav muestra "PX_KAI ▾".
- [ ] Recargar la página mantiene el usuario en el Nav.
- [ ] Pulsar el nombre en el Nav cierra sesión y vuelve a mostrar "Iniciar Sesión".
- [ ] `/salon` muestra el podio y 12 filas de BLOQUE BUSTER; `/salon?juego=caida` muestra los de CAÍDA con su pestaña activa.
- [ ] Con usuario logueado, `/salon` muestra la fila "TU MEJOR MARCA EN <JUEGO>"; sin usuario no aparece.
- [ ] A menos de 840 px de ancho el Nav muestra la hamburguesa y abre el panel lateral.
- [ ] No aparecen errores de hidratación en la consola del navegador en ninguna ruta.

## Decisiones

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). URLs compartibles y Server Components donde no hay interactividad.
- **No:** SPA de una sola página con router por hash como la plantilla. Va contra el modelo del App Router.
- **Sí:** reutilizar las clases ya portadas en `app/globals.css`. Máxima fidelidad visual con el menor trabajo.
- **No:** reescribir los estilos en utilidades Tailwind. Más trabajo y riesgo de divergencia visual; queda para otra spec si se quiere.
- **Sí:** login y puntuaciones mock en localStorage con las claves `av_user` y `av_scores`. Da un flujo creíble sin backend.
- **No:** pantallas solo visuales sin estado. El Nav y el Reproductor perderían su comportamiento principal.
- **Sí:** Reproductor con la simulación de la plantilla (puntuación automática, pausa, modal). Permite validar el flujo completo sin juego real.
- **No:** placeholder estático "PRÓXIMAMENTE". Dejaría sin probar el modal de fin y el guardado.
- **Sí:** juego activo del Salón en `?juego=<id>`. Compartible y renderizable en servidor.
- **No:** estado local para las pestañas del Salón. La URL no reflejaría la selección.
- **Sí:** datos mock tipados en `lib/games.ts` y componentes en `components/`. Punto único para sustituir por datos reales más adelante.
- **Sí:** `notFound()` + `app/not-found.tsx` temático para ids inexistentes.
- **No:** redirigir a `/` en ids inválidos. Oculta el error al usuario.
- **Sí:** el nombre del producto es "Arcade Vault" (no "Arcade Bot"). Coincide con plantillas, repo y layout.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Desajuste de hidratación al leer `localStorage` durante el render | El provider lee `av_user` en un efecto tras el montaje; el primer render siempre es "sin usuario". |
| Cache Components exige `<Suspense>` al acceder a `searchParams` en `/salon` | Revisar la doc en el paso 1 y envolver la parte dinámica en `<Suspense>`. |
| APIs de Next 16 distintas a las conocidas (`params` como Promise, etc.) | Paso 1 obligatorio de lectura de `node_modules/next/dist/docs/`. |
| localStorage deshabilitado (modo privado) | Accesos envueltos en try/catch; la UI funciona sin persistir. |

## Lo que **no** está en esta spec

- Juegos jugables reales.
- Autenticación real, OAuth y validación de formularios.
- Backend o API de puntuaciones, y leaderboards alimentados por `av_scores`.
- Contador de créditos funcional.
- Tests automatizados.
- Migración de estilos a Tailwind.

Cada uno, si llega, va en su propia spec.
