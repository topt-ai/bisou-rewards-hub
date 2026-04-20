import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export interface CustomerProfile {
  id: string;
  nombre: string;
  email: string;
  puntos: number;
  puntos_totales: number;
}

export function CustomerCard({
  customer,
  onSuccess,
  onClose,
}: {
  customer: CustomerProfile;
  onSuccess: (newPoints: number) => void;
  onClose?: () => void;
}) {
  const { profile } = useAuth();
  const [puntos, setPuntos] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const addPoints = async () => {
    if (!profile || puntos <= 0) return;
    setLoading(true);
    try {
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: customer.id,
        cajero_id: profile.id,
        tipo: "suma",
        puntos,
        descripcion: `Compra en BISOU`,
      });
      if (txErr) throw txErr;

      const newPuntos = customer.puntos + puntos;
      const newTotales = customer.puntos_totales + puntos;
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ puntos: newPuntos, puntos_totales: newTotales })
        .eq("id", customer.id);
      if (upErr) throw upErr;

      toast.success(`✓ ${puntos} puntos agregados a ${customer.nombre.split(" ")[0]}`);
      onSuccess(newPuntos);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al agregar puntos";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h3 className="font-display text-xl text-card-foreground">{customer.nombre}</h3>
        <p className="text-xs text-muted-foreground">{customer.email}</p>
        <div className="mt-3 inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
          {customer.puntos} pts disponibles
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <Label htmlFor="puntos">Puntos a agregar</Label>
        <div className="flex gap-2">
          <Input
            id="puntos"
            type="number"
            min={1}
            value={puntos}
            onChange={(e) => setPuntos(Math.max(0, parseInt(e.target.value) || 0))}
            className="h-11"
          />
          <Button
            onClick={addPoints}
            disabled={loading || puntos <= 0}
            className="h-11 rounded-full px-6"
          >
            {loading ? "..." : "Agregar"}
          </Button>
        </div>
      </div>

      {onClose && (
        <Button variant="ghost" onClick={onClose} className="w-full">
          Cerrar
        </Button>
      )}
    </Card>
  );
}
