"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Crown,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/auth-context";
import { loginSchema, LoginInput } from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const getRedirectPath = (): string => {
    const customRedirect = searchParams.get("redirect");
    if (
      customRedirect &&
      customRedirect.startsWith("/") &&
      !customRedirect.startsWith("//") &&
      !customRedirect.includes(":")
    ) {
      return customRedirect;
    }
    return "/admin";
  };

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(values);

      if (response.success) {
        const targetPath = getRedirectPath();
        router.push(targetPath);
      } else {
        setError(response.message || "Failed to log in");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid credentials or server error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, password: string) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
    form.handleSubmit(onSubmit)();
  };

  return (
    <Card className="border-border shadow-md max-w-md w-full mx-auto">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/30 mb-1">
          <Crown className="size-7" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight text-foreground">
          Royal Honey <span className="text-amber-500">BD</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Operations & Live AI Management Portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold">
              Email or Phone
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="admin@royalhoneybd.com"
              autoComplete="email"
              disabled={isLoading}
              className="rounded-xl"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive font-medium">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="pr-10 rounded-xl"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive font-medium">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 shadow-md shadow-amber-500/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In to Operations"
            )}
          </Button>
        </form>

        {/* Quick Admin Access Button */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <KeyRound className="size-3.5" />
            <span>Instant Admin Access</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              handleQuickLogin("admin@royalhoneybd.com", "AdminPassword123!")
            }
            disabled={isLoading}
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 transition-all text-left"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-foreground">
              <ShieldCheck className="size-4 text-amber-500" />
              <span>Super Admin (Seeded)</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Click to Auto-fill & Login
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
