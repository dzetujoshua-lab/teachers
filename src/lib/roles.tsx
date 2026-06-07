import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  UtensilsCrossed,
  ShieldCheck,
  GraduationCap,
  Building2,
  BarChart3,
  Bell,
  FileText,
  Settings,
  MapPin,
  Trophy,
  CalendarClock,
  Soup,
  ScrollText,
  Globe,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface RoleConfig {
  label: string;
  tagline: string;
  accent: "amber" | "wine";
  nav: NavItem[];
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  facilitator: "Facilitator",
  kitchen_manager: "Kitchen Manager",
  security_officer: "Security Officer",
};

const base = (role: Role): NavItem[] => [
  { label: "Overview", href: `/dashboard/${role}`, icon: LayoutDashboard },
];

export const ROLES: Record<Role, RoleConfig> = {
  super_admin: {
    label: "Super Admin",
    tagline: "Global platform control",
    accent: "wine",
    nav: [
      ...base("super_admin"),
      { label: "Campuses", href: "/dashboard/super_admin/campuses", icon: Globe },
      { label: "Classes", href: "/dashboard/super_admin/classes", icon: GraduationCap },
      { label: "Drafts", href: "/dashboard/super_admin/drafts", icon: ClipboardCheck },
      { label: "Subscriptions", href: "/dashboard/super_admin/subscriptions", icon: CreditCard },
      { label: "Global Analytics", href: "/dashboard/super_admin/analytics", icon: BarChart3 },
      { label: "Fraud Reports", href: "/dashboard/super_admin/fraud", icon: ShieldCheck, badge: "4" },
      { label: "Audit Logs", href: "/dashboard/super_admin/audit", icon: ScrollText },
      { label: "Settings", href: "/dashboard/super_admin/settings", icon: Settings },
    ],
  },
  facilitator: {
    label: "Facilitator",
    tagline: "Take & manage attendance",
    accent: "amber",
    nav: [
      ...base("facilitator"),
      { label: "Take Attendance", href: "/dashboard/facilitator/session", icon: ClipboardCheck },
      { label: "Drafts", href: "/dashboard/facilitator/drafts", icon: ClipboardCheck },
      { label: "My Classes", href: "/dashboard/facilitator/classes", icon: CalendarClock },
      { label: "Students", href: "/dashboard/facilitator/students", icon: GraduationCap },
      { label: "Reports", href: "/dashboard/facilitator/reports", icon: FileText },
    ],
  },
  kitchen_manager: {
    label: "Kitchen Manager",
    tagline: "Meal planning & service",
    accent: "wine",
    nav: [
      ...base("kitchen_manager"),
      { label: "Daily Menu", href: "/dashboard/kitchen_manager/menu", icon: Soup },
      { label: "Meal Demand", href: "/dashboard/kitchen_manager/demand", icon: UtensilsCrossed },
      { label: "Food Analytics", href: "/dashboard/kitchen_manager/analytics", icon: BarChart3 },
      { label: "Reports", href: "/dashboard/kitchen_manager/reports", icon: FileText },
    ],
  },
  security_officer: {
    label: "Security Officer",
    tagline: "Campus safety & integrity",
    accent: "wine",
    nav: [
      ...base("security_officer"),
      { label: "Live Heatmap", href: "/dashboard/security_officer/heatmap", icon: MapPin },
      { label: "Fraud Detection", href: "/dashboard/security_officer/fraud", icon: ShieldCheck, badge: "3" },
      { label: "Audit Logs", href: "/dashboard/security_officer/audit", icon: ScrollText },
      { label: "Alerts", href: "/dashboard/security_officer/alerts", icon: Bell },
    ],
  },
};

export const ALL_ROLES = Object.keys(ROLES) as Role[];
