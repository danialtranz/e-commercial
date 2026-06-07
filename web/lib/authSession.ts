import { UserInfo } from "@/constants/authorization";
import { getToken } from "@/utils/tokenManager";

export const AUTH_SESSION_UPDATED_EVENT = "auth-session-updated";

export type StoredUserInfo = {
  name?: string;
  email?: string;
  picture?: string;
  role?: string;
};

export function readAuthSessionFromStorage(): {
  isLoggedIn: boolean;
  userInfo: StoredUserInfo | null;
} {
  if (typeof window === "undefined") {
    return { isLoggedIn: false, userInfo: null };
  }

  try {
    const token = getToken();
    if (!token) {
      return { isLoggedIn: false, userInfo: null };
    }

    const raw = localStorage.getItem(UserInfo);
    if (!raw) {
      return { isLoggedIn: false, userInfo: null };
    }

    const parsed = JSON.parse(raw) as StoredUserInfo;
    return { isLoggedIn: true, userInfo: parsed };
  } catch {
    return { isLoggedIn: false, userInfo: null };
  }
}

/** Gọi sau khi ghi token / userInfo — header cùng tab cập nhật ngay, không cần F5. */
export function notifyAuthSessionUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT));
}

export type AuthSessionSnapshot = {
  isLoggedIn: boolean;
  userInfo: StoredUserInfo | null;
};

const GUEST_AUTH_SNAPSHOT: AuthSessionSnapshot = {
  isLoggedIn: false,
  userInfo: null,
};

let cachedAuthSnapshot: AuthSessionSnapshot = GUEST_AUTH_SNAPSHOT;

function userInfoEquals(
  a: AuthSessionSnapshot["userInfo"],
  b: AuthSessionSnapshot["userInfo"],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.name === b.name &&
    a.email === b.email &&
    a.picture === b.picture &&
    a.role === b.role
  );
}

/** Dùng với useSyncExternalStore — snapshot phải ổn định (cùng reference) khi dữ liệu không đổi. */
export function subscribeAuthSession(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => onStoreChange();
  window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getAuthSessionSnapshot(): AuthSessionSnapshot {
  const { isLoggedIn, userInfo } = readAuthSessionFromStorage();

  if (
    cachedAuthSnapshot.isLoggedIn === isLoggedIn &&
    userInfoEquals(cachedAuthSnapshot.userInfo, userInfo)
  ) {
    return cachedAuthSnapshot;
  }

  cachedAuthSnapshot = { isLoggedIn, userInfo };
  return cachedAuthSnapshot;
}

export function getAuthSessionServerSnapshot(): AuthSessionSnapshot {
  return GUEST_AUTH_SNAPSHOT;
}
