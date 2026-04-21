import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { Route as IndexRoute } from "@/routes/index";
import { Route as LoginRoute } from "@/routes/login";
import { Route as RegistroRoute } from "@/routes/registro";
import { Route as ForgotPasswordRoute } from "@/routes/forgot-password";
import { Route as ResetPasswordRoute } from "@/routes/reset-password";
import { Route as AppClienteRoute } from "@/routes/app.cliente";
import { Route as AppClienteInicioRoute } from "@/routes/app.cliente.inicio";
import { Route as AppClienteQrRoute } from "@/routes/app.cliente.qr";
import { Route as AppClienteRecompensasRoute } from "@/routes/app.cliente.recompensas";
import { Route as AppClientePerfilRoute } from "@/routes/app.cliente.perfil";
import { Route as AppCajeroRoute } from "@/routes/app.cajero";
import { Route as AppCajeroEscanearRoute } from "@/routes/app.cajero.escanear";
import { Route as AppCajeroBuscarRoute } from "@/routes/app.cajero.buscar";
import { Route as AppCajeroCanjeRoute } from "@/routes/app.cajero.canje";
import { Route as AppCajeroPerfilRoute } from "@/routes/app.cajero.perfil";
import { Route as AppAdminRoute } from "@/routes/app.admin";
import { Route as AppAdminDashboardRoute } from "@/routes/app.admin.dashboard";
import { Route as AppAdminClientesRoute } from "@/routes/app.admin.clientes";
import { Route as AppAdminRecompensasRoute } from "@/routes/app.admin.recompensas";
import { Route as AppAdminAjustesRoute } from "@/routes/app.admin.ajustes";
import { Route as AppAdminPerfilRoute } from "@/routes/app.admin.perfil";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 font-display text-xl text-foreground">Página no encontrada</h2>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<IndexRoute.component />} />
        <Route path="/login" element={<LoginRoute.component />} />
        <Route path="/registro" element={<RegistroRoute.component />} />
        <Route path="/forgot-password" element={<ForgotPasswordRoute.component />} />
        <Route path="/reset-password" element={<ResetPasswordRoute.component />} />

        <Route path="/app/cliente" element={<AppClienteRoute.component />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<AppClienteInicioRoute.component />} />
          <Route path="qr" element={<AppClienteQrRoute.component />} />
          <Route path="recompensas" element={<AppClienteRecompensasRoute.component />} />
          <Route path="perfil" element={<AppClientePerfilRoute.component />} />
        </Route>

        <Route path="/app/cajero" element={<AppCajeroRoute.component />}>
          <Route index element={<Navigate to="escanear" replace />} />
          <Route path="escanear" element={<AppCajeroEscanearRoute.component />} />
          <Route path="buscar" element={<AppCajeroBuscarRoute.component />} />
          <Route path="canje" element={<AppCajeroCanjeRoute.component />} />
          <Route path="perfil" element={<AppCajeroPerfilRoute.component />} />
        </Route>

        <Route path="/app/admin" element={<AppAdminRoute.component />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AppAdminDashboardRoute.component />} />
          <Route path="clientes" element={<AppAdminClientesRoute.component />} />
          <Route path="recompensas" element={<AppAdminRecompensasRoute.component />} />
          <Route path="ajustes" element={<AppAdminAjustesRoute.component />} />
          <Route path="perfil" element={<AppAdminPerfilRoute.component />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}
