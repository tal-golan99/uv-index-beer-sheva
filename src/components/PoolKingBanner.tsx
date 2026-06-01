interface PoolKingProps {
  name: string;
  avatarUrl: string | null;
  totalHours: number;
}

export default function PoolKingBanner({ name, avatarUrl, totalHours }: PoolKingProps) {
  const hoursLabel =
    totalHours >= 1
      ? `${Math.floor(totalHours)} שעות`
      : `${Math.round(totalHours * 60)} דקות`;

  return (
    <div
      className="anim-rise flex items-center gap-3 rounded-2xl px-4 py-3 shadow-pool-sm"
      style={{
        background: "linear-gradient(90deg, var(--color-sun-300) 0%, var(--color-sun-400) 50%, var(--color-sun-300) 100%)",
        boxShadow: "0 4px 14px -4px rgba(219,154,8,0.35)",
        outline: "1px solid rgba(219,154,8,0.35)",
      }}
      aria-label="מלך הבריכה השבוע"
    >
      {/* Crown + Avatar */}
      <div className="relative shrink-0">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl leading-none select-none" aria-hidden>
          👑
        </span>
        <div
          className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-[color:var(--color-sun-500)] ring-offset-1"
          style={{ background: "var(--color-sun-300)" }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg">🏊</div>
          )}
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-[color:var(--color-sun-500)]">👑 מלך הבריכה השבוע</p>
        <p className="truncate text-sm font-extrabold text-[color:var(--color-ink)]">{name}</p>
        <p className="text-[10px] text-[color:var(--color-ink-2)]">{hoursLabel} בבריכה</p>
      </div>
    </div>
  );
}
