import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/app/brand";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · Student Wallet" },
      { name: "description", content: "Choose a new password for your Student Wallet account." },
      { property: "og:title", content: "Reset password · Student Wallet" },
      { property: "og:description", content: "Choose a new password for your Student Wallet account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("reset_done"));
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="surface w-full max-w-sm p-7">
        <BrandMark />
        <h1 className="mt-6 text-2xl font-bold">{t("reset_title")}</h1>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-pass">{t("new_password")}</Label>
            <Input id="r-pass" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password_min")} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {t("save")}
          </Button>
        </form>
        <Link to="/auth" className="mt-4 block text-center text-sm font-semibold text-primary">
          {t("back_to_sign_in")}
        </Link>
      </div>
    </div>
  );
}
