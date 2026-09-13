import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign In | Royal Honey BD",
  description: "Sign in to Royal Honey BD Operations Portal",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
