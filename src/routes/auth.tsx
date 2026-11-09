import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/app/brand";
import { PublicLangSwitch } from "@/components/app/lang-switch";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined } => ({
    mode: s["mode"] === "signup" ? "signup" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · Student Wallet" },
      { name: "description", content: "Sign in or create your free Student Wallet account." },
      { property: "og:title", content: "Sign in · Student Wallet" },
      { property: "og:description", content: "Sign in or create your free Student Wallet account." },
    ],
  }),
  component: AuthPage,
});

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/dashboard", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim().slice(0, 80), language: lang },
          },
        });
        if (error) throw error;
        if (!data.session) setSentTo(email.trim());
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      toast.error(t("enter_email_first"));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(t("reset_sent", { email: email.trim() }));
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message ?? t("error_generic"));
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero relative hidden flex-col justify-between p-10 text-on-dark lg:flex">
        <BrandMark onDark />
        <div>
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">{t("landing_title")}</h2>
          <p className="mt-4 max-w-md text-on-dark-muted">{t("landing_sub")}</p>
        </div>
        <p className="text-xs text-on-dark-muted">© Student Wallet</p>
      </div>

      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:invisible">
            <BrandMark />
          </Link>
          <PublicLangSwitch />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {sentTo ? (
            <div className="text-center animate-rise">
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                <MailCheck className="size-7" />
              </div>
              <h1 className="text-2xl font-bold">{t("check_email")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("check_email_sub", { email: sentTo })}</p>
              <Button variant="soft" className="mt-6" onClick={() => { setSentTo(null); setMode("signin"); }}>
                {t("back_to_sign_in")}
              </Button>
            </div>
          ) : (
            <div className="animate-rise">
              <h1 className="text-3xl font-bold">{mode === "signin" ? t("sign_in_title") : t("sign_up_title")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "signin" ? t("sign_in_sub") : t("sign_up_sub")}
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={onGoogle}
                className="mt-7 h-11 w-full gap-2.5 rounded-xl border-[#747775] bg-[#FFFFFF] text-[14px] font-medium text-[#1F1F1F] hover:bg-[#F8F8F8] hover:text-[#1F1F1F]"
              >
                <GoogleLogo /> {t("continue_google")}
              </Button>

              <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> {t("or")} <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="a-name">{t("full_name")}</Label>
                    <Input id="a-name" required maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="a-email">{t("email")}</Label>
                  <Input id="a-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="a-pass">{t("password")}</Label>
                    {mode === "signin" && (
                      <button type="button" onClick={onForgot} className="text-xs font-semibold text-primary">
                        {t("forgot_password")}
                      </button>
                    )}
                  </div>
                  <Input
                    id="a-pass"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    placeholder={mode === "signup" ? t("password_min") : undefined}
                  />
                </div>
                <Button type="submit" className="h-11 w-full rounded-xl text-base" disabled={busy}>
                  {busy ? t("loading") : mode === "signin" ? t("sign_in") : t("sign_up")}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? t("no_account") : t("have_account")}{" "}
                <button
                  type="button"
                  className="font-semibold text-primary"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? t("sign_up") : t("sign_in")}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
