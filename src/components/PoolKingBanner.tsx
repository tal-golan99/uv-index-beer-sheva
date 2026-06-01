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
      className="anim-rise flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 ring-amber-300 shadow-pool-sm"
      style={{
        background: "linear-gradient(90deg, #fef9c3 0%, #fde68a 50%, #fef3c7 100%)",
      }}
      aria-label="מלך הבריכה השבוע"
    >
      {/* Crown + Avatar */}
      <div className="relative shrink-0">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl leading-none select-none" aria-hidden>
          👑
        </span>
        <div className="h-10 w-10 rounded-full ring-2 ring-amber-400 ring-offset-1 overflow-hidden bg-amber-100">
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
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">מלך הבריכה השבוע</p>
        <p className="truncate text-sm font-extrabold text-amber-900">{name}</p>
        <p className="text-[10px] text-amber-700">{hoursLabel} בבריכה</p>
      </div>
    </div>
  );
}
