const FD_BASE = "https://api.football-data.org/v4";
const SM_BASE = "https://api.smarkets.com/v3";

const TEAM_FLAGS: Record<string, string> = {
  Argentina: "🇦🇷", Brazil: "🇧🇷", France: "🇫🇷", Germany: "🇩🇪",
  Spain: "🇪🇸", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Portugal: "🇵🇹", Netherlands: "🇳🇱",
  Belgium: "🇧🇪", Croatia: "🇭🇷", Uruguay: "🇺🇾", Colombia: "🇨🇴",
  Ecuador: "🇪🇨", Mexico: "🇲🇽", "United States": "🇺🇸", USA: "🇺🇸",
  Canada: "🇨🇦", Morocco: "🇲🇦", Senegal: "🇸🇳", Nigeria: "🇳🇬",
  Cameroon: "🇨🇲", Egypt: "🇪🇬", Ghana: "🇬🇭", Algeria: "🇩🇿",
  Tunisia: "🇹🇳", "Ivory Coast": "🇨🇮", "Côte d'Ivoire": "🇨🇮",
  Japan: "🇯🇵", "South Korea": "🇰🇷", "Korea Republic": "🇰🇷",
  Australia: "🇦🇺", Iran: "🇮🇷", "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦",
  Turkey: "🇹🇷", Poland: "🇵🇱", Serbia: "🇷🇸", Switzerland: "🇨🇭",
  Denmark: "🇩🇰", Sweden: "🇸🇪", Austria: "🇦🇹", Ukraine: "🇺🇦",
  Romania: "🇷🇴", Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Norway: "🇳🇴",
  Paraguay: "🇵🇾", Chile: "🇨🇱", Bolivia: "🇧🇴", Venezuela: "🇻🇪",
  Peru: "🇵🇪", "New Zealand": "🇳🇿", Panama: "🇵🇦", "Costa Rica": "🇨🇷",
  Honduras: "🇭🇳", Jamaica: "🇯🇲", "El Salvador": "🇸🇻",
  Uzbekistan: "🇺🇿", Indonesia: "🇮🇩", China: "🇨🇳", "China PR": "🇨🇳",
  Mali: "🇲🇱", Tanzania: "🇹🇿", "DR Congo": "🇨🇩", Zambia: "🇿🇲",
  Zimbabwe: "🇿🇼", Guinea: "🇬🇳", "Cabo Verde": "🇨🇻",
  "Czech Republic": "🇨🇿", Slovakia: "🇸🇰", Hungary: "🇭🇺",
  Slovenia: "🇸🇮", Albania: "🇦🇱", Greece: "🇬🇷", Israel: "🇮🇱",
};

