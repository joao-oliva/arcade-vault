"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type StoredUser = { name: string };
export type StoredScore = { game: string; score: number; name: string; at: number };

type UserContextValue = {
  user: StoredUser | null;
  login: (name: string) => void;
  logout: () => void;
  saveScore: (entry: Omit<StoredScore, "at">) => void;
};

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const listeners = new Set<() => void>();

// In-memory fallback so login still works for the session when localStorage is unavailable.
let memoryUser: string | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

// Returns the raw string so the snapshot stays referentially stable between reads.
function readRawUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return memoryUser;
  }
}

// The server snapshot is always "no user", so hydration matches and the stored user appears after mount.
function getServerSnapshot(): string | null {
  return null;
}

function parseUser(raw: string | null): StoredUser | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof (parsed as StoredUser).name === "string") {
      return { name: (parsed as StoredUser).name };
    }
  } catch {}
  return null;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const rawUser = useSyncExternalStore(subscribe, readRawUser, getServerSnapshot);
  const user = useMemo(() => parseUser(rawUser), [rawUser]);

  const login = useCallback((name: string) => {
    memoryUser = JSON.stringify({ name: name.toUpperCase().slice(0, 10) });
    try {
      localStorage.setItem(USER_KEY, memoryUser);
    } catch {}
    notify();
  }, []);

  const logout = useCallback(() => {
    memoryUser = null;
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
    notify();
  }, []);

  const saveScore = useCallback((entry: Omit<StoredScore, "at">) => {
    try {
      const all: StoredScore[] = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
  }, []);

  const value = useMemo(() => ({ user, login, logout, saveScore }), [user, login, logout, saveScore]);

  return <UserContext value={value}>{children}</UserContext>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <UserProvider>");
  return ctx;
}
