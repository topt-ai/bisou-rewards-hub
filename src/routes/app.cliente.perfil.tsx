import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { AvatarUploader } from "@/components/AvatarUploader";

export const Route = createFileRoute("/app/cliente/perfil")({
  head: () => ({ meta: [{ title: "Mi perfil — BISOU" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [canjes, setCanjes] = useState<number | null>(null);
  const [editing, setEditing] = useState<"telefono" | "fecha_nacimiento" | null>(null);
  const [form, setForm] = useState({ telefono: "", fecha_nacimiento: "" });

  useEffect(() => {
    if (!profile) return;
    setForm({
      telefono: profile.telefono ?? "",
      fecha_nacimiento: profile.fecha_nacimiento ?? "",
    });
    supabase
      .from("canjes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .then(({ count }) => setCanjes(count ?? 0));
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-6 w-40" />
      </div>
    );
  }

  const saveField = async (field: "telefono" | "fecha_nacimiento") => {
    const value = form[field] || null;
    const updates =
      field === "telefono" ? { telefono: value } : { fecha_nacimiento: value };
    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    if (error) {
      toast.error("No se pudo actualizar");
      return;
    }
    toast.success("Actualizado");
    setEditing(null);
    await refreshProfile();
  };

  return (
    <div className="space-y-5 p-5">
      <header className="flex flex-col items-center pt-4 text-center">
        <AvatarUploader
          userId={profile.id}
          nombre={profile.nombre}
          avatarUrl={profile.avatar_url}
          onUpdated={() => refreshProfile()}
        />
        <h1 className="mt-4 font-display text-2xl text-foreground">{profile.nombre}</h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </header>

      <Card className="grid grid-cols-3 divide-x divide-border p-0">
        <Stat label="Puntos" value={profile.puntos} />
        <Stat label="Totales" value={profile.puntos_totales} />
        <Stat label="Canjes" value={canjes ?? "—"} />
      </Card>

      <Card className="divide-y divide-border p-0">
        <EditableRow
          label="Teléfono"
          value={profile.telefono}
          editing={editing === "telefono"}
          onEdit={() => setEditing("telefono")}
          onSave={() => saveField("telefono")}
          input={
            <Input
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              type="tel"
              className="h-9"
            />
          }
        />
        <EditableRow
          label="Cumpleaños"
          value={profile.fecha_nacimiento}
          editing={editing === "fecha_nacimiento"}
          onEdit={() => setEditing("fecha_nacimiento")}
          onSave={() => saveField("fecha_nacimiento")}
          input={
            <Input
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))}
              className="h-9"
            />
          }
        />
        {profile.cedula && (
          <div className="flex items-center justify-between px-4 py-3">
            <Label className="text-xs text-muted-foreground">Cédula</Label>
            <span className="text-sm">{profile.cedula}</span>
          </div>
        )}
      </Card>

      <Button
        variant="outline"
        onClick={async () => {
          await signOut();
          navigate({ to: "/" });
        }}
        className="h-11 w-full gap-2 rounded-full border-primary text-primary hover:bg-primary/5"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </Button>

      <p className="pb-4 text-center text-[11px] font-light tracking-widest text-muted-foreground">
        BISOU App v1.0
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function EditableRow({
  label,
  value,
  editing,
  onEdit,
  onSave,
  input,
}: {
  label: string;
  value: string | null;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  input: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Label className="w-24 shrink-0 text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <>
          <div className="flex-1">{input}</div>
          <Button size="icon" variant="ghost" onClick={onSave}>
            <Check className="h-4 w-4 text-primary" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-card-foreground">
            {value ?? <span className="text-muted-foreground italic">No registrado</span>}
          </span>
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </>
      )}
    </div>
  );
}
