"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Boxes,
  Bot,
  BarChart3,
  LogOut,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const royalHoneyNavItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Analytics & Growth",
    href: "/admin/analytics",
    icon: BarChart3,
    badge: "BI",
  },
  {
    title: "Live Chat & Takeover",
    href: "/admin/inbox",
    icon: MessageSquare,
    badge: "Live",
  },
  {
    title: "Orders & Payments",
    href: "/admin/orders",
    icon: ShoppingCart,
    badge: null,
  },
  {
    title: "Inventory & Restock",
    href: "/admin/inventory",
    icon: Boxes,
    badge: null,
  },
  {
    title: "AI Knowledge Base",
    href: "/admin/knowledge",
    icon: Bot,
    badge: "RAG",
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onNavigate }) => {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      toast.success("Logging out...");
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout error. Redirecting to login...");
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "flex h-full w-64 flex-col border-r border-border bg-card text-card-foreground shadow-xs",
          className
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center gap-3 border-b border-border/80 px-6">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-extrabold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              🍯
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-foreground leading-none flex items-center gap-1">
                Royal Honey <span className="text-amber-500">BD</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase pt-1 flex items-center gap-1">
                <Sparkles className="size-2.5 text-amber-500" /> Operations Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Operations Menu
          </div>
          {royalHoneyNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      isActive ? "text-white" : "text-muted-foreground"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Account Badge */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
            {!mounted || (isLoading && !user) ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-2.5 w-32 rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {userInitials}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-foreground truncate">
                    {user?.name || "Admin"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user?.email || "admin@royalhoneybd.com"}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-1">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground">
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to log out of{" "}
              <span className="font-bold text-foreground">Royal Honey BD Admin</span>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              disabled={isLoggingOut}
              className="rounded-xl border-border hover:bg-muted font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="rounded-xl font-semibold px-5"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span>Logging out...</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
