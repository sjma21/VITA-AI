import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "vita_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getAdminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value ? value : null;
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword());
}

/** Deterministic session token derived from ADMIN_PASSWORD (not the password itself). */
export function createAdminSessionToken(): string | null {
  const password = getAdminPassword();
  if (!password) return null;
  return createHmac("sha256", password).update("vita-admin-session-v1").digest("base64url");
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = createAdminSessionToken();
  if (!expected) return false;

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}
