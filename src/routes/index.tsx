import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { roleHomePath, useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BISOU — Programa de Lealtad" },
      {
        name: "description",
        content:
          "Acumula puntos en cada visita y canjea recompensas en BISOU. Munchies · Coffee · Desserts en Managua.",
      },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session && role) {
      navigate({ to: roleHomePath(role), replace: true });
    }
  }, [loading, session, role, navigate]);

  if (loading || (session && role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-foreground/60">
          Est. Managua
        </p>
        <h1 className="mt-3 font-display text-7xl font-bold leading-none text-primary">BISOU</h1>
        <div className="mt-8 h-1 w-16 overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-12">
      <div className="flex-1" />
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-foreground/60">
          Est. Managua
        </p>
        <h1 className="mt-3 font-display text-7xl font-bold leading-none text-primary">BISOU</h1>
        <p className="mt-4 text-sm font-light uppercase tracking-[0.32em] text-foreground/80">
          Munchies · Coffee · Desserts
        </p>
        <div className="my-8 h-px w-16 bg-foreground/20" />
        <p className="max-w-xs text-sm leading-relaxed text-foreground/70">
          Acumula puntos en cada visita y canjéalos por tus favoritos.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-1 flex-col justify-end gap-3">
        <Link
          to="/login"
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/registro"
          className="inline-flex h-12 items-center justify-center rounded-full border border-primary bg-transparent px-6 text-sm font-medium tracking-wide text-primary transition-all hover:bg-primary/5 active:scale-[0.98]"
        >
          Crear cuenta
        </Link>
        <p className="mt-6 text-center text-[11px] font-light uppercase tracking-[0.3em] text-foreground/40">
          Managua, Nicaragua
        </p>
      </div>
    </div>
  );
}
