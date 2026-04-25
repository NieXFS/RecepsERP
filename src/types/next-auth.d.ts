import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";
import type { GlobalRole, Role } from "@/generated/prisma/enums";

type RecepsSessionUser = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  globalRole: GlobalRole | null;
  avatarUrl: string | null;
};

type RecepsActiveUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & RecepsSessionUser;
    activeUser: RecepsActiveUser;
    masterUserId: string;
  }

  interface User {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: Role;
    globalRole: GlobalRole | null;
    avatarUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    tenantId?: string;
    role?: Role;
    globalRole?: GlobalRole | null;
    avatarUrl?: string | null;
  }
}
