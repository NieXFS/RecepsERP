"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { switchBackToMasterAction } from "@/actions/account.actions";

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      try {
        await switchBackToMasterAction();
      } finally {
        await signOut({ callbackUrl: "/login" });
      }
    }

    void logout();
  }, []);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Encerrando sua sessão...</p>
    </div>
  );
}