interface FDTeam { name: string; shortName: string }
interface FDMatch {
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  utcDate: string;
  score: { fullTime: { home: number | null; away: number | null } };
  status: string;
}
interface FDStandingEntry {
  position: number;
  team: { name: string; shortName: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string | null;
}

// ── football-data.org ──────────────────────────────────────────────────────

async function fdFetch(path: string): Promise<unknown> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${FD_BASE}${path}`, {
      headers: { "X-Auth-Token": key },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchMatches(from: string, to: string, status: string): Promise<FDMatch[]> {
  const data = await fdFetch(
    `/competitions/WC/matches?dateFrom=${from}&dateTo=${to}&status=${status}`
  ) as { matches?: FDMatch[] } | null;
  return data?.matches ?? [];
}

async function fetchStandingMap(): Promise<Map<string, FDStandingEntry & { group: string }>> {
  const data = await fdFetch("/competitions/WC/standings") as {
    standings?: { group: string; table: FDStandingEntry[] }[]
  } | null;
  const map = new Map<string, FDStandingEntry & { group: string }>();
  for (const group of data?.standings ?? []) {
    for (const entry of group.table) {
      map.set(entry.team.name, { ...entry, group: group.group });
    }
  }
  return map;
}

// ── Smarkets Exchange (public read API, no auth required) ──────────────────

async function smGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SM_BASE}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

interface SmEvent { id: string; name: string; start_datetime: string }
interface SmMarket { id: string; event_id: string; type: string; name: string }
interface SmContract { id: string; market_id: string; name: string; display_name?: string }

function teamsMatchEvent(eventName: string, home: string, away: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const ev = norm(eventName);
  const homeWords = norm(home).split(" ").filter((w) => w.length > 2);
  const awayWords = norm(away).split(" ").filter((w) => w.length > 2);
  return homeWords.some((w) => ev.includes(w)) && awayWords.some((w) => ev.includes(w));
}

async function fetchCorrectScore(
  match: FDMatch
): Promise<{ score: string; probability: number } | null> {
  const utc = new Date(match.utcDate);
  const from = new Date(utc.getTime() - 60 * 60 * 1000).toISOString();
  const to = new Date(utc.getTime() + 60 * 60 * 1000).toISOString();

  // Step 1: Find the Smarkets event matching this fixture
  const eventsData = await smGet<{ events: SmEvent[] }>(
    `/events/?type_names=football_match&start_datetime_min=${encodeURIComponent(from)}&start_datetime_max=${encodeURIComponent(to)}&limit=50`
  );
  const event = eventsData?.events?.find((e) =>
    teamsMatchEvent(e.name, match.homeTeam.name, match.awayTeam.name)
  );
  if (!event) return null;

  // Step 2: Find the correct score market for this event
  const marketsData = await smGet<{ markets: SmMarket[] }>(
    `/markets/?event_ids=${event.id}`
  );
  const market = marketsData?.markets?.find(
    (m) => m.type === "correct_score" || m.name?.toLowerCase().includes("correct score")
  );
  if (!market) return null;

  // Step 3: Get contracts (score options) and best back prices in parallel
  type QuotesResponse = {
    quotes: Record<string, { bids?: { price: number; quantity: number }[] }>
  };
  const [contractsData, quotesData] = await Promise.all([
    smGet<{ contracts: SmContract[] }>(`/contracts/?market_ids=${market.id}`),
    smGet<QuotesResponse>(`/quotes/?market_ids=${market.id}&per_side=1`),
  ]);
  if (!contractsData?.contracts?.length || !quotesData?.quotes) return null;

  // Score names are like "1-0", "2-1", "0-0" — filter out "Any Other" variants
  const scorePattern = /^\d+\s*[–\-]\s*\d+$/;
  const candidates: { name: string; price: number }[] = [];
  let totalPrice = 0;

  for (const contract of contractsData.contracts) {
    const name = (contract.display_name || contract.name).trim();
    if (!scorePattern.test(name)) continue;
    const bestBid = quotesData.quotes[contract.id]?.bids?.[0]?.price;
    if (!bestBid || bestBid <= 0) continue;
    candidates.push({ name, price: bestBid });
    totalPrice += bestBid;
  }

  if (!candidates.length || totalPrice === 0) return null;

  // Highest price = most likely; normalize across all candidates to get probability
  const best = candidates.reduce((a, b) => (a.price > b.price ? a : b));
  return {
    score: best.name.replace(/\s*[–\-]\s*/, "–"),
    probability: Math.round((best.price / totalPrice) * 100),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function dateStr(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jerusalem" });
}

function timeStr(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
    hourCycle: "h23",
  });
}

function flag(name: string): string {
  return TEAM_FLAGS[name] ?? "⚽";
}

function formatForm(form: string | null): string {
  if (!form) return "";
  const labels: Record<string, string> = { W: "נ", D: "ת", L: "ה" };
  return form.split(",").map((c) => labels[c] ?? c).join("");
}

// ── Main export ────────────────────────────────────────────────────────────

export async function buildWCMessage(): Promise<string | null> {
  if (!process.env.FOOTBALL_DATA_API_KEY) return null;

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nowMs = now.getTime();

  const [recentRaw, upcomingRaw, standingMap] = await Promise.all([
    fetchMatches(dateStr(yesterday), dateStr(now), "FINISHED"),
    fetchMatches(dateStr(now), dateStr(tomorrow), "SCHEDULED"),
    fetchStandingMap(),
  ]);

  const results = recentRaw.filter((m) => {
    const t = new Date(m.utcDate).getTime();
    return t >= nowMs - 24 * 60 * 60 * 1000 && t <= nowMs;
  });

  const upcoming = upcomingRaw
    .filter((m) => {
      const t = new Date(m.utcDate).getTime();
      return t > nowMs && t <= nowMs + 24 * 60 * 60 * 1000;
    })
    .slice(0, 3);

  if (!results.length && !upcoming.length) return null;

  const lines: string[] = ["⚽ מונדיאל 2026"];

  if (results.length) {
    lines.push("", "📊 תוצאות (24 שעות אחרונות, שעון ישראל):");
    for (const m of results) {
      const hs = m.score.fullTime.home;
      const as_ = m.score.fullTime.away;
      lines.push(
        `${flag(m.homeTeam.name)} ${m.homeTeam.shortName} ${hs}–${as_} ${m.awayTeam.shortName} ${flag(m.awayTeam.name)}  |  ${timeStr(m.utcDate)}`
      );
    }
  }

  if (upcoming.length) {
    lines.push("", "🔮 משחקים הקרובים:");

    for (const m of upcoming) {
      lines.push(
        "",
        `${flag(m.homeTeam.name)} ${m.homeTeam.shortName} vs ${m.awayTeam.shortName} ${flag(m.awayTeam.name)}  |  ${timeStr(m.utcDate)}`
      );

      const hS = standingMap.get(m.homeTeam.name);
      const aS = standingMap.get(m.awayTeam.name);
      const parts: string[] = [];
      if (hS && hS.playedGames > 0) {
        const f = hS.form ? ` (${formatForm(hS.form)})` : "";
        parts.push(
          `${m.homeTeam.shortName} מקום ${hS.position} בקבוצה — ${hS.points} נקודות, ${hS.goalsFor}:${hS.goalsAgainst} שערים${f}.`
        );
      }
      if (aS && aS.playedGames > 0) {
        const f = aS.form ? ` (${formatForm(aS.form)})` : "";
        parts.push(
          `${m.awayTeam.shortName} מקום ${aS.position} — ${aS.points} נקודות, ${aS.goalsFor}:${aS.goalsAgainst} שערים${f}.`
        );
      }
      if (parts.length) lines.push(parts.join(" "));

      // Exact score probability from Smarkets (no auth needed; skipped silently if unavailable)
      const odds = await fetchCorrectScore(m);
      if (odds) {
        lines.push(`→ תוצאה סבירה ביותר: ${odds.score} | ${odds.probability}%`);
      }
    }
  }

  return lines.join("\n");
}
