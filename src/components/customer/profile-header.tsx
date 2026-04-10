import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type CustomerProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  birthDate: string | null;
  gender: string;
  address: string | null;
  city: string | null;
  state: string | null;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
};

/**
 * Cabeçalho do perfil do cliente — exibe dados demográficos, LTV e classificação.
 * O "Cliente Ouro" é determinado pelo totalSpent:
 *   Bronze: < R$500 | Prata: R$500–2000 | Ouro: R$2000–5000 | Diamante: > R$5000
 */
export function ProfileHeader({ profile }: { profile: CustomerProfile }) {
  const tier = getClientTier(profile.totalSpent);
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const createdDate = new Date(profile.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const age = profile.birthDate ? calculateAge(profile.birthDate) : null;

  return (
    <div>
      {/* Voltar */}
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar para Clientes
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar com iniciais */}
            <div
              className="animate-scale-in flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ backgroundColor: tier.color }}
            >
              {initials}
            </div>

            {/* Dados principais */}
            <div className="min-w-0 flex-1 animate-fade-in-left" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
                <Badge
                  className="text-xs"
                  style={{ backgroundColor: tier.color, color: "#fff" }}
                >
                  {tier.icon} {tier.label}
                </Badge>
              </div>

              {/* Info de contato */}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {profile.phone}
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    {profile.email}
                  </span>
                )}
                {(profile.city || profile.state) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {[profile.city, profile.state].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Cliente desde {createdDate}
                  {age !== null && ` · ${age} anos`}
                </span>
              </div>
            </div>

            {/* KPI cards do cliente */}
            <div className="flex shrink-0 gap-4 sm:gap-6">
              <div className="animate-fade-in-up text-center" style={{ animationDelay: "150ms" }}>
                <div className="mb-1 flex items-center justify-center gap-1 text-muted-foreground">
                  <Star className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-xs font-medium">Visitas</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{profile.visitCount}</p>
              </div>
              <div className="animate-fade-in-up text-center" style={{ animationDelay: "200ms" }}>
                <div className="mb-1 flex items-center justify-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-xs font-medium">LTV</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  R$ {profile.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Classificação do cliente por faixa de gasto total (LTV) */
function getClientTier(totalSpent: number) {
  if (totalSpent >= 5000) return { label: "Diamante", color: "#8B5CF6", icon: "💎" };
  if (totalSpent >= 2000) return { label: "Ouro", color: "#F59E0B", icon: "⭐" };
  if (totalSpent >= 500)  return { label: "Prata", color: "#6B7280", icon: "🥈" };
  return { label: "Bronze", color: "#92400E", icon: "🥉" };
}

function calculateAge(birthDateISO: string): number {
  const birth = new Date(birthDateISO);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
