import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receps",
  description:
    "Receps é a marca principal dos produtos Atendentes IA e ERP para operações de saúde e beleza.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Suspense fallback={null}>
            <AnalyticsScripts />
          </Suspense>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
