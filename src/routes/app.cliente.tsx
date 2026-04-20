import { createFileRoute, Outlet, redirect, useLocation, Link } from "@tanstack/react-router";
import { Home, QrCode, Gift, User } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { checkAuthAndRole } from "@/lib/route-guards";

export const Route = createFileRoute("/app/cliente")({
  beforeLoad: async () => {
    const res = await checkAuthAndRole("cliente");
    if (!res.ok) throw redirect({ to: res.redirectTo });
  },
  component: ClienteLayout,
});

function ClienteLayout() {
  const location = useLocation();
  // Default route: /app/cliente shows Inicio
  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pb-20">
          {location.pathname === "/app/cliente" || location.pathname === "/app/cliente/" ? (
            <ClienteInicioRedirect />
          ) : (
            <Outlet />
          )}
        </main>
        <BottomNav
          items={[
            { to: "/app/cliente/inicio", label: "Inicio", icon: Home },
            { to: "/app/cliente/qr", label: "Mi QR", icon: QrCode },
            { to: "/app/cliente/recompensas", label: "Recompensas", icon: Gift },
            { to: "/app/cliente/perfil", label: "Perfil", icon: User },
          ]}
        />
      </div>
    </PhoneFrame>
  );
}

function ClienteInicioRedirect() {
  // Soft redirect via Link (avoids loader recursion)
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <Link to="/app/cliente/inicio" className="text-primary hover:underline">
        Ir al inicio
      </Link>
    </div>
  );
}
