# SPEC 02 — Página Home (landing) de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-29
> **Objetivo:** Portar a `/` la landing de `references/templates/home-about/home.jsx` y mover la Biblioteca a `/biblioteca`, sin construir la página "Acerca de".

## Por qué existe esta spec

En la SPEC 01 la Biblioteca ocupaba `/` porque no había una portada.
La plantilla `home-about` añade una landing de marketing (hero, ventajas, juegos, estadísticas, actividad, precios y CTA final) que pasa a ser la portada.
Por eso la Biblioteca se muda y hay que actualizar todos los enlaces que asumían que `/` era el catálogo.

## Alcance

**Dentro:**

- Ruta `/` — Home con las siete secciones de `home.jsx`, en este orden:
  1. Hero con siluetas pixel flotantes (s1–s8), eyebrow "▸ INSERTA UNA MONEDA_", título de tres líneas, subtítulo, CTAs "▶ EXPLORAR JUEGOS" y "✦ CREAR CUENTA", e indicador "DESLIZA ▼".
  2. "// 01 ¿POR QUÉ ARCADE VAULT?": cuatro tarjetas de ventajas con iconos pixel en SVG.
  3. "// 02 JUEGOS DISPONIBLES AHORA": carrusel con los 6 primeros juegos de `GAMES` y el botón "VER TODOS LOS JUEGOS →".
  4. Franja de estadísticas: `GAMES.length` JUEGOS · MILES DE PARTIDAS · GLOBAL RANKING.
  5. "// 03 ACTIVIDAD EN VIVO": ticker "ÚLTIMAS PUNTUACIONES" con 7 filas y "TOP JUGADORES · HOY" con 5 filas y el enlace "VER SALÓN →".
  6. "// 04 PRECIOS": tarjeta "JUGADOR VAULT" de $0 con el sello "FREE PLAY" y tres preguntas frecuentes.
  7. CTA final "¿LISTO PARA JUGAR?" con "INSERTAR MONEDA →".
- Animación reveal al hacer scroll (IntersectionObserver), que respeta `prefers-reduced-motion` y deja todo visible sin JavaScript.
- Mover la Biblioteca actual (hero + `LibraryBrowser`) de `app/page.tsx` a `app/biblioteca/page.tsx`, sin cambios funcionales.
- Nav (escritorio y panel móvil) con los enlaces Inicio · Biblioteca · Salón de la Fama · Acerca de. "Acerca de" aparece deshabilitado: atenuado, con el badge "PRONTO", `cursor: not-allowed` y sin navegar.
- Estado activo del Nav: "Inicio" solo en `/` exacto, "Biblioteca" en `/biblioteca` y `/juegos/*`, y "Salón de la Fama" en `/salon`. El logo lleva a `/`.
- `/auth?modo=crear` abre directamente la pestaña "CREAR CUENTA". Los CTAs "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" apuntan ahí.
- Redirigir a `/biblioteca` todos los enlaces "volver al catálogo": Detalle, Reproductor, 404 y Salón. También el redirect tras iniciar sesión o pulsar "JUGAR COMO INVITADO".
- Portar a `app/globals.css` los bloques `HOME PAGE` (sin `ABOUT PAGE`), `ACTIVITY` y `PRICING` de `references/templates/home-about/styles.css`. Se añaden también los estilos del enlace deshabilitado y del badge "PRONTO".

**Fuera de alcance (para specs futuras):**

- La página "Acerca de" (`about.jsx`) y sus estilos `ABOUT PAGE`.
- Los estilos `GAMEPAD` y `Theme variants` del nuevo `styles.css`.
- Datos reales o de `av_scores` en "Actividad en vivo" (siguen siendo mock estático).
- Animación en tiempo real del ticker (filas nuevas que entran solas).
- Contador de créditos funcional.
- Tests automatizados.

## Modelo de datos

