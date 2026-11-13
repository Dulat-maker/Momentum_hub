"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  type ActionState,
  failure,
  safeInternalPath,
  success,
} from "@/lib/action-state";
import { text } from "@/lib/form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { PROGRAM_LABELS, type Program, isProgram } from "@/lib/types";

const NOT_CONFIGURED =
  "Supabase is not connected yet. Add the two keys to .env.local and restart the dev server.";

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return failure(NOT_CONFIGURED);

  const teamNumberRaw = text(formData, "team_number");
  const teamNumber = Number(teamNumberRaw);
  const programRaw = text(formData, "program");
  const program: Program = isProgram(programRaw) ? programRaw : "ftc";
  const teamName = text(formData, "team_name");
  const city = text(formData, "city");
  const country = text(formData, "country") || "Kazakhstan";
  const email = text(formData, "email");
  const password = text(formData, "password");
  const passwordRepeat = text(formData, "password_repeat");

  if (!Number.isInteger(teamNumber) || teamNumber <= 0) {
    return failure("Enter your team number, for example 12345.");
  }
  if (teamName.length < 2) return failure("Enter your team name.");
  if (!city) return failure("Enter the city your team is based in.");
  if (!email.includes("@")) return failure("Enter a valid email address.");
  if (password.length < 8) {
    return failure("Use a password of at least 8 characters.");
  }
  if (password !== passwordRepeat) return failure("The passwords do not match.");

  const supabase = await createClient();

  // Numbers repeat across programmes, so the pair is what has to be free.
  const { data: taken } = await supabase
    .from("teams")
    .select("team_number")
    .eq("program", program)
    .eq("team_number", teamNumber)
    .maybeSingle();

  if (taken) {
    return failure(
      `${PROGRAM_LABELS[program]} team ${teamNumber} already has an account on the hub. Log in instead, or ask whoever registered it for the password.`,
    );
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const origin =
    requestHeaders.get("origin") ?? (host ? `https://${host}` : undefined);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      data: {
        program,
        team_number: String(teamNumber),
        team_name: teamName,
        city,
        country,
      },
    },
  });

  if (error) {
    // Accounts are keyed by email, and a team is its account - so one address
    // cannot carry two teams.
    if (/already registered|already exists|user_already_exists/i.test(error.message)) {
      return failure(
        "That email already has an account on the hub. Each team needs its own address - log in instead, or register this team with a different email.",
      );
    }

    // A unique-violation on the programme and number pair surfaces as a
    // generic database error.
    if (/database error/i.test(error.message)) {
      return failure(
        `Could not create the account - ${PROGRAM_LABELS[program]} team ${teamNumber} may have just been registered by someone else. Try logging in.`,
      );
    }

    return failure(error.message);
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
