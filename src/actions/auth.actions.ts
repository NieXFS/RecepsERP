"use server";

import { getAuthUserWithAccess } from "@/lib/session";
import { getDefaultLandingRoute } from "@/lib/tenant-permissions";

export async function getMyLandingRouteAction(): Promise<string> {
  const user = await getAuthUserWithAccess();
  return getDefaultLandingRoute(user);
}
