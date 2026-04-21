import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomerCard, type CustomerProfile } from "@/components/CustomerCard";
import { QrScannerCard } from "@/components/QrScannerCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cajero/escanear")({
  head: () => ({ meta: [{ title: "Escanear QR — BISOU" }] }),
  component: EscanearPage,
});

function EscanearPage() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);

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

  return (
    <div className="space-y-4 p-5">
      {!customer && <QrScannerCard onDecoded={lookup} />}

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
