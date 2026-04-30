import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
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
import { compressImage } from "@/lib/compress-image";
import {
  formatCordoba,
  type MenuCategoria,
  type MenuItem,
  type MenuItemOpcion,
} from "@/lib/db-extra-types";

export const Route = createFileRoute("/app/admin/menu")({
  head: () => ({ meta: [{ title: "Menú — Admin BISOU" }] }),
  component: AdminMenuPage,
});

const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

function AdminMenuPage() {
  const [cats, setCats] = useState<MenuCategoria[] | null>(null);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [opciones, setOpciones] = useState<MenuItemOpcion[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);

  const [editingCat, setEditingCat] = useState<Partial<MenuCategoria> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [editingOpcion, setEditingOpcion] = useState<Partial<MenuItemOpcion> | null>(null);

  const load = async () => {
    const [c, i, o] = await Promise.all([
      db.from("menu_categorias").select("*").order("orden", { ascending: true }),
      db.from("menu_items").select("*"),
      db.from("menu_item_opciones").select("*"),
    ]);
    setCats((c.data ?? []) as unknown as MenuCategoria[]);
    setItems((i.data ?? []) as unknown as MenuItem[]);
    setOpciones((o.data ?? []) as unknown as MenuItemOpcion[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const itemsByCat = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    (items ?? []).forEach((i) => {
      const a = map.get(i.categoria_id) ?? [];
      a.push(i);
      map.set(i.categoria_id, a);
    });
    return map;
  }, [items]);

  const opcionesByItem = useMemo(() => {
    const map = new Map<string, MenuItemOpcion[]>();
    opciones.forEach((o) => {
      const a = map.get(o.item_id) ?? [];
      a.push(o);
      map.set(o.item_id, a);
    });
    return map;
  }, [opciones]);

  const toggleCat = async (c: MenuCategoria) => {
    const { error } = await db
      .from("menu_categorias")
      .update({ activa: !c.activa })
      .eq("id", c.id);
    if (error) return toast.error("No se pudo actualizar");
    await load();
  };

  const toggleItem = async (i: MenuItem) => {
    const { error } = await db.from("menu_items").update({ activo: !i.activo }).eq("id", i.id);
    if (error) return toast.error("No se pudo actualizar");
    await load();
  };

  const saveCat = async () => {
    if (!editingCat?.nombre) return toast.error("Nombre requerido");
    const payload = {
      nombre: editingCat.nombre,
      orden: editingCat.orden ?? 0,
      activa: editingCat.activa ?? true,
    };
    const { error } = editingCat.id
      ? await db.from("menu_categorias").update(payload).eq("id", editingCat.id)
      : await db.from("menu_categorias").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    setEditingCat(null);
    await load();
  };

  const saveItem = async () => {
    if (!editingItem?.nombre || !editingItem?.categoria_id) {
      return toast.error("Nombre y categoría requeridos");
    }
    const payload = {
      nombre: editingItem.nombre,
      descripcion: editingItem.descripcion ?? null,
      precio: Number(editingItem.precio ?? 0),
      categoria_id: editingItem.categoria_id,
      imagen_url: editingItem.imagen_url ?? null,
      activo: editingItem.activo ?? true,
    };
    const { error } = editingItem.id
      ? await db.from("menu_items").update(payload).eq("id", editingItem.id)
      : await db.from("menu_items").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    setEditingItem(null);
    await load();
  };

  const saveOpcion = async () => {
    if (!editingOpcion?.nombre || !editingOpcion?.grupo || !editingOpcion?.item_id) {
      return toast.error("Faltan datos");
    }
    const payload = {
      item_id: editingOpcion.item_id,
      grupo: editingOpcion.grupo,
      nombre: editingOpcion.nombre,
      precio_extra: Number(editingOpcion.precio_extra ?? 0),
    };
    const { error } = editingOpcion.id
      ? await db.from("menu_item_opciones").update(payload).eq("id", editingOpcion.id)
      : await db.from("menu_item_opciones").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    setEditingOpcion(null);
    await load();
  };

  const deleteOpcion = async (id: string) => {
    const { error } = await db.from("menu_item_opciones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await load();
  };

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Menú</h2>
        <Button
          onClick={() =>
            setEditingCat({ nombre: "", orden: (cats?.length ?? 0) + 1, activa: true })
          }
          className="h-9 gap-1"
        >
          <Plus className="h-4 w-4" /> Categoría
        </Button>
      </div>

      {cats === null || items === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-3">
          {cats.map((c) => {
            const open = openCat === c.id;
            const list = itemsByCat.get(c.id) ?? [];
            return (
              <div key={c.id} className="border border-border bg-card">
                <div className="flex items-center gap-2 p-3">
                  <button
                    onClick={() => setOpenCat(open ? null : c.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div>
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {list.length} items · orden {c.orden}
                      </p>
                    </div>
                  </button>
                  <Switch checked={c.activa} onCheckedChange={() => toggleCat(c)} />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingCat(c)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                {open && (
                  <div className="space-y-2 border-t border-border p-3">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditingItem({
                            categoria_id: c.id,
                            nombre: "",
                            descripcion: "",
                            precio: 0,
                            activo: true,
                          })
                        }
                        className="h-8 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Item
                      </Button>
                    </div>
                    {list.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        Sin items.
                      </p>
                    ) : (
                      list.map((it) => {
                        const ops = opcionesByItem.get(it.id) ?? [];
                        return (
                          <div key={it.id} className="border border-border p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <p className="font-medium">{it.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCordoba(it.precio)}
                                </p>
                              </div>
                              <Switch
                                checked={it.activo}
                                onCheckedChange={() => toggleItem(it)}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingItem(it)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mt-2 space-y-1 border-t border-border pt-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                  Opciones
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setEditingOpcion({
                                      item_id: it.id,
                                      grupo: "",
                                      nombre: "",
                                      precio_extra: 0,
                                    })
                                  }
                                  className="h-7 gap-1 text-xs"
                                >
                                  <Plus className="h-3 w-3" /> Opción
                                </Button>
                              </div>
                              {ops.length === 0 ? null : (
                                <ul className="space-y-1 text-xs">
                                  {ops.map((o) => (
                                    <li
                                      key={o.id}
                                      className="flex items-center justify-between"
                                    >
                                      <span className="text-muted-foreground">
                                        {o.grupo} · {o.nombre}
                                        {o.precio_extra > 0 &&
                                          ` (+${formatCordoba(o.precio_extra)})`}
                                      </span>
                                      <button
                                        onClick={() => deleteOpcion(o.id)}
                                        className="text-destructive hover:opacity-70"
                                        aria-label="Eliminar"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Categoría dialog */}
      <Dialog open={!!editingCat} onOpenChange={(o) => !o && setEditingCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCat?.id ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>
          {editingCat && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={editingCat.nombre ?? ""}
                  onChange={(e) => setEditingCat({ ...editingCat, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={editingCat.orden ?? 0}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, orden: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center justify-between border border-border p-3">
                <Label>Activa</Label>
                <Switch
                  checked={editingCat.activa ?? true}
                  onCheckedChange={(v) => setEditingCat({ ...editingCat, activa: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditingCat(null)}>
              Cancelar
            </Button>
            <Button onClick={saveCat}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingItem?.id ? "Editar item" : "Nuevo item"}
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={editingItem.categoria_id ?? undefined}
                  onValueChange={(v) => setEditingItem({ ...editingItem, categoria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cats ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={editingItem.nombre ?? ""}
                  onChange={(e) => setEditingItem({ ...editingItem, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea
                  rows={2}
                  value={editingItem.descripcion ?? ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, descripcion: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio (C$)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingItem.precio ?? 0}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, precio: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <ItemImageUploader
                itemId={editingItem.id}
                value={editingItem.imagen_url ?? null}
                onChange={(url) => setEditingItem({ ...editingItem, imagen_url: url })}
              />
              <div className="flex items-center justify-between border border-border p-3">
                <Label>Activo</Label>
                <Switch
                  checked={editingItem.activo ?? true}
                  onCheckedChange={(v) => setEditingItem({ ...editingItem, activo: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={saveItem}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opción dialog */}
      <Dialog open={!!editingOpcion} onOpenChange={(o) => !o && setEditingOpcion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingOpcion?.id ? "Editar opción" : "Nueva opción"}
            </DialogTitle>
          </DialogHeader>
          {editingOpcion && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Grupo</Label>
                <Input
                  placeholder="Ej. Tamaño, Extras"
                  value={editingOpcion.grupo ?? ""}
                  onChange={(e) =>
                    setEditingOpcion({ ...editingOpcion, grupo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input
                  value={editingOpcion.nombre ?? ""}
                  onChange={(e) =>
                    setEditingOpcion({ ...editingOpcion, nombre: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio extra (C$)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingOpcion.precio_extra ?? 0}
                  onChange={(e) =>
                    setEditingOpcion({
                      ...editingOpcion,
                      precio_extra: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditingOpcion(null)}>
              Cancelar
            </Button>
            <Button onClick={saveOpcion}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemImageUploader({
  itemId,
  value,
  onChange,
}: {
  itemId?: string;
  value: string | null;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecciona una imagen");
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 0.85);
      const path = `items/${itemId ?? `tmp-${Date.now()}`}.jpg`;
      const { error } = await supabase.storage
        .from("menu-items")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-items").getPublicUrl(path);
      onChange(`${data.publicUrl}?t=${Date.now()}`);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>Imagen</Label>
      <div className="flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden border border-border bg-muted">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center justify-center border border-border px-3 text-xs font-medium hover:border-primary">
          {uploading ? "Subiendo..." : "Elegir foto"}
          <input type="file" accept="image/*" className="hidden" onChange={handle} />
        </label>
      </div>
    </div>
  );
}
