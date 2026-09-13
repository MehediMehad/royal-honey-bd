import Link from "next/link";
import { siteConfig } from "@/config";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            C
          </span>
          {siteConfig.name}
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">{children}</div>
    </div>
  );
}
