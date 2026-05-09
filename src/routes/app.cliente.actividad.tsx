import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/app/cliente/actividad")({
  head: () => ({ meta: [{ title: "Actividad — BISOU" }] }),
  component: ActividadPage,
});

interface Tx {
  id: string;
  tipo: string;
  puntos: number;
  descripcion: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

function ActividadPage() {
  const { profile } = useAuth();
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    async (userId: string, from: number) => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, tipo, puntos, descripcion, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) return { rows: [] as Tx[], more: false };
      const rows = (data ?? []) as Tx[];
      return { rows, more: rows.length === PAGE_SIZE };
    },
    [],
  );

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    void (async () => {
      const { rows, more } = await fetchPage(profile.id, 0);
      if (!active) return;
      setTxs(rows);
      setHasMore(more);
    })();
    return () => {
      active = false;
    };
  }, [profile?.id, fetchPage]);

  const loadMore = async () => {
    if (!profile?.id || !txs || loadingMore) return;
    setLoadingMore(true);
    try {
      const { rows, more } = await fetchPage(profile.id, txs.length);
      setTxs([...txs, ...rows]);
      setHasMore(more);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4 p-5">
      <header>
        <h1 className="font-display text-3xl text-foreground">Actividad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu historial completo de puntos
        </p>
      </header>

      {txs === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <EmptyState
          title="Sin actividad aún"
          description="Tus transacciones aparecerán aquí."
        />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden border border-border bg-card">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
                    t.puntos >= 0
                      ? "border-emerald-500 text-emerald-400"
                      : "border-rose-500 text-rose-400"
                  }`}
                >
                  {t.puntos >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {t.descripcion ?? labelForTipo(t.tipo)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("es-NI", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`font-display text-sm font-semibold ${
                    t.puntos >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {t.puntos >= 0 ? "+" : ""}
                  {t.puntos}
                </span>
              </li>
            ))}
          </ul>

          {hasMore && (
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="h-11 w-full"
            >
              {loadingMore ? "Cargando..." : "Ver más"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function labelForTipo(t: string): string {
  switch (t) {
    case "suma":
      return "Puntos acumulados";
    case "canje":
      return "Canje de recompensa";
    case "ajuste":
      return "Ajuste de puntos";
    case "bienvenida":
      return "Bono de bienvenida";
    default:
      return t;
  }
}
