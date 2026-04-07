import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

/**
 * Logo institucional do Receps para o shell autenticado.
 * Mantém um único ponto de troca do branding principal.
 */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div className={cn("flex w-full items-center justify-center", className)}>
      <span className="sr-only">Receps</span>
      <div
        aria-hidden="true"
        className="h-8 w-[138px] bg-current text-primary"
        style={{
          WebkitMaskImage: "url('/logo_texto.svg')",
          maskImage: "url('/logo_texto.svg')",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    </div>
  );
}
