// Contact form validation shared by components/about/contact-form.tsx and app/api/contact/route.ts.
// No "use server": it must be importable from both the client and the server.

export type ContactInput = { name: string; email: string; message: string };

export type ContactField = keyof ContactInput;

export const CONTACT_LIMITS = {
  nameMax: 80,
  emailMax: 254,
  messageMin: 10,
  messageMax: 2000,
} as const;

// Deliberately simple: something@something.tld, no spaces. Resend rejects anything stranger.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns the trimmed data or the first readable error (uppercase, like the rest of the terminal).
export function validateContact(raw: ContactInput):
  | { ok: true; data: ContactInput }
  | { ok: false; error: string } {
  const data: ContactInput = {
    name: raw.name.trim(),
    email: raw.email.trim(),
    message: raw.message.trim(),
  };

  if (data.name.length === 0) return { ok: false, error: "EL NOMBRE ES OBLIGATORIO" };
  if (data.name.length > CONTACT_LIMITS.nameMax) {
    return { ok: false, error: `EL NOMBRE NO PUEDE SUPERAR LOS ${CONTACT_LIMITS.nameMax} CARACTERES` };
  }

  if (data.email.length === 0) return { ok: false, error: "EL CORREO ES OBLIGATORIO" };
  if (data.email.length > CONTACT_LIMITS.emailMax) {
    return { ok: false, error: `EL CORREO NO PUEDE SUPERAR LOS ${CONTACT_LIMITS.emailMax} CARACTERES` };
  }
  if (!EMAIL_RE.test(data.email)) return { ok: false, error: "EL CORREO NO ES VÁLIDO" };

  if (data.message.length < CONTACT_LIMITS.messageMin) {
    return { ok: false, error: `EL MENSAJE DEBE TENER AL MENOS ${CONTACT_LIMITS.messageMin} CARACTERES` };
  }
  if (data.message.length > CONTACT_LIMITS.messageMax) {
    return { ok: false, error: `EL MENSAJE NO PUEDE SUPERAR LOS ${CONTACT_LIMITS.messageMax} CARACTERES` };
  }

  return { ok: true, data };
}
