import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerCard, type CustomerProfile } from "@/components/CustomerCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/app/cajero/buscar")({
  head: () => ({ meta: [{ title: "Buscar cliente — BISOU" }] }),
  component: BuscarPage,
});

function BuscarPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CustomerProfile[] | null>(null);
  const [selected, setSelected] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const term = q.trim();
    if (term.length < 2) {
      toast.error("Escribe al menos 2 caracteres");
      return;
    }
    setLoading(true);
    try {
      const like = `%${term}%`;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nombre, email, puntos, puntos_totales, cedula, role, avatar_url")
        .eq("role", "cliente")
        .or(`nombre.ilike.${like},email.ilike.${like},cedula.ilike.${like}`)
        .limit(20);
      if (error) throw error;
      setResults((data ?? []) as CustomerProfile[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al buscar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (selected) {
    return (
      <div className="space-y-4 p-5">
        <CustomerCard
          customer={selected}
          onSuccess={(np) => setSelected({ ...selected, puntos: np })}
          onClose={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex gap-2">
        <Input
          placeholder="Nombre, email o cédula"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="h-11"
        />
        <Button onClick={search} disabled={loading} className="h-11 gap-1 rounded-full px-5">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {results === null ? null : results.length === 0 ? (
        <EmptyState title="Sin resultados" description="Prueba con otro término." />
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <Card
              key={r.id}
              role="button"
              onClick={() => setSelected(r)}
              className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-accent/5"
            >
              <div>
                <p className="font-medium text-card-foreground">{r.nombre}</p>
                <p className="text-xs text-muted-foreground">{r.email}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {r.puntos} pts
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
