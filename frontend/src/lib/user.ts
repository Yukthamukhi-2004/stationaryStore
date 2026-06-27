export type LocalUser = {
  id: string;
  name: string;
  email: string;
};

type AuthStorage = {
  user: LocalUser;
  password: string;
};

const STORAGE_KEY_AUTH = "stationery_auth";

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function saveLocalAuth(auth: AuthStorage) {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(auth));
  } catch {
    // ignore storage failures
  }
}

function getLocalAuth(): AuthStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    return raw ? (JSON.parse(raw) as AuthStorage) : null;
  } catch {
    return null;
  }
}

export function getLocalUser(): LocalUser | null {
  return getLocalAuth()?.user ?? null;
}

export function createLocalUser(
  name: string,
  email: string,
  password: string,
): LocalUser {
  const user = { id: generateId(), name, email };
  saveLocalAuth({ user, password });
  return user;
}

export function signInLocalUser(
  email: string,
  password: string,
): LocalUser | null {
  const auth = getLocalAuth();
  if (!auth) return null;
  if (auth.user.email !== email || auth.password !== password) return null;
  return auth.user;
}

export function clearLocalUser() {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch {
    // ignore storage failures
  }
}

export function updateLocalUser(name: string, email: string): LocalUser {
  const existingAuth = getLocalAuth();
  const user = existingAuth
    ? { ...existingAuth.user, name, email }
    : { id: generateId(), name, email };

  saveLocalAuth({
    user,
    password: existingAuth?.password ?? "",
  });

  return user;
}
