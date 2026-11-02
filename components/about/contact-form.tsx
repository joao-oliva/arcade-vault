"use client";

import { useState, type FormEvent } from "react";
import type { ContactResponse } from "@/app/api/contact/route";
import type { ContactInput } from "@/lib/contact";

type FormStatus =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; name: string }
  | { status: "error"; error: string };

const EMPTY: ContactInput = { name: "", email: "", message: "" };
const NETWORK_ERROR = "NO SE PUDO CONECTAR CON EL SERVIDOR";

// Keeps the honeypot out of sight and out of the tab order without display:none,
// which some bots detect and skip.
const HONEYPOT_STYLE = { position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" } as const;

function TerminalBar() {
  return (
    <div className="term-bar">
      <span className="dot r" /><span className="dot y" /><span className="dot g" />
      <span className="term-title">VAULT-OS // TERMINAL</span>
    </div>
  );
}

export function ContactForm() {
  // Values live apart from the status so "REINTENTAR" can return to the form with them intact.
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<FormStatus>({ status: "idle" });
  const [shake, setShake] = useState(false);

  const set = (field: keyof ContactInput) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.status === "sending") return;
    if (!values.name.trim() || !values.email.trim() || !values.message.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setState({ status: "sending" });
    let result: ContactResponse;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website }),
      });
      result = (await res.json()) as ContactResponse;
    } catch {
      setState({ status: "error", error: NETWORK_ERROR });
      return;
    }

    setState(result.ok ? { status: "success", name: values.name.trim() } : { status: "error", error: result.error });
  }

  const sending = state.status === "sending";

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit} noValidate>
      {state.status === "success" ? (
        <div className="terminal-success">
          <TerminalBar />
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success" role="status">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setValues(EMPTY);
                  setWebsite("");
                  setState({ status: "idle" });
                }}
              >
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      ) : state.status === "error" ? (
        <div className="terminal-success error">
          <TerminalBar />
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Empaquetando mensaje…</div>
            <div className="line failure" role="alert">
              [ERROR] {state.error}
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={() => setState({ status: "idle" })}>
                REINTENTAR
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input id="contact-name" name="name" value={values.name} onChange={set("name")} placeholder="px_kai" />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={values.email}
              onChange={set("email")}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">MENSAJE</label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              value={values.message}
              onChange={set("message")}
              placeholder="Cuéntanos qué tienes en mente…"
            />
          </div>
          <div aria-hidden="true" style={HONEYPOT_STYLE}>
            <label htmlFor="contact-website">WEBSITE</label>
            <input
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <button className="btn xl press" type="submit" style={{ width: "100%" }} disabled={sending}>
            {sending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}
    </form>
  );
}
