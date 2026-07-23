import { User, Bell, Lock, Laptop, Sliders, ShieldAlert, Key, Database, CreditCard, Plug } from "lucide-react";
import { AdminRole } from "@/types";

export type SettingsTabId =
  | "account"
  | "ui-notifications"
  | "security"
  | "devices"
  | "preferences"
  | "audit"
  | "api-keys"
  | "privacy"
  | "billing"
  | "integrations";

export interface SettingsTabConfig {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: any;
  allowedRoles?: AdminRole[];
  founderOnly?: boolean;
}

export const SETTINGS_TABS: SettingsTabConfig[] = [
  {
    id: "account",
    label: "My Account",
    description: "Manage avatar, contact details, and basic profile info",
    icon: User
  },
  {
    id: "ui-notifications",
    label: "UI & Notifications",
    description: "Theme presets, font sizing, and email alert preferences",
    icon: Bell
  },
  {
    id: "security",
    label: "Security & Password",
    description: "Password change, strength validation, and recent logins",
    icon: Lock
  },
  {
    id: "devices",
    label: "Connected Devices",
    description: "Active login sessions across browsers and devices",
    icon: Laptop
  },
  {
    id: "preferences",
    label: "Preferences & Defaults",
    description: "Default trip views, date formats, and timezone settings",
    icon: Sliders
  },
  {
    id: "audit",
    label: "Audit & Activity",
    description: "System event logs and CSV activity export",
    icon: ShieldAlert,
    allowedRoles: ["superadmin", "admin"]
  },
  {
    id: "api-keys",
    label: "API Keys",
    description: "Programmatic access keys and webhook credentials",
    icon: Key,
    founderOnly: true
  },
  {
    id: "privacy",
    label: "Data & Privacy",
    description: "JSON data export, GDPR controls, and account deactivation",
    icon: Database
  },
  {
    id: "billing",
    label: "Billing & Subscription",
    description: "Plan tiers, invoice history, and payment details",
    icon: CreditCard,
    founderOnly: true
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connect WhatsApp, SMS gateways, and Payment Providers",
    icon: Plug,
    allowedRoles: ["superadmin", "admin"]
  }
];

export function isTabVisible(tab: SettingsTabConfig, userRole?: AdminRole, userEmail?: string | null): boolean {
  if (!userRole) return false;
  const email = (userEmail || "").toLowerCase().trim();
  const isFounder = userRole === "superadmin" && (email === "hemal.patel@youthcamping.online" || email.includes("hemal"));

  if (tab.founderOnly && !isFounder) return false;
  if (tab.allowedRoles && !tab.allowedRoles.includes(userRole) && !isFounder) return false;

  return true;
}
