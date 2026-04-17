import { BrandLogo } from "@/components/layout/brand-logo";
import { LoginBrandPanel } from "./login-brand-panel";

type LoginShellProps = {
  children: React.ReactNode;
};

/**
 * Shell visual da página /login.
 * Composição de duas colunas: painel de marca (lg+) + área do formulário.
 * Sem estado — recebe o <LoginForm /> como children.
 */
export function LoginShell({ children }: LoginShellProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.1fr_1fr]">
      <LoginBrandPanel />

      <main className="relative isolate flex w-full items-center justify-center overflow-hidden px-6 py-10 sm:px-10 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="animate-aurora-pan absolute -bottom-32 -right-24 h-[380px] w-[380px] rounded-full bg-accent/30 blur-3xl lg:hidden" />
          <div
            className="animate-twinkle absolute left-[12%] top-[22%] h-1 w-1 rounded-full bg-primary/40 lg:hidden"
            style={{ animationDelay: "1.4s" }}
          />
          <div
            className="animate-twinkle absolute right-[18%] top-[78%] h-[2px] w-[2px] rounded-full bg-primary/50 lg:hidden"
            style={{ animationDelay: "2.6s" }}
          />
        </div>

        <div className="relative flex w-full max-w-md flex-col gap-6">
          <div className="animate-fade-in-down flex justify-center lg:hidden">
            <BrandLogo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
