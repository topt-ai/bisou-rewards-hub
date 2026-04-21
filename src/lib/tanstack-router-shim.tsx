import {
  Link as RRLink,
  Outlet as RROutlet,
  useLocation as useRRLocation,
  useNavigate as useRRNavigate,
} from "react-router-dom";

export const Link = RRLink;
export const Outlet = RROutlet;
export const useLocation = useRRLocation;

export function useNavigate() {
  const navigate = useRRNavigate();
  return ({ to }: { to: string }) => navigate(to);
}

export function redirect({ to }: { to: string }) {
  return { to };
}

type FileRouteConfig = {
  component: React.ComponentType;
  beforeLoad?: (...args: unknown[]) => unknown;
  head?: (...args: unknown[]) => unknown;
  notFoundComponent?: React.ComponentType;
  shellComponent?: React.ComponentType<{ children: React.ReactNode }>;
};

export function createFileRoute(path: string) {
  return (config: FileRouteConfig) => ({ ...config, path });
}

export function createRootRoute(config: FileRouteConfig) {
  return { ...config, path: "/" };
}

export function HeadContent() {
  return null;
}

export function Scripts() {
  return null;
}
