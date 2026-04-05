/** Layout de autenticação — centralizado, sem sidebar */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,oklch(0.82_0.1_285/0.18),transparent_32%),linear-gradient(to_bottom,transparent,oklch(0.96_0.008_285/0.8))] px-6 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
