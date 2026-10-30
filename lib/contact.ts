// Contact form types and limits, shared by the client form and the Server Action.

export const CONTACT_LIMITS = { name: 80, email: 254, msg: 2000 } as const;

export type ContactFields = { name: string; email: string; msg: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }   // trimmed name, shown uppercased in the terminal
  | { status: "error"; message: string }; // text of the [ERR] line
