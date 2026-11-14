"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  type ActionState,
  failure,
  formValues,
  safeInternalPath,
  success,
} from "@/lib/action-state";
import { text } from "@/lib/form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const NOT_CONFIGURED =
  "Supabase is not connected yet. Add the two keys to .env.local and restart the dev server.";

/**
 * Registers a person, not a team.
 *
 * A team used to BE an account, which meant a team of ten either shared one
 * password or showed up on the hub ten times. Now everyone has their own
 * login; a team is made, or joined, afterwards.
 */
export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return failure(NOT_CONFIGURED);

  const fullName = text(formData, "full_name");
  const email = text(formData, "email");
  const password = text(formData, "password");
  const passwordRepeat = text(formData, "password_repeat");

  // The passwords are deliberately left out of what comes back.
  const keep = { values: formValues(formData) };

  if (fullName.length < 2) {
    return failure("Enter your name.", { ...keep, field: "full_name" });
  }
  if (!email.includes("@")) {
    return failure("Enter a valid email address.", { ...keep, field: "email" });
  }
  if (password.length < 8) {
    return failure("Use a password of at least 8 characters.", {
      ...keep,
      field: "password",
    });
  }
  if (password !== passwordRepeat) {
    return failure("The passwords do not match.", {
      ...keep,
      field: "password_repeat",
    });
  }

  const supabase = await createClient();

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const origin =
    requestHeaders.get("origin") ?? (host ? `https://${host}` : undefined);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (
      /already registered|already exists|user_already_exists/i.test(
        error.message,
      )
    ) {
      return failure(
        "That email already has an account. Log in instead, or reset the password if you have forgotten it.",
        { ...keep, field: "email" },
      );
    }

    return failure(error.message, keep);
  }

  if (!data.session) redirect("/login?pending=1");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return failure(NOT_CONFIGURED);

  const email = text(formData, "email");
  const password = text(formData, "password");
  const next = safeInternalPath(formData.get("next"), "/dashboard");

  if (!email || !password) return failure("Enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return failure(
      error.message === "Invalid login credentials"
        ? "That email and password do not match an account."
        : error.message,
    );
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/**
 * Sends the reset link. The reply never says whether the address has an
 * account - that would turn this form into a way of testing which teams are
 * registered under which email.
 */
export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return failure(NOT_CONFIGURED);

  const email = text(formData, "email");
  if (!email.includes("@")) {
    return failure("Enter the email address your team registered with.");
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const origin =
    requestHeaders.get("origin") ?? (host ? `https://${host}` : undefined);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin
      ? `${origin}/auth/callback?next=/reset-password`
      : undefined,
  });

  // Worth surfacing: the sender is rate limited and the team should wait.
  if (error && /rate|too many|limit/i.test(error.message)) {
    return failure(
      "Too many reset emails have gone out recently. Wait a few minutes and try again.",
    );
  }

  return success(
    "If that address has an account, a reset link is on its way. Check the inbox, and the spam folder.",
  );
}

/** Runs once the emailed link has signed the team back in. */
export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return failure(NOT_CONFIGURED);

  const password = text(formData, "password");
  const passwordRepeat = text(formData, "password_repeat");

  if (password.length < 8) {
    return failure("Use a password of at least 8 characters.");
  }
  if (password !== passwordRepeat) return failure("The passwords do not match.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return failure(
      "This reset link has expired or was already used. Ask for a new one.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return failure(error.message);

  revalidatePath("/", "layout");
  redirect("/dashboard?password=updated");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
