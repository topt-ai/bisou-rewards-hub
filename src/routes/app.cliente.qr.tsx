import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/cliente/qr")({
  head: () => ({ meta: [{ title: "Mi QR — BISOU" }] }),
  component: QRPage,
});

function QRPage() {
  const { profile, loading } = useAuth();
  const [key, setKey] = useState(0);

  if (loading || !profile) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mx-auto h-72 w-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-between p-6">
      <div className="text-center">
        <h1 className="font-display text-2xl text-foreground">Mi código BISOU</h1>
        <p className="mt-1 text-sm text-muted-foreground">Muestra este código en caja</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <QRCodeSVG
            key={key}
            value={profile.id}
            size={240}
            bgColor="#ffffff"
            fgColor="#620608"
            level="H"
            includeMargin={false}
          />
        </div>
        <h2 className="mt-6 font-display text-2xl text-foreground">{profile.nombre}</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          ID: {profile.id.slice(0, 8)}
        </p>
      </div>

      <Button
        variant="ghost"
        onClick={() => setKey((k) => k + 1)}
        className="gap-2 text-muted-foreground"
      >
        <RefreshCw className="h-4 w-4" />
        Actualizar
      </Button>
    </div>
  );
}
