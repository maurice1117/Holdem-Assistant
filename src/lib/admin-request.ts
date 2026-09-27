import "server-only";

import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "./admin-auth";

export async function isAdminRequestAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
