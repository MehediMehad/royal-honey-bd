"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider">
          <span>Error 404</span>
        </div>

        <div className="relative">
          <h1 className="text-8xl font-black text-foreground/10 select-none tracking-tight">
            404
          </h1>
          <p className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-foreground">
            Page Not Found
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          The requested operations page does not exist or has been moved.
        </p>

        <div className="flex items-center justify-center pt-2">
          <Link href="/admin">
            <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 px-6 gap-2 shadow-xs">
              <Home className="size-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
