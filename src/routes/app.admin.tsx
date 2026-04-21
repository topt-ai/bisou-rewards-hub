import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Users, Gift, Settings, User } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { checkAuthAndRole } from "@/lib/route-guards";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: async ({ location }) => {
    const res = await checkAuthAndRole("admin");
    if (!res.ok) throw redirect({ to: res.redirectTo });
    if (location.pathname === "/app/admin" || location.pathname === "/app/admin/") {
      throw redirect({ to: "/app/admin/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <PhoneFrame className="md:max-w-[680px]">
      <div className="flex min-h-screen flex-col">
        <TopBar subtitle="Panel de administración" />
        <main className="flex-1 pb-20">
          <Outlet />
        </main>
        <BottomNav
          items={[
            { to: "/app/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/app/admin/clientes", label: "Clientes", icon: Users },
            { to: "/app/admin/recompensas", label: "Recompensas", icon: Gift },
            { to: "/app/admin/ajustes", label: "Ajustes", icon: Settings },
            { to: "/app/admin/perfil", label: "Perfil", icon: User },
          ]}
        />
      </div>
    </PhoneFrame>
  );
}
