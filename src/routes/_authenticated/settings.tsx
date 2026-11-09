import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/app/page-header";
import { useI18n, type Lang } from "@/lib/i18n";
import { useUpdateProfile } from "@/lib/queries";
import { useCurrentUser, useDisplayName, useProfile } from "@/hooks/use-wallet";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Student Wallet" },
      { name: "description", content: "Manage your profile, language and currency." },
      { property: "og:title", content: "Settings · Student Wallet" },
      { property: "og:description", content: "Manage your profile, language and currency." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, setLang } = useI18n();
  const user = useCurrentUser();
  const profile = useProfile();
  const displayName = useDisplayName();
  const update = useUpdateProfile(user.id);
  const [fullName, setFullName] = useState(profile?.full_name || displayName);
  const [school, setSchool] = useState(profile?.school ?? "");
  const [language, setLanguage] = useState<Lang>((profile?.language as Lang) ?? "vi");
  const [currency, setCurrency] = useState(profile?.currency ?? "VND");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({
        full_name: fullName.trim().slice(0, 80),
        school: school.trim().slice(0, 120) || null,
        language,
        currency,
      });
      setLang(language);
      toast.success(t("saved"));
    } catch {
      toast.error(t("error_generic"));
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("nav_settings")} subtitle={t("settings_sub")} />
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="surface space-y-4 p-6">
          <h2 className="text-lg font-bold">{t("profile")}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="s-name">{t("full_name")}</Label>
            <Input id="s-name" required maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-school">{t("school")}</Label>
            <Input id="s-school" maxLength={120} value={school} onChange={(e) => setSchool(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-email">{t("email")}</Label>
            <Input id="s-email" value={user.email ?? ""} disabled />
          </div>
        </section>
        <section className="surface grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="text-lg font-bold sm:col-span-2">{t("preferences")}</h2>
          <div className="space-y-1.5">
            <Label>{t("language")}</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Lang)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("currency")}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VND">VND (₫)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
        <Button type="submit" size="lg" disabled={update.isPending}>
          {t("save_changes")}
        </Button>
      </form>
    </div>
  );
}
