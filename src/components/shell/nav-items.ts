import { BarChart3, Images, Settings, Star, type LucideIcon } from "lucide-react";

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  group: "workspace" | "account";
};

// Only routes that actually exist. Inlet is a small surface, so the rail stays
// short on purpose rather than being padded out with dead links.
export const NAV_ITEMS: NavItem[] = [
  {
    key: "reputation",
    label: "Reputation Management",
    icon: Star,
    href: "/dashboard",
    group: "workspace",
  },
  {
    key: "content",
    label: "Content Management",
    icon: Images,
    href: "/dashboard/content",
    group: "workspace",
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/dashboard/analytics",
    group: "workspace",
  },
  { key: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings", group: "account" },
];

export const NAV_GROUPS: { id: NavItem["group"]; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "account", label: "Account" },
];
