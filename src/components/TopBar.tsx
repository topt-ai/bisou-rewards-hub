import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function TopBar({ subtitle }: { subtitle?: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div>
        <Logo size={28} />
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={async () => {
          await signOut();
          navigate({ to: "/" });
        }}
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
