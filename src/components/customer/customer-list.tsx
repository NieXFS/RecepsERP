"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogDescription,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
  AnimatedDialogTrigger,
} from "@/components/ui/animated-dialog";
import { AnimatedList } from "@/components/ui/animated-list";
import { Search, Users, Phone, Mail, ChevronRight, Plus } from "lucide-react";
import { CustomerForm } from "@/components/customer/customer-form";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
};

/**
 * Componente client-side de listagem de clientes com busca local.
 * Exibe cards com dados resumidos e link para o perfil completo.
 */
export function CustomerList({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de busca + ação primária */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 transition-all duration-200 ease-out focus-visible:shadow-sm"
          />
        </div>

        <AnimatedDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AnimatedDialogTrigger
            render={
              <Button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="sm:self-stretch"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo Cliente
              </Button>
            }
          />
          <AnimatedDialogContent className="overflow-hidden p-0 sm:max-w-3xl">
            <AnimatedDialogHeader>
              <AnimatedDialogTitle>Novo Cliente</AnimatedDialogTitle>
              <AnimatedDialogDescription>
                Cadastre manualmente um novo cliente ou paciente no estabelecimento.
              </AnimatedDialogDescription>
            </AnimatedDialogHeader>
            <div className="px-6 pb-6">
              <CustomerForm
                mode="full"
                onCancel={() => setIsDialogOpen(false)}
                onSuccess={() => setIsDialogOpen(false)}
              />
            </div>
          </AnimatedDialogContent>
        </AnimatedDialog>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" aria-hidden="true" />
        <span>
          {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} encontrado
          {filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lista de clientes */}
      {filtered.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum cliente encontrado.
          </CardContent>
        </Card>
      ) : (
        <AnimatedList className="grid gap-2" stagger={40}>
          {filtered.map((customer) => (
            <Link key={customer.id} href={`/clientes/${customer.id}`}>
              <Card className="cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Avatar com iniciais */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* Dados */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{customer.name}</p>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KPIs resumidos */}
                  <div className="hidden shrink-0 items-center gap-4 sm:flex">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Visitas</p>
                      <p className="text-sm font-semibold tabular-nums">{customer.visitCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">LTV</p>
                      <p className="text-sm font-semibold tabular-nums">
                        R$ {customer.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getTierLabel(customer.totalSpent)}
                    </Badge>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </AnimatedList>
      )}
    </div>
  );
}

/** Retorna o label da classificação do cliente por LTV */
function getTierLabel(totalSpent: number): string {
  if (totalSpent >= 5000) return "💎 Diamante";
  if (totalSpent >= 2000) return "⭐ Ouro";
  if (totalSpent >= 500) return "🥈 Prata";
  return "🥉 Bronze";
}
