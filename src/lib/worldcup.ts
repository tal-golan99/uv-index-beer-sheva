const FD_BASE = "https://api.football-data.org/v4";
const SM_BASE = "https://api.smarkets.com/v3";
const OA_BASE = "https://api.the-odds-api.com/v4";

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
  Haiti: "🇭🇹",
};

const TEAM_NAMES_HE: Record<string, string> = {
  Argentina: "ארגנטינה",
  Brazil: "ברזיל",
  France: "צרפת",
  Germany: "גרמניה",
  Spain: "ספרד",
  England: "אנגליה",
  Portugal: "פורטוגל",
  Netherlands: "הולנד",
  Belgium: "בלגיה",
  Croatia: "קרואטיה",
  Uruguay: "אורוגוואי",
  Colombia: "קולומביה",
  Ecuador: "אקוואדור",
  Mexico: "מקסיקו",
  "United States": 'ארה"ב',
  USA: 'ארה"ב',
  Canada: "קנדה",
  Morocco: "מרוקו",
  Senegal: "סנגל",
  Nigeria: "ניגריה",
  Cameroon: "קמרון",
  Egypt: "מצרים",
  Ghana: "גאנה",
  Algeria: "אלג'יריה",
  Tunisia: "תוניסיה",
  "Ivory Coast": "חוף השנהב",
  "Côte d'Ivoire": "חוף השנהב",
  Japan: "יפן",
  "South Korea": "קוריאה ד.",
  "Korea Republic": "קוריאה ד.",
  Australia: "אוסטרליה",
  Iran: "איראן",
  "Saudi Arabia": "ערב הסעודית",
  Qatar: "קטאר",
  Turkey: "טורקיה",
  Poland: "פולין",
  Serbia: "סרביה",
  Switzerland: "שוויץ",
  Denmark: "דנמרק",
  Sweden: "שוודיה",
  Austria: "אוסטריה",
  Ukraine: "אוקראינה",
  Romania: "רומניה",
  Wales: "וויילס",
  Scotland: "סקוטלנד",
  Norway: "נורווגיה",
  Paraguay: "פרגוואי",
  Chile: "צ'ילה",
  Bolivia: "בוליביה",
  Venezuela: "ונצואלה",
  Peru: "פרו",
  "New Zealand": "ניו זילנד",
  Panama: "פנמה",
  "Costa Rica": "קוסטה ריקה",
  Honduras: "הונדורס",
  Jamaica: "ג'מייקה",
  "El Salvador": "אל סלבדור",
  Uzbekistan: "אוזבקיסטן",
  Indonesia: "אינדונזיה",
  China: "סין",
  "China PR": "סין",
  Mali: "מאלי",
  Tanzania: "טנזניה",
  "DR Congo": "קונגו",
  Zambia: "זמביה",
  "Czech Republic": "צ'כיה",
  Slovakia: "סלובקיה",
  Hungary: "הונגריה",
  Slovenia: "סלובניה",
  Albania: "אלבניה",
  Greece: "יוון",
  Israel: "ישראל",
  Haiti: "האיטי",
};

function hebrewName(name: string): string {
  return TEAM_NAMES_HE[name] ?? name;
}

interface FDTeam { name: string; shortName: string }
interface FDMatch {
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  utcDate: string;
  score: { fullTime: { home: number | null; away: number | null } };
  status: string;
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

  const eventsData = await smGet<{ events: SmEvent[] }>(
    `/events/?type_names=football_match&start_datetime_min=${encodeURIComponent(from)}&start_datetime_max=${encodeURIComponent(to)}&limit=50`
  );
  const event = eventsData?.events?.find((e) =>
    teamsMatchEvent(e.name, match.homeTeam.name, match.awayTeam.name)
  );
  if (!event) return null;

  const marketsData = await smGet<{ markets: SmMarket[] }>(
    `/markets/?event_ids=${event.id}`
  );
  const market = marketsData?.markets?.find(
    (m) => m.type === "correct_score" || m.name?.toLowerCase().includes("correct score")
  );
  if (!market) return null;

