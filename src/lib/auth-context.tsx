import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = "cliente" | "cajero" | "admin";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface SignUpData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  fecha_nacimiento?: string;
  cedula?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.error("fetchProfile error", error);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const p = await fetchProfile(userId);
    setProfile(p);
  }, []);

  useEffect(() => {
    // Set up listener BEFORE getSession (per Lovable auth pattern)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // defer to avoid recursion
        setTimeout(() => {
          void loadProfile(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        void loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (data: SignUpData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nombre: data.nombre },
      },
    });
    if (error) throw error;
    const userId = authData.user?.id;
    if (!userId) throw new Error("No se pudo crear la cuenta");

    // Update profile with extra fields and grant +10 welcome bonus.
    // Trigger handle_new_user already created the profile row.
    // Wait briefly for trigger then update.
    await new Promise((r) => setTimeout(r, 400));

    const updates: Partial<Profile> = {
      telefono: data.telefono || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      cedula: data.cedula || null,
      puntos: 10,
      puntos_totales: 10,
    };
    const { error: upErr } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (upErr) console.error("profile update on signup", upErr);

    const { error: txErr } = await supabase.from("transactions").insert({
      user_id: userId,
      tipo: "bienvenida",
      puntos: 10,
      descripcion: "¡Bienvenido/a a BISOU!",
    });
    if (txErr) console.error("welcome tx insert", txErr);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const role = (profile?.role as Role) ?? null;

  return (
    <AuthContext.Provider
      value={{ session, profile, role, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function roleHomePath(role: Role | null): string {
  if (role === "admin") return "/app/admin";
  if (role === "cajero") return "/app/cajero";
  return "/app/cliente";
}
