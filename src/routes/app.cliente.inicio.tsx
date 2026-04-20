import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Cake } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/app/cliente/inicio")({
  head: () => ({ meta: [{ title: "Inicio — BISOU" }] }),
  component: InicioPage,
});

interface Tx {
  id: string;
  tipo: string;
  puntos: number;
  descripcion: string | null;
  created_at: string;
}

interface NextReward {
  nombre: string;
  puntos_requeridos: number;
}

function isBirthday(fecha: string | null): boolean {
  if (!fecha) return false;
  const today = new Date();
  const d = new Date(fecha + "T00:00:00");
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
}

function InicioPage() {
  const { profile, loading: authLoading } = useAuth();
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [nextReward, setNextReward] = useState<NextReward | null>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      const [txRes, rewRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, tipo, puntos, descripcion, created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("recompensas")
          .select("nombre, puntos_requeridos")
          .eq("activa", true)
          .gt("puntos_requeridos", profile.puntos)
          .order("puntos_requeridos", { ascending: true })
          .limit(1),
      ]);
      if (!active) return;
      setTxs(txRes.data ?? []);
      setNextReward(rewRes.data?.[0] ?? null);
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  if (authLoading || !profile) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const firstName = profile.nombre.split(" ")[0];
  const progress = nextReward
    ? Math.min(100, Math.round((profile.puntos / nextReward.puntos_requeridos) * 100))
    : 100;
  const remaining = nextReward ? Math.max(0, nextReward.puntos_requeridos - profile.puntos) : 0;

  return (
    <div className="space-y-5 p-5">
      <header>
        <h1 className="font-display text-3xl text-foreground">Hola, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bienvenido a tu BISOU</p>
      </header>

      {isBirthday(profile.fecha_nacimiento) && (
        <div className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow">
          <Cake className="h-5 w-5 shrink-0" />
          <p className="text-sm leading-snug">
            <span className="font-medium">¡Feliz cumpleaños, {firstName}!</span> Hoy tienes un café
            gratis esperándote.
          </p>
        </div>
      )}

      <Card className="bg-primary p-6 text-primary-foreground shadow-lg">
        <p className="text-xs font-light uppercase tracking-[0.3em] text-primary-foreground/70">
          Tus puntos
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-6xl font-semibold leading-none">{profile.puntos}</span>
          <span className="text-sm font-light text-primary-foreground/80">pts disponibles</span>
        </div>
        {nextReward ? (
          <div className="mt-5 space-y-2">
            <Progress
              value={progress}
              className="h-2 bg-primary-foreground/20 [&>div]:bg-primary-foreground"
            />
            <p className="text-xs text-primary-foreground/85">
              Te faltan <span className="font-medium">{remaining} pts</span> para:{" "}
              <span className="font-medium">{nextReward.nombre}</span>
            </p>
          </div>
        ) : (
          <p className="mt-5 text-xs text-primary-foreground/85">
            ¡Tienes puntos suficientes para canjear recompensas!
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-primary-foreground/15 pt-4 text-xs">
          <div>
            <p className="text-primary-foreground/60">Puntos totales</p>
            <p className="mt-0.5 font-display text-lg">{profile.puntos_totales}</p>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/60">Miembro desde</p>
            <p className="mt-0.5 font-display text-lg">
              {new Date(profile.created_at).toLocaleDateString("es-NI", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Actividad reciente</h2>
        </div>
        {txs === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : txs.length === 0 ? (
          <EmptyState
            title="Sin actividad aún"
            description="Tus transacciones aparecerán aquí."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    t.puntos >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {t.puntos >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {t.descripcion ?? labelForTipo(t.tipo)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("es-NI", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`font-display text-sm font-semibold ${
                    t.puntos >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {t.puntos >= 0 ? "+" : ""}
                  {t.puntos}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function labelForTipo(t: string): string {
  switch (t) {
    case "suma":
      return "Puntos acumulados";
    case "canje":
      return "Canje de recompensa";
    case "ajuste":
      return "Ajuste de puntos";
    case "bienvenida":
      return "Bono de bienvenida";
    default:
      return t;
  }
}
