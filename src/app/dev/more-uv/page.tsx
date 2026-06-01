import Image from "next/image";
import Link from "next/link";

function OptionA() {
  return (
    <Link href="/more" className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-[#f7bd24]" />
        <div className="relative h-14 w-14 rounded-full overflow-hidden ring-[3px] ring-[#f7bd24] shadow-lg">
          <Image src="/more/IMG_9931.JPG" alt="More UV" fill sizes="56px" className="object-cover" />
        </div>
      </div>
      <span className="text-[11px] font-black text-[#c49a00]">More UV ✨</span>
    </Link>
  );
}

function OptionB() {
  return (
    <Link
      href="/more"
      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
      style={{ background: "linear-gradient(90deg, #0a73ad, #f7bd24)" }}
    >
      <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 ring-2 ring-white/40">
        <Image src="/more/IMG_9931.JPG" alt="" fill sizes="28px" className="object-cover" />
      </div>
      <span className="whitespace-nowrap">More UV ✨</span>
    </Link>
  );
}

function OptionC() {
  return (
    <Link href="/more" className="flex flex-col items-center gap-1">
      <div className="relative h-12 w-12">
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: "conic-gradient(from 0deg, #f7bd24, #3fa9e3, #a855f7, #f7bd24)",
            animationDuration: "6s",
          }}
        />
        <div
          className="absolute inset-[2.5px] rounded-full overflow-hidden"
          style={{ boxShadow: "0 0 10px 2px rgba(247,189,36,0.45)" }}
        >
          <Image src="/more/IMG_9931.JPG" alt="More UV" fill sizes="48px" className="object-cover" />
        </div>
      </div>
      <span className="text-[10px] font-black text-[#0a73ad]">More UV ✨</span>
    </Link>
  );
}

export default function MoreUVPreview() {
  return (
    <div className="min-h-screen bg-[#f0f7fc] flex flex-col items-center justify-center gap-14 p-8" dir="rtl">
      <h1 className="text-xl font-black text-[#0c1b29]">More UV — 3 עיצובים</h1>

      {([
        { label: "A — עיגול גדול 56px + pulse צהוב", comp: <OptionA /> },
        { label: "B — Pill אופקי עם גרדיאנט", comp: <OptionB /> },
        { label: "C — Ring מסתובב + glow", comp: <OptionC /> },
      ] as { label: string; comp: React.ReactNode }[]).map(({ label, comp }) => (
        <div key={label} className="flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-[#4a6a80]">{label}</p>
          <div className="flex items-center justify-between w-72 rounded-2xl bg-white shadow-md px-5 py-3">
            <div className="text-base font-black text-[#0a73ad]">UV Pool ☀️</div>
            <div className="flex items-center gap-2">
              {comp}
              <div className="h-9 w-9 rounded-full bg-[#e0ecf5] flex items-center justify-center text-xs text-[#4a6a80]">👤</div>
            </div>
          </div>
        </div>
      ))}

      <p className="text-xs text-[#8fafc0] mt-4">דף פיתוח זמני — יימחק לאחר הבחירה</p>
    </div>
  );
}