  type QuotesResponse = {
    quotes: Record<string, { bids?: { price: number; quantity: number }[] }>
  };
  const [contractsData, quotesData] = await Promise.all([
    smGet<{ contracts: SmContract[] }>(`/contracts/?market_ids=${market.id}`),
    smGet<QuotesResponse>(`/quotes/?market_ids=${market.id}&per_side=1`),
  ]);
  if (!contractsData?.contracts?.length || !quotesData?.quotes) return null;

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

  const best = candidates.reduce((a, b) => (a.price > b.price ? a : b));
  return {
    score: best.name.replace(/\s*[–\-]\s*/, "–"),
    probability: Math.round((best.price / totalPrice) * 100),
  };
}

// ── TheOddsAPI — win/draw/loss probabilities ───────────────────────────────

interface OddsGame {
  home_team: string;
  away_team: string;
  bookmakers: {
    markets: {
      key: string;
      outcomes: { name: string; price: number }[];
    }[];
  }[];
}

async function fetchWinDrawLoss(
  match: FDMatch,
  from: string,
  to: string
): Promise<{ homeWin: number; draw: number; awayWin: number } | null> {
  const key = process.env.THE_ODDS_API_KEY;
  if (!key) return null;
  try {
    const url = `${OA_BASE}/sports/soccer_fifa_world_cup_2026/odds/?apiKey=${key}&regions=eu&markets=h2h&dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const games: OddsGame[] = await res.json();

    const game = games.find((g) =>
      teamsMatchEvent(`${g.home_team} ${g.away_team}`, match.homeTeam.name, match.awayTeam.name)
    );
    if (!game) return null;

    const outcomes = game.bookmakers
      .flatMap((b) => b.markets)
      .find((m) => m.key === "h2h")?.outcomes;
    if (!outcomes || outcomes.length < 2) return null;

    const probs = outcomes.map((o) => ({ name: o.name, p: 1 / o.price }));
    const total = probs.reduce((s, o) => s + o.p, 0);

    const normPct = (name: string) =>
      Math.round((probs.find((o) => o.name === name)?.p ?? 0) / total * 100);

    const homeWin = normPct(game.home_team);
    const awayWin = normPct(game.away_team);
    const draw = 100 - homeWin - awayWin;

    return { homeWin, draw: Math.max(0, draw), awayWin };
  } catch {
    return null;
  }
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


// ── Main export ────────────────────────────────────────────────────────────

export async function buildWCMessage(): Promise<string | null> {
  if (!process.env.FOOTBALL_DATA_API_KEY) return null;

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nowMs = now.getTime();

  const [recentRaw, upcomingRaw] = await Promise.all([
    fetchMatches(dateStr(yesterday), dateStr(now), "FINISHED"),
    fetchMatches(dateStr(now), dateStr(tomorrow), "SCHEDULED"),
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
      const heH = hebrewName(m.homeTeam.name);
      const heA = hebrewName(m.awayTeam.name);
      lines.push(
        `${flag(m.homeTeam.name)} ${heH} ${hs}–${as_} ${heA} ${flag(m.awayTeam.name)}  |  ${timeStr(m.utcDate)}`
      );
    }
  }

  if (upcoming.length) {
    lines.push("", "🔮 משחקים הקרובים:");

    for (const m of upcoming) {
      const heH = hebrewName(m.homeTeam.name);
      const heA = hebrewName(m.awayTeam.name);

      lines.push(
        "",
        `${flag(m.homeTeam.name)} ${heH} vs ${heA} ${flag(m.awayTeam.name)}  |  ${timeStr(m.utcDate)}`
      );

      // Win/draw/loss from TheOddsAPI (2h window around kickoff)
      const matchFrom = new Date(new Date(m.utcDate).getTime() - 2 * 60 * 60 * 1000).toISOString();
      const matchTo = new Date(new Date(m.utcDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
      const wdl = await fetchWinDrawLoss(m, matchFrom, matchTo);
      if (wdl) {
        lines.push(`→ ניצחון ${heH} ${wdl.homeWin}% | תיקו ${wdl.draw}% | ניצחון ${heA} ${wdl.awayWin}%`);
      }

      // Exact score probability from Smarkets (silently skipped if unavailable)
      const odds = await fetchCorrectScore(m);
      if (odds) {
        lines.push(`→ תוצאה סבירה ביותר: ${odds.score} | ${odds.probability}%`);
      }
    }
  }

  return lines.join("\n");
}
