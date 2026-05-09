import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
  const [open, setOpen] = useState<Promocion | null>(null);

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

  return (
    <section className="space-y-2">
      <h2 className="font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-primary">
        Promociones
      </h2>

      {promos.length === 1 ? (
        <BannerCard promo={promos[0]!} onClick={() => setOpen(promos[0]!)} />
      ) : (
        <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {promos.map((p) => (
            <div key={p.id} className="w-[88%] shrink-0 snap-start">
              <BannerCard promo={p} onClick={() => setOpen(p)} />
            </div>
          ))}
        </div>
      )}

      {open && <PromoModal promo={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function BannerCard({ promo, onClick }: { promo: Promocion; onClick: () => void }) {
  const hasImg = !!promo.imagen_url;
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative block w-full overflow-hidden border border-border text-left transition-opacity active:opacity-80"
      style={{ aspectRatio: "16 / 9", backgroundColor: hasImg ? undefined : "#94b1c8" }}
      aria-label={`Ver promoción: ${promo.titulo}`}
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
    </button>
  );
}

function PromoModal({ promo, onClose }: { promo: Promocion; onClose: () => void }) {
  // Cierra con Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={promo.titulo}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-border bg-black/60 text-white"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="flex max-h-full w-full max-w-[480px] flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {promo.imagen_url ? (
          <img
            src={promo.imagen_url}
            alt={promo.titulo}
            className="max-h-[70vh] w-auto max-w-full object-contain"
          />
        ) : (
          <div
            className="flex w-full items-center justify-center px-6 py-16"
            style={{ backgroundColor: "#94b1c8", aspectRatio: "16 / 9" }}
          >
            <span className="font-display text-2xl text-black">{promo.titulo}</span>
          </div>
        )}

        <div className="w-full px-2 text-center">
          <h3 className="font-display text-[20px] leading-tight text-white">{promo.titulo}</h3>
          {promo.descripcion && (
            <p className="mt-2 text-[14px] font-light leading-relaxed text-white/80">
              {promo.descripcion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
