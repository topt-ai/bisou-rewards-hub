import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Gift, Award } from "lucide-react";

export const Route = createFileRoute("/app/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Admin BISOU" }] }),
  component: DashboardPage,
});

interface Stats {
  clientes: number;
  puntosHoy: number;
  canjesHoy: number;
  puntosTotal: number;
}

interface RecentTx {
  id: string;
  tipo: string;
  puntos: number;
  created_at: string;
  user_id: string;
  cajero_id: string | null;
}

function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [txs, setTxs] = useState<RecentTx[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const iso = todayStart.toISOString();

    const fetchDashboard = async () => {
      const [c, ph, ch, pt, recent] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "cliente"),
        supabase
          .from("transactions")
          .select("puntos")
          .eq("tipo", "suma")
          .gte("created_at", iso),
        supabase
          .from("canjes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", iso),
        supabase.from("transactions").select("puntos").eq("tipo", "suma"),
        supabase
          .from("transactions")
          .select("id, tipo, puntos, created_at, user_id, cajero_id")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const sum = (rows: { puntos: number }[] | null) =>
        (rows ?? []).reduce((a, r) => a + r.puntos, 0);

      if (!mounted) return;
      setStats({
        clientes: c.count ?? 0,
        puntosHoy: sum(ph.data),
        canjesHoy: ch.count ?? 0,
        puntosTotal: sum(pt.data),
      });
      setTxs((recent.data ?? []) as RecentTx[]);

      // Resolve names for users + cajeros
      const ids = new Set<string>();
      (recent.data ?? []).forEach((t) => {
        ids.add(t.user_id);
        if (t.cajero_id) ids.add(t.cajero_id);
      });
      if (ids.size) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, nombre")
          .in("id", Array.from(ids));
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p) => (map[p.id] = p.nombre));
        setNames(map);
      }
    };

    void fetchDashboard();

    const channel = supabase
      .channel("admin-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => void fetchDashboard(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => void fetchDashboard(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "canjes" },
        () => void fetchDashboard(),
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-5 p-5">
      <h1 className="font-display text-2xl text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Clientes"
          value={stats?.clientes}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Puntos hoy"
          value={stats?.puntosHoy}
        />
        <StatCard
          icon={<Gift className="h-5 w-5" />}
          label="Canjes hoy"
          value={stats?.canjesHoy}
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Puntos lifetime"
          value={stats?.puntosTotal}
        />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg">Transacciones recientes</h2>
        {txs === null ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-border text-sm">
              {txs.length === 0 && (
                <li className="px-4 py-6 text-center text-muted-foreground">Sin transacciones</li>
              )}
              {txs.map((t) => (
                <li key={t.id} className="grid grid-cols-[1fr_auto] gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{names[t.user_id] ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.tipo} · {t.cajero_id ? `por ${names[t.cajero_id] ?? "—"}` : "auto"} ·{" "}
                      {new Date(t.created_at).toLocaleString("es-NI", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-right font-display text-base font-semibold ${
                      t.puntos >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {t.puntos >= 0 ? "+" : ""}
                    {t.puntos}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">
        {value === undefined ? <Skeleton className="h-7 w-12" /> : value}
      </p>
    </Card>
  );
}
