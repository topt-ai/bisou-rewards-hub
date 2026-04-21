import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AvatarUploader } from "@/components/AvatarUploader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/app/admin/perfil")({
  head: () => ({ meta: [{ title: "Mi perfil — Admin BISOU" }] }),
  component: AdminPerfilPage,
});

function AdminPerfilPage() {
  const { profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  if (loading || !profile) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-6 w-40" />
      </div>
    );
  }

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
        <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
          Administrador
        </span>
      </header>

      <Card className="space-y-1 p-4 text-sm">
        {profile.telefono && <Row label="Teléfono" value={profile.telefono} />}
        {profile.cedula && <Row label="Cédula" value={profile.cedula} />}
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
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
