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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var pref=localStorage.getItem('receps-theme-preference');if(!pref){var old=localStorage.getItem('theme');pref=(old==='light'||old==='dark')?old:'auto';}var resolved;if(pref==='light'||pref==='dark'){resolved=pref;}else{var h=new Date().getHours();resolved=(h>=6&&h<18)?'light':'dark';}var el=document.documentElement;if(resolved==='dark')el.classList.add('dark');else el.classList.remove('dark');el.style.colorScheme=resolved;}catch(e){}})();`,
          }}
        />
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
