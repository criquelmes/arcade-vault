"use client";

import { useActionState, useState } from "react";
import { sendContactMessage } from "@/app/about/actions";
import type { ContactFields, ContactState } from "@/lib/contact";

const EMPTY: ContactFields = { name: "", email: "", msg: "" };
const INITIAL: ContactState = { status: "idle" };

// Remounting with a new key resets both the fields and the action state.
export function ContactForm() {
  const [round, setRound] = useState(0);
  return <ContactFormRound key={round} onReset={() => setRound((r) => r + 1)} />;
}

function ContactFormRound({ onReset }: { onReset: () => void }) {
  const [form, setForm] = useState<ContactFields>(EMPTY);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const [state, formAction, isPending] = useActionState(async (prev: ContactState, formData: FormData) => {
    const next = await sendContactMessage(prev, formData);
    if (next.status === "error") triggerShake();
    return next;
  }, INITIAL);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      e.preventDefault();
      triggerShake();
    }
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} action={formAction} onSubmit={onSubmit}>
      {state.status !== "success" ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input id="contact-name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="px_kai" />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input id="contact-email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jugador@vault.gg" />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea id="contact-msg" name="msg" rows={5} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Cuéntanos qué tienes en mente…"></textarea>
          </div>
          {/* Honeypot: hidden from users and keyboard; bots fill it */}
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="contact-website">WEBSITE</label>
            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <button className="btn xl press" type="submit" disabled={isPending} style={{ width: "100%" }}>
            {isPending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
          {state.status === "error" && <div className="contact-error" role="alert">{state.message}</div>}
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">&gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.<span className="caret">_</span></div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={onReset}>ENVIAR OTRO MENSAJE</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
