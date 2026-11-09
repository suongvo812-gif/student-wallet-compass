import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/app-shell";
import {
  budgetsQuery,
  cardsQuery,
  notificationsQuery,
  profileQuery,
  transactionsQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  loader: async ({ context }) => {
    const id = context.user.id;
    const qc = context.queryClient;
    await Promise.all([
      qc.ensureQueryData(profileQuery(id)),
      qc.ensureQueryData(transactionsQuery(id)),
      qc.ensureQueryData(budgetsQuery(id)),
      qc.ensureQueryData(cardsQuery(id)),
      qc.ensureQueryData(notificationsQuery(id)),
    ]);
  },
  pendingComponent: LoadingScreen,
  component: AuthenticatedLayout,
});

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="size-10 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
    </div>
  );
}

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
