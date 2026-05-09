import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { cn, capitalizeName } from "@/lib/utils";
import {
  formatCordoba,
  type Paquete,
  type UserPaquete,
} from "@/lib/db-extra-types";

export const Route = createFileRoute("/app/cajero/paquetes")({
  head: () => ({ meta: [{ title: "Paquetes — Cajero BISOU" }] }),
  component: CajeroPaquetesPage,
});

const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

interface ClientLite {
  id: string;
  nombre: string;
  email: string;
}

type Mode = "activar" | "usar";

function CajeroPaquetesPage() {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>("activar");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ClientLite[] | null>(null);
  const [client, setClient] = useState<ClientLite | null>(null);

  // Activar
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  // Usar
  const [misPaquetes, setMisPaquetes] = useState<UserPaquete[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await db
        .from("paquetes")
        .select("*")
        .eq("activo", true)
        .order("precio", { ascending: true });
      setPaquetes((data ?? []) as unknown as Paquete[]);
    })();
  }, []);

  useEffect(() => {
    if (!client || mode !== "usar") {
      setMisPaquetes(null);
      return;
    }
    void (async () => {
      const { data } = await db
        .from("user_paquetes")
        .select(
          "id, user_id, paquete_id, cajero_id, cantidad_total, cantidad_usada, fecha_vencimiento, activo, created_at, paquete:paquetes(id, nombre, descripcion, cantidad, precio, tiene_vencimiento, dias_vencimiento, item_id, activo)",
        )
        .eq("user_id", client.id)
        .eq("activo", true)
        .order("created_at", { ascending: false });
      setMisPaquetes((data ?? []) as unknown as UserPaquete[]);
    })();
  }, [client, mode]);

  const search = async () => {
    const term = q.trim();
    if (term.length < 2) return toast.error("Escribe al menos 2 caracteres");
    const like = `%${term}%`;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, email")
      .eq("role", "cliente")
      .or(`nombre.ilike.${like},email.ilike.${like},cedula.ilike.${like}`)
      .limit(20);
    if (error) return toast.error(error.message);
    setResults((data ?? []) as ClientLite[]);
  };

  const activar = async (p: Paquete) => {
    if (!client || !profile) return;
    if (busy) return;
    setBusy(true);
    try {
      const fecha = p.tiene_vencimiento && p.dias_vencimiento
        ? new Date(Date.now() + p.dias_vencimiento * 86400000).toISOString()
        : null;
      const { error } = await db.from("user_paquetes").insert({
        user_id: client.id,
        paquete_id: p.id,
        cajero_id: profile.id,
        cantidad_total: p.cantidad,
        cantidad_usada: 0,
        fecha_vencimiento: fecha,
        activo: true,
      });
      if (error) throw error;
      toast.success(`Paquete activado para ${capitalizeName(client.nombre)}`);
      setClient(null);
      setResults(null);
      setQ("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo activar");
    } finally {
      setBusy(false);
    }
  };

  const usar = async (up: UserPaquete) => {
    if (!profile || !client) return;
    if (busy) return;
    const restante = up.cantidad_total - up.cantidad_usada;
    if (restante <= 0) return toast.error("Sin usos disponibles");
    setBusy(true);
    try {
      const nuevoUsado = up.cantidad_usada + 1;
      const { error: e1 } = await db
        .from("user_paquetes")
        .update({ cantidad_usada: nuevoUsado })
        .eq("id", up.id);
      if (e1) throw e1;
      const { error: e2 } = await db.from("user_paquetes_usos").insert({
        user_paquete_id: up.id,
        cajero_id: profile.id,
      });
      if (e2) throw e2;
      const quedan = up.cantidad_total - nuevoUsado;
      toast.success(`Uso registrado. Le quedan ${quedan} al cliente.`);
      setMisPaquetes((cur) =>
        (cur ?? []).map((x) => (x.id === up.id ? { ...x, cantidad_usada: nuevoUsado } : x)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 p-5">
      <div className="flex border border-border">
        {(
          [
            { key: "activar", label: "Activar paquete" },
            { key: "usar", label: "Usar paquete" },
          ] as { key: Mode; label: string }[]
        ).map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              setClient(null);
              setResults(null);
              setQ("");
            }}
            className={cn(
              "flex-1 py-3 text-center text-xs font-medium uppercase tracking-[0.18em] transition-colors",
              mode === m.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!client ? (
        <>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre, email o cédula"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="h-11"
            />
            <Button onClick={search} className="h-11 px-4">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {results === null ? null : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            <div className="space-y-2">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setClient(r)}
                  className="flex w-full items-center justify-between border border-border bg-card p-3 text-left hover:border-primary"
                >
                  <div>
                    <p className="font-medium">{capitalizeName(r.nombre)}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between border border-border bg-card p-3">
            <div>
              <p className="font-medium">{capitalizeName(client.nombre)}</p>
              <p className="text-xs text-muted-foreground">{client.email}</p>
            </div>
            <Button variant="outline" onClick={() => setClient(null)}>
              Cambiar
            </Button>
          </div>

          {mode === "activar" ? (
            <div className="space-y-2">
              <h3 className="font-display text-lg">Selecciona un paquete</h3>
              {paquetes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay paquetes activos.
                </p>
              ) : (
                paquetes.map((p) => (
                  <div key={p.id} className="space-y-2 border border-border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center border border-primary text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.cantidad} usos · {formatCordoba(p.precio)}
                          {p.tiene_vencimiento ? ` · ${p.dias_vencimiento} días` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => activar(p)}
                      disabled={busy}
                      className="h-10 w-full"
                    >
                      Confirmar activación
                    </Button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-display text-lg">Paquetes activos</h3>
              {misPaquetes === null ? (
                <Skeleton className="h-32 w-full" />
              ) : misPaquetes.filter((u) => u.cantidad_total - u.cantidad_usada > 0).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin paquetes con usos disponibles.
                </p>
              ) : (
                misPaquetes
                  .filter((u) => u.cantidad_total - u.cantidad_usada > 0)
                  .map((up) => {
                    const restante = up.cantidad_total - up.cantidad_usada;
                    return (
                      <div key={up.id} className="space-y-2 border border-border bg-card p-3">
                        <div>
                          <p className="font-medium">{up.paquete?.nombre ?? "Paquete"}</p>
                          <p className="text-xs text-muted-foreground">
                            {restante} restantes de {up.cantidad_total}
                          </p>
                        </div>
                        <Button
                          onClick={() => usar(up)}
                          disabled={busy}
                          className="h-10 w-full"
                        >
                          Registrar uso
                        </Button>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
