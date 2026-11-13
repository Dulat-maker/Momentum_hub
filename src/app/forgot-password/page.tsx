import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <LogoMark className="mx-auto h-16 w-auto" />
        <h1 className="mt-4 text-2xl font-semibold">Locked out?</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          We will email a link that lets you set a new password.
        </p>
      </div>

      <div className="card p-6 sm:p-7">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-fg-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4 hover:decoration-brand-mid"
        >
          Back to log in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-fg-dim">
        The link goes to the address the team registered with. If nobody can
        reach that inbox any more, a mentor can change it in the Supabase
        dashboard.
      </p>
    </div>
  );
}
