# SPEC 03 — Página "Acerca de" con formulario de contacto vía Resend

> **Estado:** Implementando
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-30
> **Objetivo:** Portar literalmente `references/templates/home-about/about.jsx` a la ruta `/about` y hacer que su formulario de contacto envíe un correo real al equipo usando Resend.

---

## Por qué existe este spec

SPEC 02 dejó fuera la página "Acerca de" y su link en el navbar para no mezclar un formulario con el cambio de navegación.
El template simula el envío (`setSent` en el cliente, sin red).
Este spec la porta tal cual y agrega lo único que el template no trae: un envío real desde el servidor, con su estado de carga y su estado de error.

---

## Alcance

**Dentro:**

- Ruta `/about` con las tres secciones del template, en este orden y con el copy literal:
  1. **Hero:** kicker `▸ ACERCA DE`, título `ACERCA DE ARCADE VAULT`, párrafo de misión y 3 highlights con íconos pixel (HEART magenta, BROWSER cyan, PLANT green) con `transitionDelay` de `i * 80` ms.
  2. **Divisor:** `about-divider` con `.reveal`, dos barras y 24 píxeles con `animationDelay` de `i * 80` ms, `aria-hidden`.
  3. **Contacto:** `about-contact` con `.reveal`. Columna izquierda con kicker `▸ CONTACTO`, título `CONTÁCTANOS`, subtítulo y 3 tips (`RESPUESTA EN 24-48H`, `SUGERENCIAS BIENVENIDAS`, `SIN SPAM, JAMÁS`). Columna derecha con el formulario NOMBRE / CORREO ELECTRÓNICO / MENSAJE, botón `▶  ENVIAR MENSAJE` y, tras un envío exitoso, la terminal `VAULT-OS // TERMINAL` con el nombre en mayúsculas y el botón `ENVIAR OTRO MENSAJE`.
- Animación reveal reutilizando `components/reveal-observer.tsx` de SPEC 02.
- Link **Acerca de** (`/about`) en el navbar de escritorio y en el panel móvil, después de Salón de la Fama, activo solo en `/about`.
- Envío real del formulario con una Server Action que llama a Resend:
  - Destinatario: `CONTACT_TO_EMAIL`.
  - Remitente: `CONTACT_FROM_EMAIL`, por defecto `Arcade Vault <onboarding@resend.dev>`.
  - `replyTo` igual al correo del visitante.
  - Asunto `[Arcade Vault] Nuevo mensaje de <nombre>`.
  - Cuerpo en texto plano y HTML simple con nombre, correo y mensaje, con HTML escapado.
- Validación en el cliente: si algún campo queda vacío (tras `trim`), el formulario hace `shake` y no llama al servidor, igual que el template.
- Validación en el servidor: campos no vacíos, formato de correo, nombre ≤ 80, correo ≤ 254 y mensaje ≤ 2000 caracteres.
- Honeypot: campo oculto `website`; si llega relleno, la acción responde éxito sin enviar correo.
- Estado de carga: mientras la acción está pendiente, el botón muestra `ENVIANDO…` y queda deshabilitado.
- Estado de error: el formulario conserva lo escrito, hace `shake` y muestra bajo el botón una línea roja estilo terminal con el mensaje de error.
- Estilos del bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` portados a `app/globals.css`.
- Dependencia `resend` en `package.json`.
- `.env.example` documentando las tres variables, con excepción en `.gitignore` para que se versione.

**Fuera de alcance (para specs futuros):**

- Correo de confirmación al visitante (auto-reply).
- Plantillas con React Email.
- Rate limiting por IP, CAPTCHA o Turnstile.
- Guardar los mensajes en una base de datos o en `localStorage`.
- Verificación de un dominio propio en Resend (es configuración de cuenta, no código).
- Link a `/about` desde el footer o el home.
- Reescritura de estilos a utilidades Tailwind.
- Tests automatizados.

---

## Modelo de datos

```ts
// lib/contact.ts — tipos y límites compartidos por cliente y servidor
export const CONTACT_LIMITS = { name: 80, email: 254, msg: 2000 } as const;

export type ContactFields = { name: string; email: string; msg: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }   // name ya con trim, se muestra en mayúsculas
  | { status: "error"; message: string }; // texto de la línea [ERR]