```ts
// lib/home.ts — contenido estático de la Home (mismos textos y valores que home.jsx)
import type { GameColor } from "@/lib/games";

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export type Feature = { icon: FeatureIconKind; title: string; desc: string; color: GameColor };
export type RecentScore = { player: string; game: string; score: number; ago: string; color: GameColor };
export type TopPlayer = { rank: number; player: string; score: number };
export type Faq = { q: string; a: string };

export const FEATURES: Feature[];          // 4 entradas
export const RECENT_SCORES: RecentScore[]; // 7 entradas ("hace 2 min", …)
export const TOP_PLAYERS: TopPlayer[];     // 5 entradas
export const FAQS: Faq[];                  // 3 entradas
```

```ts
// components/auth-form.tsx — nueva prop
type Tab = "in" | "up";
export function AuthForm({ initialTab }: { initialTab?: Tab }); // "up" cuando ?modo=crear
```

Convenciones:

- Las cifras se formatean con `toLocaleString("es-ES")`, igual que en la SPEC 01.
- La barra de `TOP_PLAYERS` mide `100 - índice * 16` %, como en la plantilla.
- La estadística de juegos muestra `GAMES.length` (hoy 8), no el literal "12+".

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/` lo relativo a `searchParams` en páginas con Cache Components (requisito de `<Suspense>`) y a `Link`. Sin cambios de código.
2. Mover la Biblioteca: crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx`. `app/page.tsx` queda como placeholder mínimo. Actualizar `sectionOf` y los enlaces de `components/nav.tsx` (añadir "Inicio" y el "Acerca de" deshabilitado con el badge "PRONTO"). Verificar que `/biblioteca` funciona y que el Nav marca bien cada sección.
3. Redirigir a `/biblioteca` los enlaces de `app/juegos/[id]/page.tsx`, `components/game-player.tsx`, `app/not-found.tsx` y `app/salon/page.tsx`. También los dos `router.push` de `components/auth-form.tsx`.
4. Añadir `initialTab` a `AuthForm`. `app/auth/page.tsx` lee `searchParams.modo` dentro de `<Suspense>` y pasa `"up"` si vale `"crear"`.
5. Portar a `app/globals.css` los bloques CSS `HOME PAGE` (sin `ABOUT`), `ACTIVITY` y `PRICING`. Añadir las reglas de `prefers-reduced-motion` (las siluetas no se animan y `.reveal` es visible sin transición) y la regla que solo oculta `.reveal` cuando el root tiene la clase que pone el observer.
6. Crear `lib/home.ts` con tipos y datos. Crear `components/home/floating-silhouettes.tsx`, `components/home/feature-icon.tsx` y `components/home/mini-card.tsx` (un `Link` a `/juegos/[id]`), todos Server Components.
7. Crear `components/home/reveal-on-scroll.tsx` (cliente). Marca el root como listo para animar y observa los `.reveal` con umbral 0,12, añadiendo `.in` al entrar en pantalla.
8. Reemplazar `app/page.tsx` por la Home (Server Component) con las siete secciones, usando los datos de `lib/home.ts` y `GAMES`. Los CTAs son `Link` a `/biblioteca`, `/auth?modo=crear` y `/salon`.
9. Pasar `npm run lint` y `npm run build` sin errores ni warnings nuevos.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` muestra el hero "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA" y las secciones // 01 a // 04 más el CTA final.
- [ ] La sección "¿POR QUÉ ARCADE VAULT?" muestra 4 tarjetas con icono, título y descripción.
- [ ] "JUEGOS DISPONIBLES AHORA" muestra exactamente 6 tarjetas, y al pulsar una se navega a `/juegos/<id>`.
- [ ] La franja de estadísticas muestra "8" en el bloque JUEGOS (igual a `GAMES.length`).
- [ ] "ÚLTIMAS PUNTUACIONES" muestra 7 filas y "TOP JUGADORES · HOY" muestra 5. La primera fila del top es "NEONFOX 312.840".
- [ ] "▶ EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/biblioteca`.
- [ ] "VER SALÓN →" navega a `/salon`.
- [ ] "✦ CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth?modo=crear`, que muestra la pestaña "CREAR CUENTA" activa y el campo de correo.
- [ ] `/auth` sin parámetro sigue abriendo en "INICIAR SESIÓN".
- [ ] `/biblioteca` muestra el buscador, los chips y las 8 tarjetas, con el mismo comportamiento que tenía `/` en la SPEC 01.
- [ ] En `/` el Nav marca "Inicio". En `/biblioteca` y `/juegos/<id>` marca "Biblioteca". En `/salon` marca "Salón de la Fama".
- [ ] "Acerca de" aparece en el Nav y en el panel móvil, atenuado y con el badge "PRONTO". Al pulsarlo no cambia la URL.
- [ ] "VOLVER AL VAULT" (Detalle, Reproductor y 404) y "VOLVER A LA BIBLIOTECA" (Salón) navegan a `/biblioteca`.
- [ ] Iniciar sesión o pulsar "JUGAR COMO INVITADO" redirige a `/biblioteca`.
- [ ] Las secciones bajo el hero aparecen con la animación reveal al hacer scroll.
- [ ] Con `prefers-reduced-motion: reduce` emulado, todas las secciones se ven sin animación y las siluetas no se mueven.
- [ ] Con JavaScript deshabilitado, todas las secciones de `/` son visibles.
- [ ] A menos de 840 px de ancho la Home no produce scroll horizontal.
- [ ] No aparecen errores de hidratación en la consola en `/`, `/biblioteca` ni `/auth?modo=crear`.

