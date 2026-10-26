"use client";

import { useSyncExternalStore } from "react";

export type User = { name: string };
export type SavedScore = { game: string; score: number; name: string; at: number };

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";
const USER_EVENT = "av_user_change";

function readRawUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

// useSyncExternalStore needs a stable snapshot: re-parse only when the raw string changes.
let cachedRaw: string | null = null;
let cachedUser: User | null = null;

function getSnapshot(): User | null {
  const raw = readRawUser();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

function getServerSnapshot(): User | null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(USER_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(USER_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useUser(): User | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function signIn(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  window.dispatchEvent(new Event(USER_EVENT));
}

export function signOut(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
  window.dispatchEvent(new Event(USER_EVENT));
}

export function saveScore(entry: Omit<SavedScore, "at">): void {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    const all = Array.isArray(parsed) ? (parsed as SavedScore[]) : [];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}
