import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { Gift } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cliente/recompensas")({
  head: () => ({ meta: [{ title: "Recompensas — BISOU" }] }),
  component: RecompensasPage,
});

interface Recompensa {
  id: string;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number;
  imagen_url: string | null;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function RecompensasPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Recompensa[] | null>(null);
  const [confirm, setConfirm] = useState<Recompensa | null>(null);
  const [code, setCode] = useState<{ recompensa: string; code: string } | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("recompensas")
      .select("id, nombre, descripcion, puntos_requeridos, imagen_url")
      .eq("activa", true)
      .order("puntos_requeridos", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error("No se pudo cargar recompensas");
        setItems(data ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleConfirm = () => {
    if (!confirm) return;
    setCode({ recompensa: confirm.nombre, code: genCode() });
    setConfirm(null);
  };

  const puntos = profile?.puntos ?? 0;

  return (
    <div className="space-y-5 p-5">
      <header>
        <h1 className="font-display text-3xl text-foreground">Canjea tus puntos</h1>
        <span className="mt-3 inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
          {puntos} pts disponibles
        </span>
      </header>

      {items === null ? (
        <div className="grid gap-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-8 w-8" />}
          title="Sin recompensas activas"
          description="Pronto añadiremos nuevas recompensas."
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const enough = puntos >= r.puntos_requeridos;
            const missing = r.puntos_requeridos - puntos;
            return (
              <Card key={r.id} className="overflow-hidden p-0">
                <div className="flex gap-4 p-4">
                  {r.imagen_url ? (
                    <img
                      src={r.imagen_url}
                      alt={r.nombre}
                      loading="lazy"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Gift className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-display text-lg leading-tight text-card-foreground">
                        {r.nombre}
                      </h3>
                      {r.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {r.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                        {r.puntos_requeridos} pts
                      </span>
                      <Button
                        size="sm"
                        disabled={!enough}
                        onClick={() => setConfirm(r)}
                        className="h-8 rounded-full px-4 text-xs"
                        variant={enough ? "default" : "secondary"}
                      >
                        {enough ? "Canjear" : `Te faltan ${missing} pts`}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Confirmar canje</DialogTitle>
            <DialogDescription>
              ¿Canjear <span className="font-medium text-foreground">{confirm?.nombre}</span> por{" "}
              <span className="font-medium text-foreground">{confirm?.puntos_requeridos} puntos</span>?
              <br />
              <br />
              Te daremos un código para mostrar al cajero. Los puntos se descontarán cuando el cajero
              confirme el canje.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>Sí, canjear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!code} onOpenChange={(o) => !o && setCode(null)}>
        <DialogContent className="rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Código de canje</DialogTitle>
            <DialogDescription>
              Muestra este código al cajero para completar el canje de{" "}
              <span className="font-medium text-foreground">{code?.recompensa}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-2xl bg-primary/5 p-6">
            <p className="font-display text-5xl font-bold tracking-[0.2em] text-primary">
              {code?.code}
            </p>
          </div>
          <Button onClick={() => setCode(null)} className="rounded-full">
            Listo
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
