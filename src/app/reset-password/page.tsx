import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  // Following the emailed link signs the team in, so reaching this page
  // without a session means the link is stale.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <LogoMark className="mx-auto h-16 w-auto" />
        <h1 className="mt-4 text-2xl font-semibold">
          {user ? "Set a new password" : "This link has expired"}
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          {user
            ? "Pick something the whole team can remember - this is the only login."
            : "Reset links are single use and time limited. Ask for a fresh one."}
        </p>
      </div>

      <div className="card p-6 sm:p-7">
        {user ? (
          <ResetPasswordForm />
        ) : (
          <Link href="/forgot-password" className="btn btn-primary w-full">
            Send a new link
          </Link>
        )}
      </div>
    </div>
  );
}
