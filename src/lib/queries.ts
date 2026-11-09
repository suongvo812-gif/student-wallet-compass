import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type { Tx, TxType } from "./finance";

export type Profile = Tables<"profiles">;
export type Budget = Tables<"budgets">;
export type Card = Tables<"cards">;
export type Notification = Tables<"notifications">;

const PAGE = 1000;

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const transactionsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["transactions", userId],
    queryFn: async (): Promise<Tx[]> => {
      const all: Tx[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("transactions")
          .select("id,type,amount,category,description,occurred_on,card_id,created_at")
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        all.push(
          ...data.map((r) => ({ ...r, type: r.type as TxType, amount: Number(r.amount) })),
        );
        if (data.length < PAGE) break;
      }
      return all;
    },
  });

export const budgetsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["budgets", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("*").order("category");
      if (error) throw error;
      return data.map((b) => ({ ...b, monthly_limit: Number(b.monthly_limit) }));
    },
  });

export const cardsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["cards", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("cards").select("*").order("created_at");
      if (error) throw error;
      return data.map((c) => ({ ...c, credit_limit: Number(c.credit_limit) }));
    },
  });

export const notificationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export type TxInput = {
  type: TxType;
  amount: number;
  category: string;
  description: string;
  occurred_on: string;
  card_id: string | null;
};

export function useSaveTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | undefined; input: TxInput }) => {
      if (id) {
        const { error } = await supabase.from("transactions").update(input).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidate("transactions", "notifications"),
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate("transactions"),
  });
}

export function useSaveBudget() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | undefined; input: TablesInsert<"budgets"> }) => {
      const q = id
        ? supabase.from("budgets").update(input).eq("id", id)
        : supabase.from("budgets").insert(input);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => invalidate("budgets"),
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate("budgets"),
  });
}

export function useSaveCard() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string | undefined; input: TablesInsert<"cards"> }) => {
      const q = id
        ? supabase.from("cards").update(input).eq("id", id)
        : supabase.from("cards").insert(input);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => invalidate("cards"),
  });
}

export function useDeleteCard() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate("cards", "transactions"),
  });
}

export function useMarkNotifications() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => invalidate("notifications"),
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate("notifications"),
  });
}

export function useUpdateProfile(userId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: TablesUpdate<"profiles">) => {
      const { error } = await supabase.from("profiles").update(input).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => invalidate("profile"),
  });
}
