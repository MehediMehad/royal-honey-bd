import type { Metadata } from "next";
import { siteConfig } from "@/config";
import { AuthProvider } from "@/features/auth";
import { cn } from "@/lib/utils";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Royal Honey BD — Operations & AI Support Portal",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased")} data-scroll-behavior="smooth">
      <body className="min-h-full bg-background font-sans text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
