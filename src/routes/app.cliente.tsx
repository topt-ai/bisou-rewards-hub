import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, QrCode, Gift, User } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { checkAuthAndRole } from "@/lib/route-guards";
import { useLocation, useNavigate } from "react-router-dom";

export const Route = createFileRoute("/app/cliente")({
  beforeLoad: async ({ location }) => {
    const res = await checkAuthAndRole("cliente");
    if (!res.ok) throw redirect({ to: res.redirectTo });
    // Default to Inicio when at the bare layout path
    if (location.pathname === "/app/cliente" || location.pathname === "/app/cliente/") {
      throw redirect({ to: "/app/cliente/inicio" });
    }
  },
  component: ClienteLayout,
});

function ClienteLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const res = await checkAuthAndRole("cliente");
      if (!res.ok) {
        navigate(res.redirectTo, { replace: true });
        return;
      }
      if (location.pathname === "/app/cliente" || location.pathname === "/app/cliente/") {
        navigate("/app/cliente/inicio", { replace: true });
      }
    })();
  }, [location.pathname, navigate]);

  return (
    <PhoneFrame>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pb-20">
          <Outlet />
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
