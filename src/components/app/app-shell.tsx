import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Plus,
  ReceiptText,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./brand";
import { TxDialogProvider, useTxDialog } from "./transaction-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type DictKey, type Lang } from "@/lib/i18n";
import { useUpdateProfile } from "@/lib/queries";
import { useCurrentUser, useDisplayName, useNotifications, useProfile } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

const NAV: { to: string; key: DictKey; icon: typeof LayoutDashboard }[] = [
  { to: "/dashboard", key: "nav_dashboard", icon: LayoutDashboard },
  { to: "/income", key: "nav_income", icon: TrendingUp },
  { to: "/expenses", key: "nav_expenses", icon: TrendingDown },
  { to: "/transactions", key: "nav_transactions", icon: ReceiptText },
  { to: "/budget", key: "nav_budget", icon: PiggyBank },
  { to: "/cards", key: "nav_cards", icon: CreditCard },
  { to: "/notifications", key: "nav_notifications", icon: Bell },
  { to: "/settings", key: "nav_settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TxDialogProvider>
      <ShellInner>{children}</ShellInner>
    </TxDialogProvider>
  );
}

function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const name = useDisplayName();
  const user = useCurrentUser();
  const unread = useNotifications().filter((n) => !n.is_read).length;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const signOut = useSignOut();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 pb-6 pt-7">
        <BrandMark onDark />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map(({ to, key, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-[18px]" />
              <span className="flex-1">{t(key)}</span>
              {to === "/notifications" && unread > 0 && (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold leading-5",
                    active ? "bg-sidebar-primary-foreground text-sidebar-primary" : "bg-expense text-on-dark",
                  )}
                >
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl bg-sidebar-accent p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-display font-bold text-accent-foreground">
            {(name[0] ?? "S").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{name}</p>
            <p className="truncate text-xs opacity-70">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border py-2 text-xs font-semibold transition hover:bg-sidebar hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-3.5" /> {t("logout")}
        </button>
      </div>
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  const user = useCurrentUser();
  const update = useUpdateProfile(user.id);
  const choose = (l: Lang) => {
    setLang(l);
    update.mutate({ language: l });
  };
  return (
    <div className="flex rounded-full border border-border bg-card p-0.5 text-xs font-bold">
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => choose(l)}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition",
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const { t, setLang } = useI18n();
  const profile = useProfile();
  const unread = useNotifications().filter((n) => !n.is_read).length;
  const { open } = useTxDialog();
  const [mobileOpen, setMobileOpen] = useState(false);

  // The profile's saved language wins once signed in.
  useEffect(() => {
    if (profile?.language === "vi" || profile?.language === "en") setLang(profile.language);
  }, [profile?.language, setLang]);

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-none p-0">
          <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t("menu")}
          >
            <Menu className="size-5" />
          </Button>
          <BrandMark className="lg:hidden" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <Link
              to="/notifications"
              className="relative grid size-9 place-items-center rounded-full border border-border bg-card transition hover:bg-muted"
              aria-label={t("nav_notifications")}
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-expense text-[10px] font-bold text-on-dark">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Button onClick={() => open()} className="hidden sm:inline-flex">
              <Plus /> {t("add_transaction")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">{children}</main>

      <Button
        onClick={() => open()}
        size="icon"
        className="fixed bottom-5 right-5 z-30 size-14 rounded-full shadow-lift sm:hidden"
        aria-label={t("add_transaction")}
      >
        <Plus className="size-6" />
      </Button>
    </div>
  );
}
