"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReferralShareActionsProps = {
  code: string;
  shareUrl: string;
  tenantName: string;
};

export function ReferralShareActions({
  code,
  shareUrl,
  tenantName,
}: ReferralShareActionsProps) {
  async function copyCode() {
    await navigator.clipboard.writeText(code);
    toast.success("Código copiado.");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copiado.");
  }

  function shareOnWhatsApp() {
    const message = encodeURIComponent(
      `Recebi um convite da ${tenantName} para conhecer o Receps ERP. Use meu link e ganhe 15% OFF na primeira cobrança: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-1.5">
          <label htmlFor="referral-code" className="text-sm font-medium">
            Código
          </label>
          <div className="flex gap-2">
            <Input id="referral-code" value={code} readOnly />
            <Button type="button" variant="outline" onClick={copyCode}>
              Copiar
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="referral-link" className="text-sm font-medium">
            Link para compartilhar
          </label>
          <div className="flex gap-2">
            <Input id="referral-link" value={shareUrl} readOnly />
            <Button type="button" variant="outline" onClick={copyLink}>
              Copiar link
            </Button>
          </div>
        </div>
      </div>

      <Button type="button" onClick={shareOnWhatsApp}>
        Compartilhar no WhatsApp
      </Button>
    </div>
  );
}