## Decisiones

- **Sí:** Home en `/` y Biblioteca en `/biblioteca`. La landing es la portada natural y el nombre de la ruta coincide con el Nav.
- **No:** Biblioteca en `/juegos`. Más REST, pero se aleja de la etiqueta visible.
- **No:** Home en `/inicio`. La landing no sería la portada.
- **Sí:** "Acerca de" visible pero deshabilitado, con el badge "PRONTO". Anuncia la sección sin enlazar a una página inexistente.
- **No:** omitir el enlace. Descartado por elección del usuario.
- **Sí:** "Actividad en vivo" con datos mock estáticos en `lib/home.ts`. Mantiene el criterio de la SPEC 01 de no leer `av_scores` en los leaderboards.
- **No:** derivarlo de `seededScores` o de `av_scores`. Cambia textos de la plantilla o abre el tema de la persistencia.
- **Sí:** la estadística de juegos usa `GAMES.length`. Evita mostrar una cifra falsa ("12+") con 8 juegos.
- **Sí:** `/auth?modo=crear` abre "CREAR CUENTA". Coherente con el texto de los CTAs y con un cambio mínimo en `AuthForm`.
- **Sí:** todos los "volver al catálogo" y el redirect de `/auth` van a `/biblioteca`. Conservan el significado que tenían cuando `/` era la Biblioteca.
- **Sí:** respetar `prefers-reduced-motion` y dejar el contenido visible sin JavaScript. Accesibilidad y robustez a costa de un pequeño desvío de la plantilla.
- **Sí:** la Home es un Server Component y solo `reveal-on-scroll.tsx` es cliente. Minimiza el JavaScript enviado.
- **Sí:** el carrusel de juegos usa `Link` en lugar de `onClick`. Son enlaces reales, navegables con teclado y prefetch.
- **No:** portar `ABOUT PAGE`, `GAMEPAD` y `Theme variants`. No los usa ninguna pantalla de esta spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Leer `searchParams` en `/auth` con Cache Components exige `<Suspense>` | Revisar la doc en el paso 1 y envolver el formulario en `<Suspense>`, como en `/salon`. |
| Flash de contenido si `.reveal` se oculta antes de que el observer arranque | `.reveal` solo se oculta cuando el root tiene la clase que añade `reveal-on-scroll.tsx`. Lo que ya está en pantalla recibe `.in` en el primer callback. |
| Quedan enlaces a `/` que asumían que `/` era la Biblioteca | El paso 3 lista los seis puntos conocidos. Antes de cerrar, buscar `href="/"` y `push("/")` en `app/` y `components/`. |
| El hero con `min-height: calc(100vh - 60px)` corta contenido en móviles bajos | Verificar a 375×667 que los CTAs se ven sin scroll horizontal. Ajustar el padding si hace falta. |

## Lo que **no** está en esta spec

- La página "Acerca de" y sus estilos.
- Los estilos del gamepad y las variantes de tema.
- Datos reales o persistidos en "Actividad en vivo" y un ticker animado en tiempo real.
- Contador de créditos funcional.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
