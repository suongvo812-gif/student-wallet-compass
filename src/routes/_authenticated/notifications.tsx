import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BellOff, CheckCheck, PartyPopper, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/app/page-header";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useDeleteNotification, useMarkNotifications, type Notification } from "@/lib/queries";
import { useMoney, useNotifications } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Student Wallet" },
      { name: "description", content: "Budget alerts and account notifications." },
      { property: "og:title", content: "Notifications · Student Wallet" },
      { property: "og:description", content: "Budget alerts and account notifications." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t, cat, lang } = useI18n();
  const money = useMoney();
  const items = useNotifications();
  const mark = useMarkNotifications();
  const del = useDeleteNotification();
  const unread = items.filter((n) => !n.is_read);
  const dt = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  const render = (n: Notification) => {
    const p = (n.params ?? {}) as Record<string, string | number>;
    const vars = {
      category: p["category"] ? cat(String(p["category"])) : "",
      percent: p["percent"] ?? "",
      spent: p["spent"] != null ? money(Number(p["spent"])) : "",
      limit: p["limit"] != null ? money(Number(p["limit"])) : "",
    };
    const titleKey = `notif_${n.title_key}_title` as DictKey;
    const bodyKey = `notif_${n.title_key}_body` as DictKey;
    return { title: t(titleKey, vars), body: t(bodyKey, vars) };
  };

  return (
    <div>
      <PageHeader
        title={t("nav_notifications")}
        subtitle={t("notifications_sub")}
        actions={
          unread.length > 0 && (
            <Button variant="outline" onClick={() => mark.mutate(unread.map((n) => n.id))}>
              <CheckCheck /> {t("mark_all_read")}
            </Button>
          )
        }
      />
      <div className="surface p-2 sm:p-3">
        {items.length === 0 ? (
          <EmptyState icon={<BellOff className="size-6" />} title={t("no_notifications")} />
        ) : (
          <ul className="space-y-1">
            {items.map((n) => {
              const { title, body } = render(n);
              const Icon = n.kind === "danger" ? ShieldAlert : n.kind === "warning" ? AlertTriangle : PartyPopper;
              return (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && mark.mutate([n.id])}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-muted",
                    !n.is_read && "bg-primary-soft/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      n.kind === "danger"
                        ? "bg-expense-soft text-expense"
                        : n.kind === "warning"
                          ? "bg-warning-soft text-warning"
                          : "bg-primary-soft text-primary",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {title}
                      {!n.is_read && <span className="size-2 rounded-full bg-primary" aria-label={t("unread")} />}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{dt.format(new Date(n.created_at))}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={t("delete")}
                    onClick={(e) => {
                      e.stopPropagation();
                      del.mutate(n.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
