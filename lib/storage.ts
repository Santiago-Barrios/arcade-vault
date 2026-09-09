// ===== storage.ts — helpers client-only sobre localStorage (mismas claves que el template) =====

export interface User {
  name: string;
}

export interface ScoreEntry {
  game: string;
  score: number;
  name: string;
  at: number;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";
const USER_EVENT = "av:user-changed";

let cachedRaw: string | null = null;
let cachedUser: User | null = null;

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? JSON.parse(raw) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

export function setUser(user: User | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  window.dispatchEvent(new Event(USER_EVENT));
}

// Permite a componentes (p. ej. Nav) suscribirse a cambios de sesión vía useSyncExternalStore.
export function subscribeUser(callback: () => void): () => void {
  window.addEventListener(USER_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(USER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function saveScore(entry: Omit<ScoreEntry, "at">): void {
  try {
    const all: ScoreEntry[] = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {
    // localStorage no disponible o corrupto — ignorar, es solo un mock visual
  }
}
