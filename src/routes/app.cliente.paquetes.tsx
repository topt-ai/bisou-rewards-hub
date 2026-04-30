import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  formatCordoba,
  type Paquete,
  type UserPaquete,
} from "@/lib/db-extra-types";

export const Route = createFileRoute("/app/cliente/paquetes")({
  head: () => ({ meta: [{ title: "Paquetes — BISOU" }] }),
  component: PaquetesClientePage,
});

const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

type Tab = "disponibles" | "mios";

function PaquetesClientePage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("disponibles");
  const [disponibles, setDisponibles] = useState<Paquete[] | null>(null);
  const [mios, setMios] = useState<UserPaquete[] | null>(null);
  const [info, setInfo] = useState<Paquete | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await db
        .from("paquetes")
        .select(
          "id, nombre, descripcion, cantidad, precio, tiene_vencimiento, dias_vencimiento, item_id, activo",
        )
        .eq("activo", true)
        .order("precio", { ascending: true });
      setDisponibles((data ?? []) as unknown as Paquete[]);
    })();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    void (async () => {
      const { data } = await db
        .from("user_paquetes")
        .select(
          "id, user_id, paquete_id, cajero_id, cantidad_total, cantidad_usada, fecha_vencimiento, activo, created_at, paquete:paquetes(id, nombre, descripcion, cantidad, precio, tiene_vencimiento, dias_vencimiento, item_id, activo)",
        )
        .eq("user_id", session.user.id)
        .eq("activo", true)
        .order("created_at", { ascending: false });
      setMios((data ?? []) as unknown as UserPaquete[]);
    })();
  }, [session?.user, tab]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="px-5 pt-6 pb-3">
        <h1 className="font-display text-3xl">Paquetes</h1>
        <p className="text-sm text-muted-foreground">Compra paquetes y ahorra en cada visita</p>
      </header>

      <nav className="flex border-b border-border">
        {(
          [
            { key: "disponibles", label: "Disponibles" },
            { key: "mios", label: "Mis Paquetes" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 border-b-2 py-3 text-center text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 space-y-3 p-5">
        {tab === "disponibles" ? (
          disponibles === null ? (
            <Skeleton className="h-40 w-full" />
          ) : disponibles.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay paquetes disponibles.
            </p>
          ) : (
            disponibles.map((p) => (
              <article
                key={p.id}
                className="space-y-3 border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg">{p.nombre}</h3>
                    {p.descripcion && (
                      <p className="text-xs font-light text-muted-foreground">
                        {p.descripcion}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="font-medium">{p.cantidad} usos</span>
                  <span className="font-display text-lg text-primary">
                    {formatCordoba(p.precio)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.tiene_vencimiento && p.dias_vencimiento
                    ? `Válido por ${p.dias_vencimiento} días`
                    : "Sin fecha de vencimiento"}
                </p>
                <Button onClick={() => setInfo(p)} className="h-11 w-full">
                  Adquirir
                </Button>
              </article>
            ))
          )
        ) : mios === null ? (
          <Skeleton className="h-40 w-full" />
        ) : mios.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aún no tienes paquetes activos.
          </p>
        ) : (
          mios.map((up) => <MyPackageCard key={up.id} item={up} />)
        )}
      </div>

      <Dialog open={!!info} onOpenChange={(o) => !o && setInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">¿Cómo adquirirlo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Para adquirir este paquete, acércate a caja y solicítalo. El cajero lo activará en tu
            cuenta.
          </p>
          <DialogFooter>
            <Button onClick={() => setInfo(null)} className="h-11 w-full">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MyPackageCard({ item }: { item: UserPaquete }) {
  const restante = Math.max(0, item.cantidad_total - item.cantidad_usada);
  const pct = item.cantidad_total > 0 ? (item.cantidad_usada / item.cantidad_total) * 100 : 0;

  const venc = item.fecha_vencimiento ? new Date(item.fecha_vencimiento) : null;
  const today = new Date();
  const dias = venc
    ? Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const estado = restante <= 0 || (dias !== null && dias < 0) ? "vencido" : "activo";
  const advertencia = dias !== null && dias >= 0 && dias <= 7;

  return (
    <article className="space-y-3 border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg">{item.paquete?.nombre ?? "Paquete"}</h3>
            <p className="text-xs text-muted-foreground">
              {restante} restantes de {item.cantidad_total}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em]",
            estado === "activo"
              ? "border-primary text-primary"
              : "border-destructive text-destructive",
          )}
        >
          {estado}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {venc && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {advertencia && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          <span className={advertencia ? "text-destructive" : undefined}>
            {dias !== null && dias >= 0
              ? `Vence ${venc.toLocaleDateString("es-NI")} (${dias} días)`
              : `Venció el ${venc.toLocaleDateString("es-NI")}`}
          </span>
        </div>
      )}
    </article>
  );
}
