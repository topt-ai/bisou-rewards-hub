import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Admin BISOU" }] }),
  component: ClientesAdminPage,
});

interface ProfileRow {
  id: string;
  nombre: string;
  email: string;
  puntos: number;
  puntos_totales: number;
  role: string;
  activo: boolean;
  avatar_url: string | null;
  created_at: string;
}

interface Tx {
  id: string;
  tipo: string;
  puntos: number;
  descripcion: string | null;
  created_at: string;
}

function ClientesAdminPage() {
  const { profile: me } = useAuth();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProfileRow[] | null>(null);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [history, setHistory] = useState<Tx[] | null>(null);
  const [adjust, setAdjust] = useState({ puntos: 0, descripcion: "" });
  const [newRole, setNewRole] = useState<string>("cliente");

  const load = async () => {
    setRows(null);
    let query = supabase
      .from("profiles")
      .select("id, nombre, email, puntos, puntos_totales, role, activo, avatar_url, created_at")
      .eq("role", "cliente")
      .order("created_at", { ascending: false })
      .limit(100);
    const term = q.trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(`nombre.ilike.${like},email.ilike.${like},cedula.ilike.${like}`);
    }
    const { data } = await query;
    setRows((data ?? []) as ProfileRow[]);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (row: ProfileRow) => {
    setSelected(row);
    setNewRole(row.role);
    setHistory(null);
    const { data } = await supabase
      .from("transactions")
      .select("id, tipo, puntos, descripcion, created_at")
      .eq("user_id", row.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data ?? []) as Tx[]);
  };

  const applyAdjust = async () => {
    if (!selected || !me || adjust.puntos === 0) return;
    try {
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: selected.id,
        cajero_id: me.id,
        tipo: "ajuste",
        puntos: adjust.puntos,
        descripcion: adjust.descripcion || "Ajuste manual",
      });
      if (txErr) throw txErr;

      const newPuntos = selected.puntos + adjust.puntos;
      const newTotales =
        adjust.puntos > 0 ? selected.puntos_totales + adjust.puntos : selected.puntos_totales;
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ puntos: Math.max(0, newPuntos), puntos_totales: newTotales })
        .eq("id", selected.id);
      if (upErr) throw upErr;

      toast.success("Ajuste aplicado");
      setSelected({ ...selected, puntos: Math.max(0, newPuntos), puntos_totales: newTotales });
      setAdjust({ puntos: 0, descripcion: "" });
      await load();
      await openDetail({ ...selected, puntos: Math.max(0, newPuntos), puntos_totales: newTotales });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const toggleActivo = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("profiles")
      .update({ activo: !selected.activo })
      .eq("id", selected.id);
    if (error) return toast.error("No se pudo actualizar");
    setSelected({ ...selected, activo: !selected.activo });
    toast.success("Estado actualizado");
    await load();
  };

  const changeRole = async () => {
    if (!selected || newRole === selected.role) return;
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", selected.id);
    if (error) return toast.error("No se pudo cambiar el rol");
    toast.success(`Rol actualizado a ${newRole}`);
    setSelected({ ...selected, role: newRole });
    await load();
  };

  return (
    <div className="space-y-4 p-5">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre, email, cédula"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="h-11"
        />
        <Button onClick={load} className="h-11 rounded-full px-5">
          Buscar
        </Button>
      </div>

      {rows === null ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border text-sm">
            {rows.length === 0 && (
              <li className="px-4 py-6 text-center text-muted-foreground">Sin clientes</li>
            )}
            {rows.map((r) => (
              <li
                key={r.id}
                onClick={() => openDetail(r)}
                className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-accent/5"
              >
                {r.avatar_url ? (
                  <img
                    src={r.avatar_url}
                    alt={r.nombre}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {r.nombre
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("")}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.nombre}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{r.email}</p>
                </div>
                <span className="self-center text-xs font-medium text-primary">{r.puntos} pts</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selected.nombre}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-primary/5 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="truncate font-medium">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Puntos</p>
                    <p className="font-medium">
                      {selected.puntos} / {selected.puntos_totales}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="activo">Cuenta activa</Label>
                  <Switch id="activo" checked={selected.activo} onCheckedChange={toggleActivo} />
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <Label>Rol</Label>
                  <div className="flex gap-2">
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="cajero">Cajero</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={changeRole}
                      disabled={newRole === selected.role}
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <Label>Ajuste manual de puntos</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="±puntos"
                      value={adjust.puntos || ""}
                      onChange={(e) =>
                        setAdjust((a) => ({ ...a, puntos: parseInt(e.target.value) || 0 }))
                      }
                      className="h-9 w-24"
                    />
                    <Input
                      placeholder="Razón"
                      value={adjust.descripcion}
                      onChange={(e) => setAdjust((a) => ({ ...a, descripcion: e.target.value }))}
                      className="h-9 flex-1"
                    />
                    <Button size="sm" onClick={applyAdjust} disabled={adjust.puntos === 0}>
                      Aplicar
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Historial reciente
                  </Label>
                  {history === null ? (
                    <Skeleton className="mt-2 h-32 w-full" />
                  ) : (
                    <ul className="mt-2 max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border text-xs">
                      {history.length === 0 && (
                        <li className="px-3 py-2 text-muted-foreground">Sin transacciones</li>
                      )}
                      {history.map((t) => (
                        <li key={t.id} className="flex items-center justify-between px-3 py-2">
                          <span className="truncate">
                            {t.descripcion ?? t.tipo} ·{" "}
                            {new Date(t.created_at).toLocaleDateString("es-NI")}
                          </span>
                          <span
                            className={
                              t.puntos >= 0
                                ? "font-medium text-emerald-700"
                                : "font-medium text-rose-700"
                            }
                          >
                            {t.puntos > 0 ? "+" : ""}
                            {t.puntos}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
