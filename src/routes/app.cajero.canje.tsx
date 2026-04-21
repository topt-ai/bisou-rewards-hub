import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrScannerCard } from "@/components/QrScannerCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/app/cajero/canje")({
  head: () => ({ meta: [{ title: "Confirmar canje — BISOU" }] }),
  component: CanjePage,
});

interface Customer {
  id: string;
  nombre: string;
  email: string;
  puntos: number;
  avatar_url: string | null;
}

interface Recompensa {
  id: string;
  nombre: string;
  puntos_requeridos: number;
}

function CanjePage() {
  const { profile } = useAuth();
  const [selected, setSelected] = useState<Customer | null>(null);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [selectedReward, setSelectedReward] = useState<Recompensa | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("recompensas")
      .select("id, nombre, puntos_requeridos")
      .eq("activa", true)
      .order("puntos_requeridos", { ascending: true })
      .then(({ data }) => setRecompensas(data ?? []));
  }, []);

  const lookupByQr = async (uuid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, email, puntos, avatar_url, role")
      .eq("id", uuid)
      .maybeSingle();
    if (error || !data || data.role !== "cliente") {
      toast.error("Cliente no encontrado");
      return;
    }
    setSelected(data as Customer);
    setSelectedReward(null);
  };

  const recompensasDisponibles = useMemo(
    () => recompensas.filter((r) => !!selected && selected.puntos >= r.puntos_requeridos),
    [recompensas, selected],
  );

  const confirmCanje = async (reward: Recompensa) => {
    if (!profile || !selected) {
      toast.error("Selecciona cliente y recompensa");
      return;
    }
    if (selected.puntos < reward.puntos_requeridos) {
      toast.error(`${selected.nombre.split(" ")[0]} no tiene puntos suficientes`);
      return;
    }
    setLoading(true);
    try {
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: selected.id,
        cajero_id: profile.id,
        tipo: "canje",
        puntos: -reward.puntos_requeridos,
        descripcion: `Canje: ${reward.nombre}`,
        recompensa_id: reward.id,
      });
      if (txErr) throw txErr;

      const { error: cnjErr } = await supabase.from("canjes").insert({
        user_id: selected.id,
        cajero_id: profile.id,
        recompensa_id: reward.id,
        puntos_usados: reward.puntos_requeridos,
      });
      if (cnjErr) throw cnjErr;

      const { error: upErr } = await supabase
        .from("profiles")
        .update({ puntos: selected.puntos - reward.puntos_requeridos })
        .eq("id", selected.id);
      if (upErr) throw upErr;

      toast.success(`✓ Canje completado: ${reward.nombre} para ${selected.nombre.split(" ")[0]}`);
      setSelected(null);
      setSelectedReward(null);
      setConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al confirmar canje";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-5">
      {!selected ? (
        <QrScannerCard
          onDecoded={lookupByQr}
          title="Escanear para canjear"
          description="Escanea el QR del cliente para continuar con el canje."
        />
      ) : (
        <Card className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3 rounded-lg bg-primary/5 p-3">
            <div className="flex min-w-0 items-center gap-3">
              {selected.avatar_url ? (
                <img
                  src={selected.avatar_url}
                  alt={selected.nombre}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">
                  {selected.nombre
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{selected.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{selected.email}</p>
                <p className="text-xs font-medium text-primary">{selected.puntos} pts disponibles</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Escanear otro
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Recompensas disponibles
            </p>
            {recompensasDisponibles.length === 0 ? (
              <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                Este cliente no tiene puntos suficientes para recompensas activas.
              </p>
            ) : (
              <div className="space-y-2">
                {recompensasDisponibles.map((r) => (
                  <Button
                    key={r.id}
                    variant="outline"
                    className="h-11 w-full justify-between"
                    onClick={() => {
                      setSelectedReward(r);
                      setConfirmOpen(true);
                    }}
                  >
                    <span>{r.nombre}</span>
                    <span>{r.puntos_requeridos} pts</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Confirmar canje</DialogTitle>
            <DialogDescription>
              ¿Canjear <span className="font-medium text-foreground">{selectedReward?.nombre}</span>{" "}
              para <span className="font-medium text-foreground">{selected?.nombre}</span>? Se
              descontarán{" "}
              <span className="font-medium text-foreground">
                {selectedReward?.puntos_requeridos ?? 0} puntos
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={loading || !selectedReward}
              onClick={() => selectedReward && confirmCanje(selectedReward)}
            >
              {loading ? "Confirmando..." : "Confirmar canje"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
