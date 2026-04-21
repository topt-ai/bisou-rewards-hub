import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function QrScannerCard({
  onDecoded,
  title = "Escanear QR del cliente",
  description = "Pide al cliente que muestre su código en la app.",
}: {
  onDecoded: (value: string) => Promise<void> | void;
  title?: string;
  description?: string;
}) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = useRef(`qr-reader-region-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    return () => {
      const inst = scannerRef.current;
      if (!inst) return;
      void inst
        .stop()
        .catch(() => {})
        .finally(() => {
          try {
            inst.clear();
          } catch {
            /* ignore */
          }
        });
    };
  }, []);

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

  const start = async () => {
    setScanning(true);
    try {
      const inst = new Html5Qrcode(elementId.current);
      scannerRef.current = inst;
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          await stop();
          await onDecoded(decoded.trim());
        },
        () => {},
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo abrir la cámara";
      toast.error(msg);
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {!scanning && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button onClick={start} className="h-12 gap-2 rounded-full px-8">
            <Camera className="h-4 w-4" />
            Abrir cámara
          </Button>
        </Card>
      )}

      <div
        id={elementId.current}
        className={scanning ? "overflow-hidden rounded-2xl border border-border" : "hidden"}
      />

      {scanning && (
        <Button variant="outline" onClick={stop} className="w-full">
          Cancelar
        </Button>
      )}
    </div>
  );
}
