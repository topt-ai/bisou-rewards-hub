import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCordoba, type Paquete, type MenuItem } from "@/lib/db-extra-types";

export const Route = createFileRoute("/app/admin/paquetes")({
  head: () => ({ meta: [{ title: "Paquetes — Admin BISOU" }] }),
  component: AdminPaquetesPage,
});

const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

const empty: Partial<Paquete> = {
  nombre: "",
  descripcion: "",
  cantidad: 10,
  precio: 0,
  tiene_vencimiento: false,
  dias_vencimiento: 30,
  item_id: null,
  activo: true,
};

function AdminPaquetesPage() {
  const [items, setItems] = useState<Paquete[] | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editing, setEditing] = useState<Partial<Paquete> | null>(null);

  const load = async () => {
    const [p, mi] = await Promise.all([
      db.from("paquetes").select("*").order("created_at", { ascending: false }),
      db.from("menu_items").select("id, nombre, categoria_id, descripcion, precio, imagen_url, activo"),
    ]);
    setItems((p.data ?? []) as unknown as Paquete[]);
    setMenuItems((mi.data ?? []) as unknown as MenuItem[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (p: Paquete) => {
    const { error } = await db.from("paquetes").update({ activo: !p.activo }).eq("id", p.id);
    if (error) return toast.error("No se pudo actualizar");
    await load();
  };

  const save = async () => {
    if (!editing?.nombre || !editing?.cantidad || editing?.precio == null) {
      return toast.error("Nombre, cantidad y precio requeridos");
    }
    const payload = {
      nombre: editing.nombre,
      descripcion: editing.descripcion ?? null,
      cantidad: Number(editing.cantidad),
      precio: Number(editing.precio),
      tiene_vencimiento: editing.tiene_vencimiento ?? false,
      dias_vencimiento: editing.tiene_vencimiento ? Number(editing.dias_vencimiento ?? 30) : null,
      item_id: editing.item_id ?? null,
      activo: editing.activo ?? true,
    };
    const { error } = editing.id
      ? await db.from("paquetes").update(payload).eq("id", editing.id)
      : await db.from("paquetes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    setEditing(null);
    await load();
  };

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Paquetes</h2>
        <Button onClick={() => setEditing({ ...empty })} className="h-9 gap-1">
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      {items === null ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Sin paquetes.</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.cantidad} usos · {formatCordoba(p.precio)}
                    {p.tiene_vencimiento ? ` · ${p.dias_vencimiento} días` : " · sin vencimiento"}
                  </p>
                </div>
                <Switch checked={p.activo} onCheckedChange={() => toggle(p)} />
                <Button size="icon" variant="ghost" onClick={() => setEditing(p)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing?.id ? "Editar paquete" : "Nuevo paquete"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={editing.nombre ?? ""}
                  onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea
                  rows={2}
                  value={editing.descripcion ?? ""}
                  onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.cantidad ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, cantidad: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Precio (C$)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.precio ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, precio: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Item asociado (opcional)</Label>
                <Select
                  value={editing.item_id ?? "none"}
                  onValueChange={(v) =>
                    setEditing({ ...editing, item_id: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {menuItems.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border border-border p-3">
                <Label>Tiene vencimiento</Label>
                <Switch
                  checked={editing.tiene_vencimiento ?? false}
                  onCheckedChange={(v) => setEditing({ ...editing, tiene_vencimiento: v })}
                />
              </div>
              {editing.tiene_vencimiento && (
                <div className="space-y-1.5">
                  <Label>Días de vencimiento</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.dias_vencimiento ?? 30}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        dias_vencimiento: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}
              <div className="flex items-center justify-between border border-border p-3">
                <Label>Activo</Label>
                <Switch
                  checked={editing.activo ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, activo: v })}
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
