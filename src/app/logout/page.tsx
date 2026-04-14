"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Encerrando sua sessão...</p>
    </div>
  );
}
