import type { Metadata } from "next";
import Link from "next/link";

import { ErrorAlert, InfoNote } from "@/components/alert";
import { LogoMark } from "@/components/icons";
import { SetupNotice } from "@/components/setup-notice";
import { safeInternalPath } from "@/lib/action-state";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeInternalPath(params.next, "/dashboard");

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
        <h1 className="mt-4 text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          Your own account - the one you signed up with.
        </p>
      </div>

      <div className="card space-y-4 p-6 sm:p-7">
        {params.pending ? (
          <InfoNote>
            Almost there - check your inbox and click the confirmation link, then
            log in here.
          </InfoNote>
        ) : null}

        {params.error === "link" ? (
          <ErrorAlert message="That confirmation link is expired or already used. Try logging in, or register again." />
        ) : null}

        <LoginForm next={next} />
      </div>

      <p className="mt-5 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-fg-muted underline decoration-line underline-offset-4 hover:text-fg hover:decoration-brand-mid"
        >
          Forgot the password?
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-fg-muted">
        New here?{" "}
        <Link
          href="/signup"
          className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4 hover:decoration-brand-mid"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
