import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { compressImage } from "@/lib/compress-image";
import type { Promocion } from "@/lib/db-extra-types";

export const Route = createFileRoute("/app/admin/promociones")({
  head: () => ({ meta: [{ title: "Promociones — Admin BISOU" }] }),
  component: AdminPromocionesPage,
});

const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

const today = () => new Date().toISOString().slice(0, 10);

const empty: Partial<Promocion> = {
  titulo: "",
  descripcion: "",
  imagen_url: null,
  activa: true,
  fecha_inicio: today(),
  fecha_fin: null,
  orden: 0,
};

function AdminPromocionesPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Promocion[] | null>(null);
  const [editing, setEditing] = useState<Partial<Promocion> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Promocion | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await db
      .from("promociones")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data ?? []) as unknown as Promocion[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleActiva = async (p: Promocion) => {
    const { error } = await db.from("promociones").update({ activa: !p.activa }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await load();
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editing) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecciona una imagen");
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1600, 0.85);
      const filename = `${(globalThis.crypto as Crypto).randomUUID()}.jpg`;
      const path = `promociones/${filename}`;
      const { error } = await supabase.storage
        .from("promociones")
        .upload(path, compressed, { upsert: false, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("promociones").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setEditing({ ...editing, imagen_url: url });
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing?.titulo) return toast.error("Título requerido");
    setSaving(true);
    try {
      const payload = {
        titulo: editing.titulo,
        descripcion: editing.descripcion ?? null,
        imagen_url: editing.imagen_url ?? null,
        activa: editing.activa ?? true,
        fecha_inicio: editing.fecha_inicio || null,
        fecha_fin: editing.fecha_fin || null,
        orden: Number(editing.orden ?? 0),
      };
      const { error } = editing.id
        ? await db.from("promociones").update(payload).eq("id", editing.id)
        : await db.from("promociones").insert({
            ...payload,
            created_by: profile?.id ?? null,
          });
      if (error) throw error;
      toast.success("Guardado");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const { error } = await db.from("promociones").delete().eq("id", confirmDelete.id);
    if (error) return toast.error(error.message);
    toast.success("Promoción eliminada");
    setConfirmDelete(null);
    await load();
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("es-NI", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Promociones</h2>
        <Button onClick={() => setEditing({ ...empty })} className="h-9 gap-1">
          <Plus className="h-4 w-4" /> Nueva Promoción
        </Button>
      </div>

      {items === null ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Aún no hay promociones. Crea la primera con el botón de arriba.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border border-border bg-card p-3">
              <div
                className="h-16 w-24 shrink-0 overflow-hidden border border-border bg-muted"
                style={{ aspectRatio: "16 / 9" }}
              >
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {fmtDate(p.fecha_inicio)} → {p.fecha_fin ? fmtDate(p.fecha_fin) : "sin vencimiento"}
                </p>
                <p className="text-[11px] text-muted-foreground">orden {p.orden}</p>
              </div>
              <Switch checked={p.activa} onCheckedChange={() => toggleActiva(p)} />
              <Button size="icon" variant="ghost" onClick={() => setEditing(p)} aria-label="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setConfirmDelete(p)}
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Edit / create dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing?.id ? "Editar promoción" : "Nueva promoción"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={editing.titulo ?? ""}
                  onChange={(e) => setEditing({ ...editing, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea
                  rows={3}
                  value={editing.descripcion ?? ""}
                  onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Imagen</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-20 w-32 shrink-0 overflow-hidden border border-border bg-muted"
                    style={{ aspectRatio: "16 / 9" }}
                  >
                    {editing.imagen_url ? (
                      <img
                        src={editing.imagen_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <label className="inline-flex h-9 cursor-pointer items-center justify-center border border-border px-3 text-xs font-medium hover:border-primary">
                    {uploading ? "Subiendo..." : "Elegir foto"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImage}
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={editing.fecha_inicio ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, fecha_inicio: e.target.value || null })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha fin (opcional)</Label>
                  <Input
                    type="date"
                    value={editing.fecha_fin ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, fecha_fin: e.target.value || null })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Orden (menor = aparece primero)</Label>
                <Input
                  type="number"
                  value={editing.orden ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, orden: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center justify-between border border-border p-3">
                <Label>Activa</Label>
                <Switch
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
            <Button onClick={save} disabled={saving || uploading}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Eliminar promoción</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar "{confirmDelete?.titulo}"? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
