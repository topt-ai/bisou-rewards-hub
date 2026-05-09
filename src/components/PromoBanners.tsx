import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Promocion } from "@/lib/db-extra-types";

const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

/**
 * Banner / carousel de promociones activas para el dashboard del cliente.
 * Si no hay promociones, no renderiza nada (sin placeholder).
 */
export function PromoBanners() {
  const [promos, setPromos] = useState<Promocion[] | null>(null);

  useEffect(() => {
    void (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await db
        .from("promociones")
        .select("*")
        .eq("activa", true)
        .or(`fecha_fin.is.null,fecha_fin.gt.${nowIso}`)
        .order("orden", { ascending: true });
      setPromos((data ?? []) as unknown as Promocion[]);
    })();
  }, []);

  if (!promos || promos.length === 0) return null;

  if (promos.length === 1) {
    return (
      <section>
        <BannerCard promo={promos[0]!} />
      </section>
    );
  }

  return (
    <section>
      <div
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {promos.map((p) => (
          <div key={p.id} className="w-[88%] shrink-0 snap-start">
            <BannerCard promo={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BannerCard({ promo }: { promo: Promocion }) {
  const hasImg = !!promo.imagen_url;
  return (
    <article
      className="relative w-full overflow-hidden border border-border"
      style={{ aspectRatio: "16 / 9", backgroundColor: hasImg ? undefined : "#94b1c8" }}
    >
      {hasImg && (
        <img
          src={promo.imagen_url!}
          alt={promo.titulo}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}
      {hasImg && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      )}
      <div
        className={
          "absolute inset-x-0 bottom-0 px-4 py-3 " +
          (hasImg ? "text-white" : "text-black")
        }
      >
        <h3 className="font-display text-xl leading-tight">{promo.titulo}</h3>
        {promo.descripcion && (
          <p
            className={
              "mt-1 line-clamp-2 text-xs font-light " +
              (hasImg ? "text-white/80" : "text-black/80")
            }
          >
            {promo.descripcion}
          </p>
        )}
      </div>
    </article>
  );
}
