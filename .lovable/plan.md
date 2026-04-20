

# BISOU — Loyalty PWA

A complete 3-role loyalty app for BISOU café (Managua), built on the existing Supabase schema. Cream/burgundy editorial design, Playfair Display + Jost typography, mobile-first with phone-frame on desktop, all copy in Spanish.

## Stack notes (adapted to this project)
- **Routing**: TanStack Router file-based routes (this template's router) — same URL structure as spec.
- **PWA**: Installable manifest + theme colors (Add to Home Screen works). Full service-worker offline mode is **skipped** because it breaks Lovable's preview; the QR screen will still work offline once the page is cached by the browser. Can be upgraded later if needed.
- **Schema**: Uses existing tables exactly as defined. One small migration needed: add an INSERT policy on `transactions` so a new user can insert their own welcome bonus (current policies only allow cajero/admin inserts).

## Design system
- Tailwind tokens updated in `styles.css` to BISOU palette: cream `#e7dcd1`, near-black `#0a0a0a`, burgundy `#620608`, dusty blue `#94b1c8`, white.
- Google Fonts: Playfair Display (display) + Jost (body) loaded via `<link>` in root.
- Radii: 12px cards, 999px pills. Soft shadows, no harsh borders.
- Reusable components: `PhoneFrame`, `PointsCard`, `BottomNav`, `TopBar`, `RewardCard`, `TransactionRow`, `EmptyState`, skeleton loaders, toast (sonner).

## Auth & routing
- `AuthProvider` context: holds `session`, `profile`, `role`, plus `signIn`, `signUp`, `signOut`, `refreshProfile`.
- Routes:
  - `/` Splash/landing (cream, wordmark, two CTAs)
  - `/login` — email + password, redirects by role
  - `/registro` — full form (nombre, email, password, teléfono, fecha de nacimiento, cédula); on success inserts welcome `+10` transaction and updates points
  - `/forgot-password` and `/reset-password` (required by Lovable auth standards)
  - `/app/cliente/*` (guarded: role = cliente, admin allowed)
  - `/app/cajero/*` (guarded: role = cajero, admin allowed)
  - `/app/admin/*` (guarded: role = admin)
- Role guard via TanStack `beforeLoad` + redirect; unauthenticated → `/login` with redirect-back.

## Cliente (`/app/cliente`) — bottom nav, 4 tabs
1. **Inicio**: greeting, large burgundy points card with progress bar to next reward, birthday banner if today matches `fecha_nacimiento` (day+month), last 5 transactions, "Ver todo" link to full history.
2. **Mi QR**: full-screen QR (qrcode.react `QRCodeSVG`, 240px, burgundy/cream), name, short ID, refresh button. Cached for offline display.
3. **Recompensas**: points pill, grid of active rewards. "Canjear" → confirm modal → screen with random 6-char code to show the cashier (no points deducted client-side).
4. **Perfil**: avatar initials, stats (puntos / puntos_totales / # canjes), inline-edit teléfono and fecha_nacimiento, logout, version.

## Cajero (`/app/cajero`) — top tabs, no bottom nav
1. **Escanear QR**: live camera scanner (`html5-qrcode`), reads UUID, loads customer card, "Puntos a agregar" input (default 10), inserts `suma` transaction + updates `puntos` and `puntos_totales`.
2. **Buscar cliente**: search by nombre/email/cédula, tap result → same customer card (add points or go to canje).
3. **Confirmar canje**: customer search + reward dropdown, validates balance, inserts `canje` transaction (negative points) + `canjes` row, decrements `puntos` only.

## Admin (`/app/admin`) — bottom nav, 4 tabs
1. **Dashboard**: 4 stat cards (total clientes, puntos hoy, canjes hoy, puntos lifetime) + last 10 transactions table.
2. **Clientes**: searchable table; row detail with full profile, transaction history, manual `ajuste` (+/− with reason), toggle activo, change role (cliente ↔ cajero).
3. **Recompensas**: list with toggle activa, edit nombre/descripcion/puntos_requeridos, "Nueva recompensa" form.
4. **Ajustes**: list of cajeros; promote cliente by email; demote cajero; app info.

## Data behavior
- All Supabase calls wrapped with try/catch and Spanish toast errors.
- Points updates done as: insert transaction → update profile points (atomic enough for MVP; can move to RPC later).
- `puntos_totales` only ever increases (suma + ajuste positive); `puntos` follows all changes.
- Skeletons on every async screen; empty states with friendly Spanish copy.

## Required DB migration (one)
- Add policy: `Users can insert own welcome transaction` on `transactions` for INSERT, `with check (auth.uid() = user_id and tipo = 'bienvenida' and puntos = 10)` — needed so the registro flow can write the +10 bienvenida row.

## PWA / installability
- `manifest.webmanifest` with name BISOU, theme `#620608`, background `#e7dcd1`, display `standalone`, simple burgundy "B" icon (192/512 SVG → PNG placeholder).
- Meta tags for iOS add-to-home-screen.
- No service worker (preview-safe). Documented so it can be added at deploy time.

## Out of scope (per spec "do not add features not listed")
- Automated birthday emails (banner only).
- Self-redeem deduction (cashier-confirmed only).
- Push notifications, analytics dashboards beyond the listed stats.

