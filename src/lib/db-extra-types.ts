// Manual types for tables not yet in the auto-generated supabase/types.ts.
// The tables already exist in Supabase; we just need TypeScript shapes here.

export interface MenuCategoria {
  id: string;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface MenuItem {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  activo: boolean;
}

export interface MenuItemOpcion {
  id: string;
  item_id: string;
  grupo: string;
  nombre: string;
  precio_extra: number;
}

export interface Paquete {
  id: string;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  precio: number;
  tiene_vencimiento: boolean;
  dias_vencimiento: number | null;
  item_id: string | null;
  activo: boolean;
  created_at?: string;
}

export interface UserPaquete {
  id: string;
  user_id: string;
  paquete_id: string;
  cajero_id: string | null;
  cantidad_total: number;
  cantidad_usada: number;
  fecha_vencimiento: string | null;
  activo: boolean;
  created_at?: string;
  paquete?: Paquete;
}

export interface UserPaqueteUso {
  id: string;
  user_paquete_id: string;
  cajero_id: string | null;
  created_at?: string;
}

export const formatCordoba = (n: number) =>
  `C$${n.toLocaleString("es-NI", { maximumFractionDigits: 0 })}`;
