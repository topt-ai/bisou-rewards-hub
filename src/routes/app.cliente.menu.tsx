import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatCordoba,
  type MenuCategoria,
  type MenuItem,
  type MenuItemOpcion,
} from "@/lib/db-extra-types";

export const Route = createFileRoute("/app/cliente/menu")({
  head: () => ({ meta: [{ title: "Menú — BISOU" }] }),
  component: MenuPage,
});

// Type-relaxed reference (the new tables are not in generated supabase types yet).
const db = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

function MenuPage() {
  const [cats, setCats] = useState<MenuCategoria[] | null>(null);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [detail, setDetail] = useState<MenuItem | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: catData } = await db
        .from("menu_categorias")
        .select("id, nombre, orden, activa")
        .eq("activa", true)
        .order("orden", { ascending: true });
      const { data: itemData } = await db
        .from("menu_items")
        .select("id, categoria_id, nombre, descripcion, precio, imagen_url, activo")
        .eq("activo", true);
      const c = (catData ?? []) as unknown as MenuCategoria[];
      setCats(c);
      setItems(((itemData ?? []) as unknown as MenuItem[]));
      if (c.length && !activeCat) setActiveCat(c[0]!.id);
    })();
  }, [activeCat]);

  const filtered = useMemo(
    () => (items && activeCat ? items.filter((i) => i.categoria_id === activeCat) : []),
    [items, activeCat],
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="px-5 pt-6 pb-3">
        <h1 className="font-display text-3xl">Menú</h1>
        <p className="text-sm text-muted-foreground">Descubre nuestros sabores</p>
      </header>

      <nav className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cats === null ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  "shrink-0 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors",
                  activeCat === c.id
                    ? "border border-primary bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {c.nombre}
              </button>
            ))
          )}
        </div>
      </nav>

      <div className="flex-1 space-y-3 px-5 py-4">
        {items === null ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay platillos en esta categoría.
          </p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setDetail(item)}
              className="flex w-full items-center gap-3 border border-border bg-card p-3 text-left transition-colors hover:border-primary"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden border border-border bg-muted">
                {item.imagen_url ? (
                  <img
                    src={item.imagen_url}
                    alt={item.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <UtensilsCrossed className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-display text-base text-foreground">{item.nombre}</p>
                {item.descripcion && (
                  <p className="mt-0.5 line-clamp-2 text-xs font-light text-muted-foreground">
                    {item.descripcion}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium text-primary">
                  {formatCordoba(item.precio)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {detail && <MenuItemDetail item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function MenuItemDetail({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [opciones, setOpciones] = useState<MenuItemOpcion[] | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    void (async () => {
      const { data } = await db
        .from("menu_item_opciones")
        .select("id, item_id, grupo, nombre, precio_extra")
        .eq("item_id", item.id);
      setOpciones((data ?? []) as unknown as MenuItemOpcion[]);
    })();
  }, [item.id]);

  const grupos = useMemo(() => {
    const map = new Map<string, MenuItemOpcion[]>();
    (opciones ?? []).forEach((o) => {
      const arr = map.get(o.grupo) ?? [];
      arr.push(o);
      map.set(o.grupo, arr);
    });
    return Array.from(map.entries());
  }, [opciones]);

  const toggle = (grupo: string, opcionId: string) => {
    setSelected((prev) => {
      const cur = prev[grupo] ?? [];
      const next = cur.includes(opcionId) ? cur.filter((x) => x !== opcionId) : [...cur, opcionId];
      return { ...prev, [grupo]: next };
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="relative h-72 w-full bg-muted">
          {item.imagen_url ? (
            <img
              src={item.imagen_url}
              alt={item.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <UtensilsCrossed className="h-16 w-16" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground"
            aria-label="Volver"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h2 className="font-display text-3xl">{item.nombre}</h2>
            {item.descripcion && (
              <p className="mt-2 font-light leading-relaxed text-muted-foreground">
                {item.descripcion}
              </p>
            )}
            <p className="mt-3 text-xl font-medium text-primary">{formatCordoba(item.precio)}</p>
          </div>

          {opciones === null ? (
            <Skeleton className="h-24 w-full" />
          ) : grupos.length > 0 ? (
            <section className="space-y-4 border-t border-border pt-4">
              <h3 className="font-display text-lg">Personaliza tu pedido</h3>
              {grupos.map(([grupo, list]) => (
                <div key={grupo} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {grupo}
                  </p>
                  <div className="space-y-2">
                    {list.map((o) => {
                      const isSel = (selected[grupo] ?? []).includes(o.id);
                      return (
                        <label
                          key={o.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between border p-3 transition-colors",
                            isSel ? "border-primary bg-primary/5" : "border-border",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => toggle(grupo, o.id)}
                              className="h-4 w-4 accent-current"
                            />
                            <span className="text-sm">{o.nombre}</span>
                          </div>
                          {o.precio_extra > 0 && (
                            <span className="text-xs text-muted-foreground">
                              +{formatCordoba(o.precio_extra)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          <Button onClick={onClose} className="h-12 w-full">
            Volver al menú
          </Button>
        </div>
      </div>
    </div>
  );
}
