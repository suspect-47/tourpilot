import { CalendarDays, Megaphone, Settings, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  group: "workspace" | "account";
};

// Only routes that actually exist. Inlet has three surfaces, so the rail
// stays short on purpose rather than being padded out with dead links.
export const NAV_ITEMS: NavItem[] = [
  { key: "timeline", label: "Guest timeline", icon: Users, href: "/dashboard", group: "workspace" },
  { key: "content", label: "Content", icon: Megaphone, href: "/dashboard/content", group: "workspace" },
  { key: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings", group: "account" },
];

export const NAV_GROUPS: { id: NavItem["group"]; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "account", label: "Account" },
];

export { CalendarDays };
