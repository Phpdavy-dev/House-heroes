import { Assignment, Chore, ChoreLog, Profile } from "./types";
import {
  addDays,
  dayKey,
  daysElapsedThisWeek,
  daysLeftThisWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "./dates";

export const WEEK_GOAL_CHORES = 7; // gemiddeld 1 klus per dag

/** Alleen deze bewoners mogen klusjes goedkeuren */
export const APPROVER_NAMES = ["Manuela", "Davy"];

export function canApprove(p: Profile): boolean {
  return APPROVER_NAMES.includes(p.name);
}

export const LEVELS = [
  { name: "Beginner", emoji: "🌱", min: 0 },
  { name: "Helper", emoji: "🧤", min: 250 },
  { name: "Huishoudheld", emoji: "🦸", min: 750 },
  { name: "Superheld", emoji: "⚡", min: 1500 },
  { name: "Legende", emoji: "👑", min: 3000 },
];

export function approvedLogs(logs: ChoreLog[]): ChoreLog[] {
  return logs.filter((l) => l.status === "approved");
}

export function logsOf(logs: ChoreLog[], userId: number): ChoreLog[] {
  return logs.filter((l) => l.user_id === userId);
}

export function logsBetween(logs: ChoreLog[], from: Date, to?: Date): ChoreLog[] {
  const f = from.getTime();
  const t = to ? to.getTime() : Infinity;
  return logs.filter((l) => {
    const time = new Date(l.created_at).getTime();
    return time >= f && time < t;
  });
}

export function sumPoints(logs: ChoreLog[]): number {
  return logs.reduce((s, l) => s + l.points, 0);
}

export function levelFor(totalPoints: number) {
  let current = LEVELS[0];
  for (const lv of LEVELS) if (totalPoints >= lv.min) current = lv;
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] ?? null;
  const progress = next
    ? (totalPoints - current.min) / (next.min - current.min)
    : 1;
  return { current, next, progress: Math.min(1, Math.max(0, progress)) };
}

