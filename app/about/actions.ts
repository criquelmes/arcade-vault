"use server";

import { Resend } from "resend";
import { CONTACT_LIMITS, type ContactFields, type ContactState } from "@/lib/contact";

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";
const INVALID: ContactState = { status: "error", message: "[ERR] DATOS NO VÁLIDOS. REVISA LOS CAMPOS." };
const SEND_FAILED: ContactState = { status: "error", message: "[ERR] NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO." };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function isValid({ name, email, msg }: ContactFields): boolean {
  return (
    name.length > 0 && name.length <= CONTACT_LIMITS.name &&
    email.length > 0 && email.length <= CONTACT_LIMITS.email && EMAIL_RE.test(email) &&
    msg.length > 0 && msg.length <= CONTACT_LIMITS.msg
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const fields: ContactFields = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    msg: field(formData, "msg"),
  };

  // Honeypot: bots fill the hidden field. Pretend success so they don't learn.
  if (field(formData, "website")) return { status: "success", name: fields.name };

  if (!isValid(fields)) return INVALID;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contact] Missing RESEND_API_KEY or CONTACT_TO_EMAIL");
    return SEND_FAILED;
  }

  const { name, email, msg } = fields;
  const subjectName = name.replace(/[\r\n]+/g, " ");
  const html =
    `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>` +
    `<p><strong>Correo:</strong> ${escapeHtml(email)}</p>` +
    `<p><strong>Mensaje:</strong></p>` +
    `<p style="white-space:pre-wrap">${escapeHtml(msg)}</p>`;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Nuevo mensaje de ${subjectName}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}`,
      html,
    });
    if (error) {
      console.error("[contact] Resend error:", error);
      return SEND_FAILED;
    }
  } catch (err) {
    console.error("[contact] Resend threw:", err);
    return SEND_FAILED;
  }

  return { status: "success", name };
}
