import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, roleHomePath } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Iniciar sesión — BISOU" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // After signIn, fetch role to redirect.
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .maybeSingle();
        const role = (prof?.role as "cliente" | "cajero" | "admin" | undefined) ?? "cliente";
        navigate({ to: roleHomePath(role) });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      toast.error(msg.includes("Invalid") ? "Correo o contraseña inválidos" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center">
          <h1 className="font-display text-4xl font-bold text-primary">BISOU</h1>
        </Link>
        <h2 className="mt-8 text-center font-display text-2xl text-foreground">
          Bienvenido de vuelta
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Inicia sesión para ver tus puntos
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          <Link to="/forgot-password" className="block text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
