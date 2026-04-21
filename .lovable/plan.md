

# Fix registration data + Add editable profile photo

Three bugs and one feature, all stemming from how registration writes to `profiles` plus a missing avatar upload flow.

## Root cause of bugs 1, 2, 3

The current `handle_new_user()` trigger only inserts `id`, `nombre`, and `email` into `profiles`. The extra registration fields (`telefono`, `fecha_nacimiento`, `cedula`) are passed in `signUp` options but never read by the trigger, so they stay `null`. The welcome `+10` is attempted client-side after `signUp`, but it races the trigger and sometimes runs before the profile row exists, so the `UPDATE` silently affects 0 rows.

## Fix plan

### 1. Database migration (one)
Update `public.handle_new_user()` to:
- Read `telefono`, `cedula`, `fecha_nacimiento` from `new.raw_user_meta_data` and insert them into `profiles`.
- Set `puntos = 10` and `puntos_totales = 10` directly on insert (welcome bonus, atomic with profile creation).
- Insert the matching `bienvenida` row into `transactions` in the same trigger, so points and history stay in sync.
- Keep `SET search_path = public` and `SECURITY DEFINER` (already correct).

This makes the welcome flow fully server-side and removes the client-side race entirely.

### 2. `src/lib/auth-context.tsx` — simplify `signUp`
- Keep passing `nombre`, `telefono`, `fecha_nacimiento`, `cedula` in `options.data` (the trigger now consumes them).
- Remove the client-side welcome `INSERT` into `transactions` and the `UPDATE puntos` block — the trigger handles both.
- After `signUp`, just `refreshProfile()` so the new row (with points + fields) loads into context.
- This also fixes Bug 3: once the trigger writes the fields, `Perfil` will display them as-is (no UI change needed for that bug).

### 3. Avatar upload feature

**Storage policies migration** (same migration file as above):
The `avatars` bucket exists and is public for reads, but write policies are missing. Add policies on `storage.objects` for bucket `avatars`:
- `INSERT`: `auth.uid()::text = (storage.foldername(name))[1]` — users write only into their own `{user_id}/...` folder.
- `UPDATE` and `DELETE`: same condition, so re-uploads (overwriting `avatar.jpg`) work.
- `SELECT` is already covered by the public bucket.

**Reusable component** `src/components/AvatarUploader.tsx`:
- Props: `userId`, `nombre` (for initials fallback), `avatarUrl`, `size` (default 96), `onUpdated(url)`.
- Renders a circular tappable element: shows `<img>` when `avatarUrl` is set, otherwise initials on burgundy.
- Hidden `<input type="file" accept="image/*">` triggered by tap.
- On select: validate type/size (≤2MB), `supabase.storage.from('avatars').upload('{userId}/avatar.jpg', file, { upsert: true, contentType: file.type })`, then update `profiles.avatar_url` with the public URL plus a `?t={Date.now()}` cache-buster, toast success, call `onUpdated`.
- Small "Subiendo..." overlay while uploading.

**Wire it in:**
- `src/routes/app.cliente.perfil.tsx` — replace the initials circle with `<AvatarUploader>`, refresh profile on success.
- Add a minimal profile screen for cajero and admin so they can also change their avatar:
  - `src/routes/app.cajero.perfil.tsx` — avatar uploader + name/email + logout, linked from the cajero top tabs.
  - `src/routes/app.admin.perfil.tsx` — same, linked from the admin bottom nav (replacing or alongside Ajustes' header).
- Both reuse `AvatarUploader` with the signed-in user's id.

### 4. Display avatar elsewhere (light touch)
- `CustomerCard` (used by cajero): if `avatar_url` exists, render the image instead of initials, so cashiers see the customer's photo when scanning/searching.
- Admin Clientes table row: small avatar thumbnail next to the name.

## Files touched
- New migration: update `handle_new_user`, add storage policies on `avatars`.
- New: `src/components/AvatarUploader.tsx`, `src/routes/app.cajero.perfil.tsx`, `src/routes/app.admin.perfil.tsx`.
- Edited: `src/lib/auth-context.tsx`, `src/routes/app.cliente.perfil.tsx`, `src/routes/registro.tsx` (no logic change, just remove now-dead toast wording if needed), `src/components/CustomerCard.tsx`, `src/routes/app.admin.clientes.tsx`, cajero and admin layout files to add the Perfil tab/link.

## Out of scope
- Image cropping/resizing on the client.
- Multiple avatar history.
- Removing the avatar (can be added later as a "Quitar foto" button).

