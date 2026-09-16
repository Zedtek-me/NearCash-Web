import { Home as HomeIcon, TrendingUp, Globe, Zap } from "lucide-react";

/**
 * Shared primary nav destinations used by both the mobile bottom tab bar
 * (Footers.jsx) and the desktop top-nav icon links (Headers.jsx), so the two
 * stay in sync. FX Rate / Cross Border / Utilities currently route to
 * ComingSoon pages — swap once their backend features ship.
 */
export const getPrimaryNavItems = (basePath) => [
  { key: "home", label: "Home", tooltip: "Go to your dashboard", icon: HomeIcon, path: basePath },
  { key: "fx-rate", label: "FX Rate", tooltip: "View live exchange rates", icon: TrendingUp, path: `${basePath}/fx-rate` },
  { key: "cross-border", label: "Cross Border", tooltip: "Send cross-border payments", icon: Globe, path: `${basePath}/cross-border` },
  { key: "utilities", label: "Utilities", tooltip: "Pay bills and manage utilities", icon: Zap, path: `${basePath}/utilities` },
];
