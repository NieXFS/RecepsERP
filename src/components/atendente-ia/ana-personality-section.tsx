"use client";

import { useState } from "react";
import { MessageSquareText, Sparkles } from "lucide-react";
import { AnaSectionCard } from "./ana-section-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SUPPORT_PROMPT_MESSAGE =
  "Olá, sou administrador no Receps ERP e quero ajustar a personalidade da minha atendente Ana.";

function getSupportUrl() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER?.trim();
  if (!number) return null;
  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set("text", SUPPORT_PROMPT_MESSAGE);
  return url.toString();
}

export function AnaPersonalitySection({
  botName,
  systemPrompt,
  onBotNameChange,
  style,
}: {
  botName: string;
  systemPrompt: string;
  onBotNameChange: (value: string) => void;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const supportUrl = getSupportUrl();
  const promptPreview = systemPrompt.split("\n").slice(0, 4).join("\n");

  return (
    <AnaSectionCard
      icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
      title="Personalidade"
      subtitle="Como a Ana se apresenta e se comporta nas conversas."
      style={style}
    >
      <div className="space-y-2">
        <Label
          htmlFor="ana-bot-name"
          className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
        >
          Nome da atendente
        </Label>
        <Input
          id="ana-bot-name"
          value={botName}
          onChange={(event) => onBotNameChange(event.target.value)}
          placeholder="Ex.: Ana"
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Prompt de personalidade
          </Label>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver completo
                </Button>
              }
            />
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Prompt de personalidade da Ana</DialogTitle>
                <DialogDescription>
                  Esse é o roteiro que a Ana segue nas conversas. Ajustes são feitos pelo
                  time de suporte pra garantir consistência.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-auto rounded-lg border bg-muted/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                  {systemPrompt}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-xl border border-dashed border-primary/20 bg-muted/20 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80 line-clamp-5">
            {promptPreview}
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex-1">
            Quer mudar o tom da Ana ou adicionar serviços ao roteiro?{" "}
            {supportUrl ? (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Fale com o suporte pelo WhatsApp
              </a>
            ) : (
              <span className="font-medium text-foreground">Fale com o suporte</span>
            )}
            {" "}que a gente ajusta pra você.
          </div>
        </div>
      </div>
    </AnaSectionCard>
  );
}
