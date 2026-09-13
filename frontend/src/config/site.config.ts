import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mainNav: NavItem[];
}

export const siteConfig: SiteConfig = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: env.APP_URL,
  ogImage: "/og.png",
  mainNav: [
    {
      title: "Overview",
      href: "/admin",
    },
    {
      title: "Live Chat",
      href: "/admin/inbox",
    },
    {
      title: "Orders",
      href: "/admin/orders",
    },
    {
      title: "Inventory",
      href: "/admin/inventory",
    },
    {
      title: "AI Knowledge",
      href: "/admin/knowledge",
    },
  ],
};