```

```ts
// app/about/actions.ts — "use server"
export async function sendContactMessage(
  prev: ContactState,
  formData: FormData, // campos: name, email, msg, website (honeypot)
): Promise<ContactState>;
```

Variables de entorno (en `.env.local`, documentadas en `.env.example`):

```bash
RESEND_API_KEY=re_xxx                                   # obligatoria
CONTACT_TO_EMAIL=equipo@ejemplo.com                     # obligatoria
CONTACT_FROM_EMAIL="Arcade Vault <onboarding@resend.dev>" # opcional
```

Mensajes de error (literales):

- Validación del servidor: `[ERR] DATOS NO VÁLIDOS. REVISA LOS CAMPOS.`
- Fallo de Resend o variables faltantes: `[ERR] NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO.`

Convenciones:

- Los inputs son controlados (estado local), así un error no borra lo escrito.
- `ENVIAR OTRO MENSAJE` vacía los campos y vuelve el estado a `idle` remontando el formulario con un `key` nuevo.
- No hay claves nuevas en `localStorage`.

---

## Implementación

1. **Estilos.** Copiar a `app/globals.css` el bloque `ABOUT PAGE` completo de `references/templates/home-about/styles.css`, con `@keyframes pxblink` y `@keyframes shake`. Revisar cada `animation:` del bloque (`blink`, `fadeIn`) contra `globals.css` y portar lo que falte. Agregar `.contact-error` (línea roja estilo terminal) y `.hp-field` (fuera de pantalla, sin `display: none`). Prueba: `npm run build` sin errores.
2. **Ícono pixel.** Agregar `HighlightIcon` (HEART, BROWSER, PLANT) a `components/pixel-art.tsx`, como port literal de los SVG del template y como Server Component.
3. **Página estática.** Crear `app/about/page.tsx` (Server Component) con `metadata.title` "Acerca de · Arcade Vault", `<RevealObserver />`, el hero, el divisor y la sección de contacto con la columna izquierda y el formulario visual sin envío. Prueba: `/about` se ve igual que el template.
4. **Navbar.** En `components/nav.tsx`, agregar la sección `"about"` (activa si `pathname` empieza por `/about`) y el link Acerca de en escritorio y en el panel móvil. Verificar el desborde entre 900 y 1100px; si desborda, ajustar el breakpoint del navbar en `globals.css`.
5. **Dependencia y entorno.** `npm install resend`. Crear `.env.example` con las tres variables y agregar `!.env.example` a `.gitignore`.
6. **Tipos.** Crear `lib/contact.ts` con el modelo de datos de arriba.
7. **Server Action.** Consultar antes `node_modules/next/dist/docs/` sobre Server Actions y `useActionState`. Crear `app/about/actions.ts` con `sendContactMessage`, que hace lo siguiente en orden:
   1. Si viene el honeypot, devuelve éxito.
   2. Valida y, si falla, devuelve el error de validación.
   3. Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, hace `console.error` y devuelve el error de envío.
   4. Llama a `resend.emails.send` con el remitente, el destinatario, `replyTo`, el asunto, `text` y `html` escapado.
   5. Si Resend devuelve `error` o lanza una excepción, hace `console.error` y devuelve el error de envío.
   6. Si todo va bien, devuelve `{ status: "success", name }`.
8. **Formulario cliente.** Crear `components/contact-form.tsx` (`"use client"`) que:
   - Usa `useActionState(sendContactMessage, { status: "idle" })` con `<form action>`.
   - Valida los campos vacíos en `onSubmit` (`preventDefault` + `shake` de 400 ms).
   - Muestra `ENVIANDO…` con `isPending`.
   - Muestra la línea `.contact-error` y hace `shake` cuando el estado es error.
   - Renderiza la terminal del template cuando el estado es success.

   `app/about/page.tsx` envuelve el formulario en un componente con `key` que se renueva al pulsar `ENVIAR OTRO MENSAJE`. Prueba: sin `.env.local`, enviar muestra la línea de error y conserva los campos.
9. **Envío real.** Con `.env.local` configurado, enviar desde `/about` y confirmar que el correo llega a `CONTACT_TO_EMAIL`.

---

## Criterios de aceptación

- [ ] `/about` muestra el hero, el divisor y la sección de contacto, en ese orden, con el copy literal del template.
- [ ] Los 3 highlights muestran los íconos HEART, BROWSER y PLANT en magenta, cyan y verde.
- [ ] El divisor y la sección de contacto empiezan invisibles y aparecen al entrar en el viewport.
- [ ] El navbar muestra Inicio, Biblioteca, Salón de la Fama y Acerca de, en escritorio y en el panel móvil.
- [ ] Acerca de está activo solo en `/about`.
- [ ] Enviar con algún campo vacío (o solo espacios) hace `shake` y no genera ninguna petición de red.
- [ ] Mientras el envío está en curso, el botón muestra `ENVIANDO…` y está deshabilitado.
- [ ] Con variables válidas, un envío muestra la terminal con `GRACIAS, <NOMBRE EN MAYÚSCULAS>.` y el correo llega a `CONTACT_TO_EMAIL`.
- [ ] El correo recibido tiene el asunto `[Arcade Vault] Nuevo mensaje de <nombre>` y, al responderlo, el destinatario es el correo del visitante.
- [ ] Un mensaje que contiene `<b>hola</b>` aparece en el correo como texto literal, no en negrita.
- [ ] Sin `RESEND_API_KEY`, enviar muestra `[ERR] NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO.`, hace `shake` y conserva los tres campos.
- [ ] Un mensaje de más de 2000 caracteres enviado al servidor devuelve `[ERR] DATOS NO VÁLIDOS. REVISA LOS CAMPOS.` y no se envía ningún correo.
- [ ] Rellenar el honeypot `website` (vía devtools) muestra la terminal de éxito y no se envía ningún correo.
- [ ] El campo honeypot no es visible ni alcanzable con Tab.
- [ ] `ENVIAR OTRO MENSAJE` vuelve al formulario con los tres campos vacíos.
- [ ] `RESEND_API_KEY` no aparece en ningún bundle de cliente (buscar `re_` en `.next/static` tras el build).
- [ ] Con ancho < 900px, `contact-grid` pasa a una columna.
- [ ] `.env.example` está versionado y `.env.local` no.
- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [ ] La consola del navegador no muestra errores de hidratación en `/about`.

---

## Decisiones

- **Sí:** Server Action con `useActionState`. Es la vía idiomática del App Router, no expone un endpoint público y la API key se queda en el servidor.
- **No:** Route Handler `app/api/contact/route.ts`. Deja un endpoint público y exige escribir a mano el estado del formulario.
- **Sí:** destinatario y remitente por variables de entorno, con remitente por defecto `onboarding@resend.dev`. Funciona sin dominio verificado y se cambia sin tocar código.
- **No:** destinatario hardcodeado. Cambiarlo exigiría un deploy.
- **Sí:** `replyTo` con el correo del visitante. El equipo responde directo desde su cliente de correo.
- **Sí:** línea de error en el formulario conservando los datos. El usuario no pierde lo que escribió.
- **No:** terminal con `[FAIL]`. Obliga a reescribir el mensaje para reintentar.
- **Sí:** honeypot y límites de longitud. Frenan bots simples sin dependencias ni fricción para el usuario.
- **No:** rate limit en memoria. No es fiable en serverless, porque cada instancia tiene su propio `Map`.
- **No:** CAPTCHA o Turnstile. Agrega fricción y un servicio externo; queda para otro spec si llega spam.
- **Sí:** el honeypot responde éxito. El bot no aprende que fue detectado.
- **Sí:** texto plano y HTML simple con escape. Basta para un correo interno y solo requiere `resend`.
- **No:** React Email. Agrega una dependencia y una plantilla para un único correo interno.
- **No:** auto-reply al visitante. `onboarding@resend.dev` solo entrega al dueño de la cuenta, así que necesitaría un dominio verificado.
- **Sí:** validación de vacíos en el cliente (como el template) y validación completa en el servidor. El cliente da feedback inmediato; el servidor no confía en el cliente.
- **No:** zod. Cuatro reglas no justifican una dependencia.
- **Sí:** página Server Component; solo `ContactForm` y `RevealObserver` son cliente. El hero y el divisor se prerenderizan.
- **Sí:** estado `ENVIANDO…` en el botón. Es el único agregado visual al template y evita dobles envíos.
- **Sí:** `.env.example` versionado con excepción en `.gitignore`. El patrón `.env*` actual lo ignoraría.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Con `onboarding@resend.dev`, Resend solo entrega a la dirección dueña de la cuenta; si `CONTACT_TO_EMAIL` es otra, falla | Documentado en `.env.example`. El fallo muestra la línea de error y se registra con `console.error`. Para producción hay que verificar un dominio (fuera de alcance). |
| Variables de entorno ausentes en el deploy | La acción las comprueba antes de llamar a Resend y devuelve el error de envío en vez de lanzar. |
| Inyección de HTML en el cuerpo del correo | Se escapan `& < > " '` en nombre, correo y mensaje antes de construir el `html`. |
| Inyección de cabeceras vía el asunto | El nombre se limita a 80 caracteres y se le quitan los saltos de línea antes de usarlo en el asunto. |
| React 19 resetea los formularios no controlados tras una acción | Los inputs son controlados, así que los datos se conservan tras un error. |
| `.reveal` arranca con `opacity: 0` y el formulario queda invisible sin JS | Igual que en SPEC 02: la regla `prefers-reduced-motion` lo muestra. Se acepta el caso sin JS. |
| El navbar con un quinto link desborda | El paso 4 verifica entre 900 y 1100px y ajusta el breakpoint si hace falta. |

---

## Lo que **no** está en este spec

- Auto-reply al visitante.
- React Email.
- Rate limiting, CAPTCHA o Turnstile.
- Persistencia de los mensajes.
- Dominio propio en Resend.
- Links a `/about` fuera del navbar.
- Migración de estilos a Tailwind.
- Tests automatizados.

Cada uno, si llega, va en su propio spec.