/** Huidige en langste streak: opeenvolgende dagen met ≥1 goedgekeurde klus */
export function streaks(userApproved: ChoreLog[]) {
  const days = new Set(userApproved.map((l) => dayKey(new Date(l.created_at))));
  if (days.size === 0) return { current: 0, longest: 0 };

  // langste streak
  const sorted = Array.from(days).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    if (startOfDay(addDays(prev, 1)).getTime() === startOfDay(cur).getTime()) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // huidige streak (vandaag of gisteren telt nog mee)
  let current = 0;
  let cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  while (days.has(dayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

export type GoalStatus = "voor" | "op_schema" | "bijna_achter" | "achter";

export function weekGoalStatus(choresDoneThisWeek: number): {
  status: GoalStatus;
  expected: number;
  diff: number;
} {
  const expected = Math.min(daysElapsedThisWeek(), WEEK_GOAL_CHORES);
  const diff = choresDoneThisWeek - expected;
  let status: GoalStatus;
  if (diff > 0) status = "voor";
  else if (diff === 0) status = "op_schema";
  else if (diff === -1) status = "bijna_achter";
  else status = "achter";
  return { status, expected, diff };
}

export type RankRow = {
  profile: Profile;
  points: number;
  chores: number;
  rank: number;
  trend: "up" | "down" | "same";
};

export function ranking(
  profiles: Profile[],
  logs: ChoreLog[],
  from: Date,
  to?: Date,
  prevFrom?: Date,
  prevTo?: Date
): RankRow[] {
  const inRange = logsBetween(approvedLogs(logs), from, to);
  const rows = profiles.map((p) => {
    const mine = logsOf(inRange, p.id);
    return { profile: p, points: sumPoints(mine), chores: mine.length };
  });
  rows.sort((a, b) => b.points - a.points || b.chores - a.chores);

  let prevRanks: Map<number, number> | null = null;
  if (prevFrom) {
    const prev = logsBetween(approvedLogs(logs), prevFrom, prevTo);
    const prevRows = profiles
      .map((p) => ({ id: p.id, points: sumPoints(logsOf(prev, p.id)) }))
      .sort((a, b) => b.points - a.points);
    prevRanks = new Map(prevRows.map((r, i) => [r.id, i + 1]));
  }

  return rows.map((r, i) => {
    const rank = i + 1;
    let trend: RankRow["trend"] = "same";
    if (prevRanks) {
      const prev = prevRanks.get(r.profile.id) ?? rank;
      trend = rank < prev ? "up" : rank > prev ? "down" : "same";
    }
    return { ...r, rank, trend };
  });
}

export type Achievement = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  earned: boolean;
};

export function achievementsFor(
  userApproved: ChoreLog[],
  chores: Chore[]
): Achievement[] {
  const byCategory = (cat: string) =>
    userApproved.filter(
      (l) => chores.find((c) => c.id === l.chore_id)?.category === cat
    ).length;

  // beste week ooit (punten per ISO-weekstart)
  const weekTotals = new Map<string, number>();
  for (const l of userApproved) {
    const k = startOfWeek(new Date(l.created_at)).toISOString();
    weekTotals.set(k, (weekTotals.get(k) ?? 0) + l.points);
  }
  const bestWeek = Math.max(0, ...Array.from(weekTotals.values()));
  const { longest } = streaks(userApproved);

  return [
    { id: "first", name: "Eerste klus", emoji: "🎉", desc: "Voltooi je eerste klus", earned: userApproved.length >= 1 },
    { id: "streak7", name: "Week-streak", emoji: "🔥", desc: "7 dagen achter elkaar actief", earned: longest >= 7 },
    { id: "week100", name: "Powerweek", emoji: "💪", desc: "100 punten in één week", earned: bestWeek >= 100 },
    { id: "kitchen", name: "Koning van de keuken", emoji: "👨‍🍳", desc: "20 keukenklusjes gedaan", earned: byCategory("keuken") >= 20 },
    { id: "laundry", name: "Waskampioen", emoji: "🧺", desc: "15 wasklusjes gedaan", earned: byCategory("was") >= 15 },
    { id: "clean", name: "Schoonmaakbaas", emoji: "✨", desc: "25 schoonmaakklusjes gedaan", earned: byCategory("schoonmaak") >= 25 },
    { id: "fifty", name: "Halve honderd", emoji: "🏅", desc: "50 klusjes in totaal", earned: userApproved.length >= 50 },
  ];
}

export type Notice = { id: string; text: string; tone: "good" | "warn" | "bad" | "info" };

export function noticesFor(
  me: Profile,
  profiles: Profile[],
  logs: ChoreLog[]
): Notice[] {
  const out: Notice[] = [];
  const weekStart = startOfWeek();
  const approved = approvedLogs(logs);
  const myWeek = logsOf(logsBetween(approved, weekStart), me.id);
  const { status, diff } = weekGoalStatus(myWeek.length);

  // goedkeuringen die op mij wachten (alleen voor goedkeurders)
  const pendingOthers = canApprove(me)
    ? logs.filter((l) => l.status === "pending" && l.user_id !== me.id).length
    : 0;
  if (pendingOthers > 0)
    out.push({
      id: "pending",
      text: `${pendingOthers} klusje${pendingOthers > 1 ? "s" : ""} van huisgenoten wacht${pendingOthers > 1 ? "en" : ""} op jouw goedkeuring.`,
      tone: "info",
    });

  const myPending = logs.filter(
    (l) => l.status === "pending" && l.user_id === me.id
  ).length;
  if (myPending > 0)
    out.push({
      id: "mypending",
      text: `${myPending} van jouw klusjes wacht${myPending > 1 ? "en" : ""} nog op goedkeuring.`,
      tone: "info",
    });

  if (status === "achter")
    out.push({ id: "behind", text: `Je loopt ${Math.abs(diff)} klusjes achter op je weekdoel.`, tone: "bad" });
  if (status === "bijna_achter")
    out.push({ id: "almost", text: "Nog 1 klusje nodig om op schema te komen.", tone: "warn" });
  if (status === "voor")
    out.push({ id: "ahead", text: "Goed bezig! Je ligt voor op schema. 🎉", tone: "good" });

  const left = daysLeftThisWeek();
  if (left <= 3 && myWeek.length < WEEK_GOAL_CHORES)
    out.push({
      id: "daysleft",
      text: `Nog ${left === 0 ? "vandaag" : `${left + 1} dagen`} om je weekdoel te halen.`,
      tone: "warn",
    });

  // wie staat vlak boven me?
  const rows = ranking(profiles, logs, weekStart);
  const myRow = rows.find((r) => r.profile.id === me.id);
  if (myRow && myRow.rank > 1) {
    const above = rows[myRow.rank - 2];
    const gap = above.points - myRow.points;
    if (gap > 0 && gap <= 30)
      out.push({
        id: "rival",
        text: `${above.profile.name} staat maar ${gap} punten voor je. Inhalen!`,
        tone: "info",
      });
  }
  if (myRow && myRow.trend === "down")
    out.push({ id: "overtaken", text: "Je bent ingehaald op het scorebord. 👀", tone: "warn" });

  return out;
}

// ===== Vaste taken per weekdag =====

export const WEEKDAY_NAMES = [
  "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag",
];

/** Vandaag als ISO-weekdag: 1 = maandag ... 7 = zondag */
export function todayWeekday(now: Date = new Date()): number {
  return ((now.getDay() + 6) % 7) + 1;
}

export type TodayTask = {
  assignment: Assignment;
  chore: Chore | undefined;
  done: boolean;
};

/** Vaste taken van deze persoon voor vandaag, incl. of ze al geregistreerd zijn */
export function todayTasksFor(
  userId: number,
  assignments: Assignment[],
  chores: Chore[],
  logs: ChoreLog[],
  now: Date = new Date()
): TodayTask[] {
  const wd = todayWeekday(now);
  const todayStart = startOfDay(now).getTime();
  return assignments
    .filter((a) => a.user_id === userId && a.weekday === wd)
    .map((a) => {
      const done = logs.some(
        (l) =>
          l.user_id === userId &&
          l.chore_id === a.chore_id &&
          l.status !== "rejected" &&
          new Date(l.created_at).getTime() >= todayStart
      );
      return { assignment: a, chore: chores.find((c) => c.id === a.chore_id), done };
    });
}

/** Meldingen voor openstaande vaste taken van vandaag */
export function taskNoticesFor(
  userId: number,
  assignments: Assignment[],
  chores: Chore[],
  logs: ChoreLog[]
): Notice[] {
  return todayTasksFor(userId, assignments, chores, logs)
    .filter((t) => !t.done && t.chore)
    .map((t) => ({
      id: `task-${t.assignment.id}`,
      text: `📌 Vandaag jouw vaste taak: ${t.chore!.name} (+${t.chore!.points} ptn)`,
      tone: "warn" as const,
    }));
}
