import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BellRing, ShieldCheck, TrendingUp, Utensils, Bus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app/brand";
import { PublicLangSwitch } from "@/components/app/lang-switch";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Wallet — Personal finance for students" },
      {
        name: "description",
        content: "Track income and expenses, set budgets, manage credit cards and get spending alerts. Built for students.",
      },
      { property: "og:title", content: "Student Wallet — Personal finance for students" },
      {
        property: "og:description",
        content: "Track income and expenses, set budgets and get spending alerts. Built for students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const features = [
    { icon: TrendingUp, title: t("feat_track"), sub: t("feat_track_sub") },
    { icon: BellRing, title: t("feat_budget"), sub: t("feat_budget_sub") },
    { icon: ShieldCheck, title: t("feat_private"), sub: t("feat_private_sub") },
  ];

  return (
    <div className="bg-hero min-h-screen text-on-dark">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandMark onDark />
        <div className="flex items-center gap-3">
          <PublicLangSwitch onDark />
          <Button asChild variant="onDark" size="sm">
            <Link to="/auth">{t("sign_in")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-2 lg:pt-20">
        <div className="animate-rise">
          <p className="mb-4 inline-flex rounded-full border border-on-dark/20 bg-on-dark/10 px-3 py-1 text-xs font-semibold text-accent">
            {t("tagline")}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">{t("landing_title")}</h1>
          <p className="mt-5 max-w-lg text-base text-on-dark-muted sm:text-lg">{t("landing_sub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg" className="h-12 rounded-xl px-6 text-base">
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("get_started")} <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="onDark" size="lg" className="h-12 rounded-xl px-6 text-base">
              <Link to="/auth">{t("sign_in")}</Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}>
                <f.icon className="mb-2 size-5 text-accent" />
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-on-dark-muted">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:120ms]" aria-hidden>
          <div className="skin-primary relative rotate-[-4deg] overflow-hidden rounded-3xl p-6 shadow-lift">
            <div className="dot-grid absolute inset-0 opacity-50" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-on-dark-muted">{t("total_balance")}</p>
              <p className="tabular mt-2 font-display text-4xl font-bold">4.250.000 ₫</p>
              <div className="mt-6 flex gap-3 text-xs">
                <span className="rounded-full bg-on-dark/15 px-3 py-1">+6.000.000 ₫</span>
                <span className="rounded-full bg-on-dark/15 px-3 py-1">−1.750.000 ₫</span>
              </div>
            </div>
          </div>
          <div className="relative -mt-6 ml-8 rotate-[2deg] rounded-3xl bg-card p-5 text-card-foreground shadow-lift">
            {[
              { icon: Utensils, label: t("cat_food"), v: "−45.000 ₫" },
              { icon: Bus, label: t("cat_transport"), v: "−12.000 ₫" },
              { icon: BookOpen, label: t("cat_education"), v: "−180.000 ₫" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3 py-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <r.icon className="size-4" />
                </span>
                <span className="flex-1 text-sm font-semibold">{r.label}</span>
                <span className="tabular text-sm font-bold text-expense">{r.v}</span>
              </div>
            ))}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[72%] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
