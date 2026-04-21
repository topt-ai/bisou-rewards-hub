import type { Role } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

/**
 * Check session + role on the client. Returns `{ ok: true }` if allowed,
 * else `{ ok: false, redirectTo }`.
 *
 * Allowed roles: `cliente` route allows admin too (admin can preview all).
 * `cajero` route allows admin too. `admin` route is admin only.
 */
export async function checkAuthAndRole(
  required: Role,
): Promise<{ ok: true } | { ok: false; redirectTo: string }> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) return { ok: false, redirectTo: "/login" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const role = (profile?.role as Role | undefined) ?? "cliente";

  const allowed =
    required === "admin"
      ? role === "admin"
      : required === "cajero"
        ? role === "cajero" || role === "admin"
        : role === "cliente" || role === "admin";

  if (!allowed) {
    const home = role === "admin" ? "/app/admin" : role === "cajero" ? "/app/cajero" : "/app/cliente";
    return { ok: false, redirectTo: home };
  }
  return { ok: true };
}
