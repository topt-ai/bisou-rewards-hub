import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar contraseña — BISOU" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Correo enviado. Revisa tu bandeja.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo enviar el correo";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center">
          <h1 className="font-display text-3xl font-bold text-primary">BISOU</h1>
        </Link>
        <h2 className="mt-6 text-center font-display text-2xl">Recuperar contraseña</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Te enviaremos un enlace a tu correo
        </p>
        {sent ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-5 text-center text-sm text-card-foreground">
            <p>Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.</p>
            <Link to="/login" className="mt-4 inline-block font-medium text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-primary text-primary-foreground"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">
              Volver
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
