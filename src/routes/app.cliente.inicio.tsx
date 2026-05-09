import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Cake } from "lucide-react";
import { PromoBanners } from "@/components/PromoBanners";
import { capitalizeName } from "@/lib/utils";

export const Route = createFileRoute("/app/cliente/inicio")({
  head: () => ({ meta: [{ title: "Inicio — BISOU" }] }),
  component: InicioPage,
});

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
  const [liveProfile, setLiveProfile] = useState(profile);
  const [nextReward, setNextReward] = useState<NextReward | null>(null);

  useEffect(() => {
    setLiveProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!liveProfile) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("recompensas")
        .select("nombre, puntos_requeridos")
        .eq("activa", true)
        .gt("puntos_requeridos", liveProfile.puntos)
        .order("puntos_requeridos", { ascending: true })
        .limit(1);
      if (!active) return;
      setNextReward(data?.[0] ?? null);
    })();
    return () => {
      active = false;
    };
  }, [liveProfile?.id, liveProfile?.puntos]);

  useEffect(() => {
    if (!liveProfile?.id) return;
    const channel = supabase
      .channel(`puntos-updates-${liveProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${liveProfile.id}`,
        },
        (payload) => {
          if (payload.new) {
            setLiveProfile(payload.new as typeof liveProfile);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [liveProfile?.id]);

  if (authLoading || !liveProfile) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const firstName = capitalizeName(liveProfile.nombre.split(" ")[0]);
  const progress = nextReward
    ? Math.min(100, Math.round((liveProfile.puntos / nextReward.puntos_requeridos) * 100))
    : 100;
  const remaining = nextReward ? Math.max(0, nextReward.puntos_requeridos - liveProfile.puntos) : 0;

  return (
    <div className="space-y-5 p-5">
      <header>
        <h1 className="font-display text-3xl text-foreground">Hola, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bienvenido a tu BISOU</p>
      </header>

      <PromoBanners />

      {isBirthday(liveProfile.fecha_nacimiento) && (
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
          <span className="font-display text-6xl font-semibold leading-none">{liveProfile.puntos}</span>
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
            <p className="mt-0.5 font-display text-lg">{liveProfile.puntos_totales}</p>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/60">Miembro desde</p>
            <p className="mt-0.5 font-display text-lg">
              {new Date(liveProfile.created_at).toLocaleDateString("es-NI", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
}
