import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/recompensas")({
  head: () => ({ meta: [{ title: "Recompensas — Admin BISOU" }] }),
  component: RecompensasAdminPage,
});

interface Recompensa {
  id: string;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number;
  activa: boolean;
}

const empty: Omit<Recompensa, "id"> = {
  nombre: "",
  descripcion: "",
  puntos_requeridos: 50,
  activa: true,
};

function RecompensasAdminPage() {
  const [items, setItems] = useState<Recompensa[] | null>(null);
  const [editing, setEditing] = useState<Partial<Recompensa> | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("recompensas")
      .select("id, nombre, descripcion, puntos_requeridos, activa")
      .order("puntos_requeridos", { ascending: true });
    setItems((data ?? []) as Recompensa[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (r: Recompensa) => {
    const { error } = await supabase
      .from("recompensas")
      .update({ activa: !r.activa })
      .eq("id", r.id);
    if (error) return toast.error("No se pudo actualizar");
    await load();
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.nombre || !editing.puntos_requeridos) {
      toast.error("Nombre y puntos requeridos");
      return;
    }
    try {
      if (editing.id) {
        const { error } = await supabase
          .from("recompensas")
          .update({
            nombre: editing.nombre,
            descripcion: editing.descripcion || null,
            puntos_requeridos: editing.puntos_requeridos,
            activa: editing.activa ?? true,
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("recompensas").insert({
          nombre: editing.nombre,
          descripcion: editing.descripcion || null,
          puntos_requeridos: editing.puntos_requeridos,
          activa: editing.activa ?? true,
        });
        if (error) throw error;
      }
      toast.success("Guardado");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Recompensas</h2>
        <Button onClick={() => setEditing({ ...empty })} className="h-9 gap-1 rounded-full">
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      {items === null ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-medium">{r.nombre}</p>
                <p className="text-xs text-muted-foreground">{r.puntos_requeridos} pts</p>
              </div>
              <Switch checked={r.activa} onCheckedChange={() => toggle(r)} />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditing(r)}
                aria-label="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing?.id ? "Editar recompensa" : "Nueva recompensa"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={editing.nombre ?? ""}
                  onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea
                  id="desc"
                  rows={2}
                  value={editing.descripcion ?? ""}
                  onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pts">Puntos requeridos</Label>
                <Input
                  id="pts"
                  type="number"
                  min={1}
                  value={editing.puntos_requeridos ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, puntos_requeridos: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="activa">Activa</Label>
                <Switch
                  id="activa"
                  checked={editing.activa ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, activa: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
