import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Language switch for public pages (no account needed). */
export function PublicLangSwitch({ onDark }: { onDark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={cn(
        "flex rounded-full border p-0.5 text-xs font-bold",
        onDark ? "border-on-dark/25 bg-on-dark/10" : "border-border bg-card",
      )}
    >
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition",
            lang === l
              ? onDark
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground"
              : onDark
                ? "text-on-dark-muted"
                : "text-muted-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
