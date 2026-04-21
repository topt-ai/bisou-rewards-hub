import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useAuth } from "@/lib/auth-context";
import { checkAuthAndRole } from "@/lib/route-guards";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const Route = createFileRoute("/app/cajero")({
  beforeLoad: async ({ location }) => {
    const res = await checkAuthAndRole("cajero");
    if (!res.ok) throw redirect({ to: res.redirectTo });
    if (location.pathname === "/app/cajero" || location.pathname === "/app/cajero/") {
      throw redirect({ to: "/app/cajero/escanear" });
    }
  },
  component: CajeroLayout,
});

const tabs = [
  { to: "/app/cajero/escanear", label: "Escanear" },
  { to: "/app/cajero/buscar", label: "Buscar" },
  { to: "/app/cajero/canje", label: "Canje" },
  { to: "/app/cajero/perfil", label: "Perfil" },
];

function CajeroLayout() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const res = await checkAuthAndRole("cajero");
      if (!res.ok) {
        navigate(res.redirectTo, { replace: true });
        return;
      }
      if (location.pathname === "/app/cajero" || location.pathname === "/app/cajero/") {
        navigate("/app/cajero/escanear", { replace: true });
      }
    })();
  }, [location.pathname, navigate]);

  return (
    <PhoneFrame className="md:max-w-[640px]">
      <div className="flex min-h-screen flex-col">
        <TopBar subtitle={profile ? `Cajero: ${profile.nombre.split(" ")[0]}` : "Cajero"} />
        <nav className="flex border-b border-border bg-background">
          {tabs.map((t) => {
            const active = location.pathname === t.to;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex-1 border-b-2 py-3 text-center text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </PhoneFrame>
  );
}
