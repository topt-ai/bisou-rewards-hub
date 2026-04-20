import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Search } from "lucide-react";

export const Route = createFileRoute("/app/cajero/canje")({
  head: () => ({ meta: [{ title: "Confirmar canje — BISOU" }] }),
  component: CanjePage,
});

interface Customer {
  id: string;
  nombre: string;
  email: string;
  puntos: number;
}

interface Recompensa {
  id: string;
  nombre: string;
  puntos_requeridos: number;
}

function CanjePage() {
  const { profile } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [recompensaId, setRecompensaId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("recompensas")
      .select("id, nombre, puntos_requeridos")
      .eq("activa", true)
      .order("puntos_requeridos", { ascending: true })
      .then(({ data }) => setRecompensas(data ?? []));
  }, []);

  const search = async () => {
    const term = q.trim();
    if (term.length < 2) return;
    const like = `%${term}%`;
    const { data } = await supabase
      .from("profiles")
      .select("id, nombre, email, puntos")
      .eq("role", "cliente")
      .or(`nombre.ilike.${like},email.ilike.${like},cedula.ilike.${like}`)
      .limit(10);
    setResults((data ?? []) as Customer[]);
  };

  const confirmCanje = async () => {
    if (!profile || !selected || !recompensaId) {
      toast.error("Selecciona cliente y recompensa");
      return;
    }
    const reward = recompensas.find((r) => r.id === recompensaId);
    if (!reward) return;
    if (selected.puntos < reward.puntos_requeridos) {
      toast.error(`${selected.nombre.split(" ")[0]} no tiene puntos suficientes`);
      return;
    }
    setLoading(true);
    try {
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: selected.id,
        cajero_id: profile.id,
        tipo: "canje",
        puntos: -reward.puntos_requeridos,
        descripcion: `Canje: ${reward.nombre}`,
        recompensa_id: reward.id,
      });
      if (txErr) throw txErr;

      const { error: cnjErr } = await supabase.from("canjes").insert({
        user_id: selected.id,
        cajero_id: profile.id,
        recompensa_id: reward.id,
        puntos_usados: reward.puntos_requeridos,
      });
      if (cnjErr) throw cnjErr;

      const { error: upErr } = await supabase
        .from("profiles")
        .update({ puntos: selected.puntos - reward.puntos_requeridos })
        .eq("id", selected.id);
      if (upErr) throw upErr;

      toast.success(`✓ Canje completado: ${reward.nombre} para ${selected.nombre.split(" ")[0]}`);
      setSelected(null);
      setRecompensaId("");
      setQ("");
      setResults([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al confirmar canje";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-5">
      <Card className="space-y-3 p-5">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            1. Buscar cliente
          </Label>
          {!selected ? (
            <>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Nombre, email o cédula"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  className="h-11"
                />
                <Button onClick={search} className="h-11 rounded-full px-5">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {results.length > 0 && (
                <ul className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {results.map((r) => (
                    <li
                      key={r.id}
                      onClick={() => {
                        setSelected(r);
                        setResults([]);
                      }}
                      className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-accent/5"
                    >
                      <div>
                        <p className="text-sm font-medium">{r.nombre}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                      <span className="text-xs font-medium text-primary">{r.puntos} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/5 p-3">
              <div>
                <p className="font-medium">{selected.nombre}</p>
                <p className="text-xs text-muted-foreground">{selected.puntos} pts disponibles</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelected(null);
                  setRecompensaId("");
                }}
              >
                Cambiar
              </Button>
            </div>
          )}
        </div>

        {selected && (
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              2. Recompensa
            </Label>
            <Select value={recompensaId} onValueChange={setRecompensaId}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Selecciona una recompensa" />
              </SelectTrigger>
              <SelectContent>
                {recompensas.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nombre} — {r.puntos_requeridos} pts
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selected && recompensaId && (
          <Button
            onClick={confirmCanje}
            disabled={loading}
            className="h-12 w-full rounded-full"
          >
            {loading ? "Confirmando..." : "Confirmar canje"}
          </Button>
        )}
      </Card>
    </div>
  );
}
