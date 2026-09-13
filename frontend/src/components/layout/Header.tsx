"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "./Sidebar";
import { AudioAlert } from "./AudioAlert";
import { useAuth } from "@/features/auth/context/auth-context";

export const Header = () => {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getHeaderInfo = () => {
    let title = "Operations Overview";
    if (pathname.includes("/inbox")) title = "Live Chat & Takeover";
    else if (pathname.includes("/orders")) title = "Orders & Payment Verification";
    else if (pathname.includes("/inventory")) title = "Inventory & Restock";
    else if (pathname.includes("/knowledge")) title = "AI Knowledge Base";
    return { section: "Royal Honey BD", title };
  };

  const { section, title } = getHeaderInfo();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const roleLabel =
    user?.role === "OWNER"
      ? "Store Owner (Admin)"
      : user?.role === "SUPPORT_AGENT"
        ? "Support Agent"
        : "Administrator";

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-border/70 bg-background/95 px-4 sm:px-8 backdrop-blur-md">
      {/* Left: Mobile Menu Trigger + Breadcrumb Title */}
      <div className="flex items-center gap-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="flex size-10 md:hidden items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <span>{section}</span>
            <ChevronRight className="size-3" />
            <span className="font-medium text-foreground">{title}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Sound Alert + Profile */}
      <div className="flex items-center gap-3">
        {/* Audio Alert Toggle */}
        <AudioAlert />

        {/* User Profile Dropdown */}
        {!mounted || (isLoading && !user) ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-1.5 pr-3">
            <Skeleton className="size-8 rounded-lg" />
            <div className="hidden sm:flex flex-col gap-1.5 text-left">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-2 w-14 rounded" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl border border-border bg-background p-1.5 pr-3 transition-colors hover:bg-muted outline-none">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-xs font-black text-amber-600 dark:text-amber-400">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-foreground leading-tight truncate max-w-36">
                  {user?.name || "Admin"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-36">
                  {roleLabel}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-foreground truncate">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "admin@royalhoneybd.com"}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 pt-0.5">
                      <ShieldCheck className="size-3" />
                      <span>{roleLabel}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};
