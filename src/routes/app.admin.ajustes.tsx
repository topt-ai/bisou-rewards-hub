import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";

export const Route = createFileRoute("/app/admin/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes — Admin BISOU" }] }),
  component: AjustesPage,
});

interface Cajero {
  id: string;
  nombre: string;
  email: string;
}

function AjustesPage() {
  const [cajeros, setCajeros] = useState<Cajero[] | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nombre, email")
      .eq("role", "cajero")
      .order("nombre");
    setCajeros((data ?? []) as Cajero[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const promote = async () => {
    const term = email.trim();
    if (!term) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("email", term)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("Usuario no encontrado");
        return;
      }
      if (data.role === "cajero") {
        toast.error("Ya es cajero");
        return;
      }
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ role: "cajero" })
        .eq("id", data.id);
      if (upErr) throw upErr;
      toast.success("Promovido a cajero");
      setEmail("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const demote = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ role: "cliente" }).eq("id", id);
    if (error) return toast.error("No se pudo actualizar");
    toast.success("Cajero degradado a cliente");
    await load();
  };

  return (
    <div className="space-y-4 p-5">
      <h2 className="font-display text-xl">Cajeros</h2>

      <Card className="space-y-2 p-4">
        <Label htmlFor="email">Promover cliente a cajero (por email)</Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
          />
          <Button onClick={promote} disabled={loading} className="h-10 rounded-full px-5">
            Promover
          </Button>
        </div>
      </Card>

      {cajeros === null ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {cajeros.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">Sin cajeros</li>
            )}
            {cajeros.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{c.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">{c.email}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => demote(c.id)}
                  aria-label="Degradar"
                >
                  <UserMinus className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">BISOU App</p>
        <p>Versión 1.0 · Programa de lealtad</p>
        <p className="mt-1">Managua, Nicaragua</p>
      </Card>
    </div>
  );
}
