import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm, AuthFormFromParams } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Arcade Vault",
};

export default function LoginPage() {
  return (
    // Prerendered fallback shows the default tab until search params are known
    <Suspense fallback={<AuthForm />}>
      <AuthFormFromParams />
    </Suspense>
  );
}
