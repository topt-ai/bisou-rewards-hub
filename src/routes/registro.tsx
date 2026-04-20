import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [{ title: "Crear cuenta — BISOU" }],
  }),
  component: RegistroPage,
});

const schema = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(80),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  cedula: z.string().trim().max(30).optional().or(z.literal("")),
});

function RegistroPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    fecha_nacimiento: "",
    cedula: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los datos");
      return;
    }
    setLoading(true);
    try {
      await signUp({
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        password: parsed.data.password,
        telefono: parsed.data.telefono || undefined,
        fecha_nacimiento: parsed.data.fecha_nacimiento || undefined,
        cedula: parsed.data.cedula || undefined,
      });
      toast.success("¡Cuenta creada! Recibiste 10 puntos de bienvenida 🎉");
      navigate({ to: "/app/cliente" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear la cuenta";
      toast.error(
        msg.includes("registered") || msg.includes("already")
          ? "Este correo ya está registrado"
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" className="block text-center">
          <h1 className="font-display text-3xl font-bold text-primary">BISOU</h1>
        </Link>
        <h2 className="mt-6 text-center font-display text-2xl text-foreground">Crear cuenta</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Únete y recibe 10 puntos de regalo
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Nombre completo *" htmlFor="nombre">
            <Input
              id="nombre"
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="Correo electrónico *" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="Contraseña *" htmlFor="password">
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="Teléfono" htmlFor="telefono">
            <Input
              id="telefono"
              type="tel"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="Fecha de nacimiento" htmlFor="fecha_nacimiento">
            <Input
              id="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => set("fecha_nacimiento", e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="Cédula" htmlFor="cedula">
            <Input
              id="cedula"
              value={form.cedula}
              onChange={(e) => set("cedula", e.target.value)}
              className="h-11"
            />
          </Field>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
