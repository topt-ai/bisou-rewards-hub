import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerCard, type CustomerProfile } from "@/components/CustomerCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, ScanLine } from "lucide-react";

export const Route = createFileRoute("/app/cajero/escanear")({
  head: () => ({ meta: [{ title: "Escanear QR — BISOU" }] }),
  component: EscanearPage,
});

function EscanearPage() {
  const [scanning, setScanning] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-reader-region";

  useEffect(() => {
    return () => {
      const inst = scannerRef.current;
      if (inst) {
        inst
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              inst.clear();
            } catch {
              /* ignore */
            }
          });
      }
    };
  }, []);

  const lookup = async (uuid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, email, puntos, puntos_totales, avatar_url")
      .eq("id", uuid)
      .maybeSingle();
    if (error || !data) {
      toast.error("Cliente no encontrado");
      return;
    }
    setCustomer(data as CustomerProfile);
  };

  const start = async () => {
    setScanning(true);
    setCustomer(null);
    try {
      const inst = new Html5Qrcode(elementId);
      scannerRef.current = inst;
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await inst.stop().catch(() => {});
          try {
            inst.clear();
          } catch {
            /* ignore */
          }
          scannerRef.current = null;
          setScanning(false);
          await lookup(decoded.trim());
        },
        () => {},
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo abrir la cámara";
      toast.error(msg);
      setScanning(false);
    }
  };

  const stop = async () => {
    const inst = scannerRef.current;
    if (inst) {
      await inst.stop().catch(() => {});
      try {
        inst.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="space-y-4 p-5">
      {!scanning && !customer && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl">Escanear QR del cliente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pide al cliente que muestre su código en la app.
            </p>
          </div>
          <Button onClick={start} className="h-12 gap-2 rounded-full px-8">
            <Camera className="h-4 w-4" />
            Abrir cámara
          </Button>
        </Card>
      )}

      <div
        id={elementId}
        className={scanning ? "overflow-hidden rounded-2xl border border-border" : "hidden"}
      />

      {scanning && (
        <Button variant="outline" onClick={stop} className="w-full">
          Cancelar
        </Button>
      )}

      {customer && (
        <>
          <CustomerCard
            customer={customer}
            onSuccess={(np) => setCustomer({ ...customer, puntos: np })}
          />
          <Button variant="outline" onClick={() => setCustomer(null)} className="w-full">
            Escanear otro
          </Button>
        </>
      )}
    </div>
  );
}
