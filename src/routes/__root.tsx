import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 font-display text-xl text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      },
      { title: "BISOU — Munchies · Coffee · Desserts" },
      {
        name: "description",
        content: "Programa de lealtad de BISOU. Acumula puntos y canjea recompensas en Managua.",
      },
      { name: "theme-color", content: "#620608" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "BISOU" },
      { property: "og:title", content: "BISOU — Munchies · Coffee · Desserts" },
      { property: "og:description", content: "BISOU Rewards Hub is a PWA for a pastry café, enabling loyalty programs for customers, cashiers, and admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "BISOU — Munchies · Coffee · Desserts" },
      { name: "description", content: "BISOU Rewards Hub is a PWA for a pastry café, enabling loyalty programs for customers, cashiers, and admins." },
      { name: "twitter:description", content: "BISOU Rewards Hub is a PWA for a pastry café, enabling loyalty programs for customers, cashiers, and admins." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/de28c764-1cd6-4688-8177-e907bbf60289/id-preview-4aea1e8d--deb1b434-88b1-4691-acd0-74a422aba13c.lovable.app-1776788705607.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/de28c764-1cd6-4688-8177-e907bbf60289/id-preview-4aea1e8d--deb1b434-88b1-4691-acd0-74a422aba13c.lovable.app-1776788705607.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
