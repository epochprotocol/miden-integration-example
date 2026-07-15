type Tone = "neutral" | "emerald";

interface ToneStyle {
  card: string;
  label: string;
  link: string;
  value: string;
  valuePlain: string;
}

// Full strings — Tailwind only sees literals, never concatenation.
const TONE_STYLES: Record<Tone, ToneStyle> = {
  neutral: {
    card: "rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm",
    label: "text-[11px] uppercase tracking-wide text-neutral-500",
    link: "text-[11px] font-medium text-neutral-600 underline hover:text-neutral-900",
    value:
      "mt-0.5 block font-mono text-[12px] text-neutral-700 break-all underline decoration-neutral-300 hover:decoration-neutral-700",
    valuePlain: "mt-0.5 font-mono text-[12px] text-neutral-700 break-all",
  },
  emerald: {
    card: "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm",
    label: "text-[11px] font-semibold uppercase tracking-wide text-emerald-800",
    link: "text-[11px] font-medium text-emerald-700 underline hover:text-emerald-900",
    value:
      "mt-0.5 block font-mono text-[12px] text-emerald-900 break-all underline decoration-emerald-300 hover:decoration-emerald-700",
    valuePlain: "mt-0.5 font-mono text-[12px] text-emerald-900 break-all",
  },
};

interface Props {
  label: string;
  value: string;
  /** Omitted when the chain has no known explorer. */
  href?: string;
  linkLabel: string;
  tone: Tone;
}

export function ExplorerHashCard({
  label,
  value,
  href,
  linkLabel,
  tone,
}: Props) {
  const styles = TONE_STYLES[tone];

  return (
    <div className={styles.card}>
      <div className="flex items-center justify-between gap-2">
        <div className={styles.label}>{label}</div>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.link}
          >
            {linkLabel} ↗
          </a>
        )}
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={styles.value}
        >
          {value}
        </a>
      ) : (
        <div className={styles.valuePlain}>{value}</div>
      )}
    </div>
  );
}
