"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, Phone, Mail, ChevronRight, Plus } from "lucide-react";
import { CustomerCreateForm } from "@/components/customer/customer-create-form";

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="sm:self-stretch"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} encontrado
          {filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lista de clientes */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum cliente encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((customer) => (
            <Link key={customer.id} href={`/clientes/${customer.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center gap-4">
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KPIs resumidos */}
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Visitas</p>
                      <p className="text-sm font-semibold">{customer.visitCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">LTV</p>
                      <p className="text-sm font-semibold">
                        R$ {customer.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getTierLabel(customer.totalSpent)}
                    </Badge>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre manualmente um novo cliente ou paciente no estabelecimento.
            </DialogDescription>
          </DialogHeader>
          <CustomerCreateForm
            onCancel={() => setIsDialogOpen(false)}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
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
