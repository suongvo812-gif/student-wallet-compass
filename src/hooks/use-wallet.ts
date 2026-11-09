import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useCallback } from "react";
import { formatMoney, monthKeyOf } from "@/lib/finance";
import { useI18n } from "@/lib/i18n";
import {
  budgetsQuery,
  cardsQuery,
  notificationsQuery,
  profileQuery,
  transactionsQuery,
} from "@/lib/queries";

const authRoute = getRouteApi("/_authenticated");

export function useCurrentUser() {
  return authRoute.useRouteContext().user;
}

export function useProfile() {
  const user = useCurrentUser();
  return useSuspenseQuery(profileQuery(user.id)).data;
}

export function useTransactions() {
  const user = useCurrentUser();
  return useSuspenseQuery(transactionsQuery(user.id)).data;
}

export function useBudgets() {
  const user = useCurrentUser();
  return useSuspenseQuery(budgetsQuery(user.id)).data;
}

export function useCards() {
  const user = useCurrentUser();
  return useSuspenseQuery(cardsQuery(user.id)).data;
}

export function useNotifications() {
  const user = useCurrentUser();
  return useSuspenseQuery(notificationsQuery(user.id)).data;
}

export function useDisplayName() {
  const user = useCurrentUser();
  const profile = useProfile();
  const meta = user.user_metadata as Record<string, string | undefined>;
  return profile?.full_name || meta["full_name"] || meta["name"] || user.email?.split("@")[0] || "";
}

export function useMoney() {
  const { lang } = useI18n();
  const profile = useProfile();
  const currency = profile?.currency ?? "VND";
  return useCallback((n: number) => formatMoney(n, currency, lang), [currency, lang]);
}

export function currentMonthKey() {
  return monthKeyOf(new Date());
}
