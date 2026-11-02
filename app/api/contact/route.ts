import { Resend } from "resend";
import { validateContact, type ContactInput } from "@/lib/contact";

type ContactRequest = ContactInput & { website?: string }; // website = honeypot

export type ContactResponse = { ok: true } | { ok: false; error: string };

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";

function reply(body: ContactResponse, status = 200) {
  return Response.json(body, { status });
}

function isContactRequest(value: unknown): value is ContactRequest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.message === "string" &&
    (v.website === undefined || typeof v.website === "string")
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only POST is exported, so Next answers any other method with 405.
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, error: "SOLICITUD INVÁLIDA" }, 400);
  }
  if (!isContactRequest(body)) return reply({ ok: false, error: "SOLICITUD INVÁLIDA" }, 400);

  // Bots fill every field; pretend it worked so they get no signal.
  if (body.website && body.website.trim() !== "") return reply({ ok: true });

  const result = validateContact({ name: body.name, email: body.email, message: body.message });
  if (!result.ok) return reply({ ok: false, error: result.error }, 400);
  const { name, email, message } = result.data;

  // Read inside the handler (not at module level) so values come from the request-time environment.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;
  if (!apiKey || !to) {
    console.error("[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set");
    return reply({ ok: false, error: "SERVICIO DE CORREO NO CONFIGURADO" }, 500);
  }

  const text = `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}\n`;
  const html =
    `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>` +
    `<p><strong>Correo:</strong> ${escapeHtml(email)}</p>` +
    `<p><strong>Mensaje:</strong></p>` +
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      text,
      html,
    });
    if (error) {
      console.error("[contact] Resend returned an error:", error);
      return reply({ ok: false, error: "NO SE PUDO TRANSMITIR EL MENSAJE. INTÉNTALO DE NUEVO." }, 502);
    }
  } catch (err) {
    console.error("[contact] Resend threw:", err);
    return reply({ ok: false, error: "NO SE PUDO TRANSMITIR EL MENSAJE. INTÉNTALO DE NUEVO." }, 502);
  }

  return reply({ ok: true });
}
