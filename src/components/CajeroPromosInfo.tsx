import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Promocion } from "@/lib/db-extra-types";

const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

/**
 * Compact informational list of active promotions for the cajero.
 * Shows up to 2; nothing if no active promos.
 */
export function CajeroPromosInfo() {
  const [promos, setPromos] = useState<Promocion[] | null>(null);

  useEffect(() => {
    void (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await db
        .from("promociones")
        .select("id, titulo, fecha_fin, orden, activa")
        .eq("activa", true)
        .or(`fecha_fin.is.null,fecha_fin.gt.${nowIso}`)
        .order("orden", { ascending: true })
        .limit(2);
      setPromos((data ?? []) as unknown as Promocion[]);
    })();
  }, []);

  if (!promos || promos.length === 0) return null;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("es-NI", { day: "2-digit", month: "2-digit" });

  return (
    <section className="space-y-2 border-t border-border pt-4">
      <h3
        className="font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-primary"
      >
        Promociones activas
      </h3>
      <ul className="space-y-1.5">
        {promos.map((p) => (
          <li key={p.id} className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-sm font-medium text-foreground">{p.titulo}</span>
            {p.fecha_fin && (
              <span className="font-sans text-[11px] font-light text-primary">
                Hasta: {fmt(p.fecha_fin)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
