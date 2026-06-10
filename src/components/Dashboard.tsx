"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useHouseData } from "@/lib/useData";
import { Profile } from "@/lib/types";
import {
  addDays,
  daysElapsedThisWeek,
  formatTime,
  startOfMonth,
  startOfWeek,
} from "@/lib/dates";
import {
  approvedLogs,
  levelFor,
  logsBetween,
  logsOf,
  noticesFor,
  ranking,
  streaks,
  sumPoints,
  weekGoalStatus,
  WEEK_GOAL_CHORES,
} from "@/lib/gamification";
import { playApprove, playGoal } from "@/lib/sounds";

type HouseData = ReturnType<typeof useHouseData>;

const TONE_STYLES: Record<string, string> = {
  good: "bg-teal-soft text-teal-deep dark:bg-teal/20 dark:text-teal",
  warn: "bg-sun-soft text-amber-700 dark:bg-sun/20 dark:text-sun",
  bad: "bg-coral-soft text-coral-deep dark:bg-coral/20 dark:text-coral",
  info: "bg-ink/5 text-ink/70 dark:bg-cream/10 dark:text-cream/70",
};

export default function Dashboard({
  me,
  data,
  goLog,
}: {
  me: Profile;
  data: HouseData;
  goLog: () => void;
}) {
  const { profiles, chores, logs, decideLog } = data;
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const approved = approvedLogs(logs);

  const myWeek = logsOf(logsBetween(approved, weekStart), me.id);
  const myMonth = logsOf(logsBetween(approved, monthStart), me.id);
  const myAll = logsOf(approved, me.id);

  const weekPoints = sumPoints(myWeek);
  const monthPoints = sumPoints(myMonth);
  const totalPoints = sumPoints(myAll);

  const rows = ranking(profiles, logs, weekStart);
  const myRank = rows.find((r) => r.profile.id === me.id)?.rank ?? "-";

  const avgPerDay = (myWeek.length / daysElapsedThisWeek()).toFixed(1);
  const goal = weekGoalStatus(myWeek.length);
  const progress = Math.min(1, myWeek.length / WEEK_GOAL_CHORES);
  const level = levelFor(totalPoints);
  const { current: streak } = streaks(myAll);

  const notices = noticesFor(me, profiles, logs);
  const pendingForMe = logs.filter((l) => l.status === "pending" && l.user_id !== me.id);

  // confetti zodra het weekdoel gehaald is
  const celebrated = useRef(false);
  useEffect(() => {
    const key = `hh-goal-${me.id}-${weekStart.toISOString().slice(0, 10)}`;
    if (myWeek.length >= WEEK_GOAL_CHORES && !celebrated.current && !localStorage.getItem(key)) {
      celebrated.current = true;
      localStorage.setItem(key, "1");
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
      playGoal();
    }
  }, [myWeek.length, me.id, weekStart]);

  // Huisheld van vorige week / maand
  const prevWeekRows = ranking(profiles, logs, addDays(weekStart, -7), weekStart);
  const heroWeek = prevWeekRows[0]?.points > 0 ? prevWeekRows[0] : null;
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevMonthRows = ranking(profiles, logs, prevMonthStart, monthStart);
  const heroMonth = prevMonthRows[0]?.points > 0 ? prevMonthRows[0] : null;

  const goalColor =
    goal.status === "achter"
      ? "bg-coral"
      : goal.status === "bijna_achter"
      ? "bg-sun"
      : "bg-teal";

  return (
    <div className="flex flex-col gap-4">
      {/* Hoofdkaart */}
      <section className="card animate-rise p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-ink/50 dark:text-cream/50">Deze week</p>
            <p className="text-5xl font-black">
              {weekPoints}
              <span className="ml-1 text-lg font-extrabold text-ink/40 dark:text-cream/40">ptn</span>
            </p>
          </div>
          <div className="text-right">
            <span className="chip bg-coral-soft text-coral-deep dark:bg-coral/20 dark:text-coral">
              #{myRank} op het bord
            </span>
            <p className="mt-2 text-sm font-bold text-ink/50 dark:text-cream/50">
              {level.current.emoji} {level.current.name}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm font-bold">
            <span>
              Weekdoel: {myWeek.length}/{WEEK_GOAL_CHORES} klusjes
            </span>
            <span
              className={
                goal.status === "achter"
                  ? "text-coral-deep"
                  : goal.status === "bijna_achter"
                  ? "text-amber-600"
                  : "text-teal-deep dark:text-teal"
              }
            >
              {goal.status === "voor" && "Voor op schema"}
              {goal.status === "op_schema" && "Op schema"}
              {goal.status === "bijna_achter" && "Bijna achter"}
              {goal.status === "achter" && "Achter op schema"}
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-ink/10 dark:bg-cream/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${goalColor}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Maand" value={`${monthPoints}`} suffix="ptn" />
          <Stat label="Klusjes/week" value={`${myWeek.length}`} />
          <Stat label="Gem./dag" value={avgPerDay} />
        </div>

        {streak > 0 && (
          <p className="mt-3 text-center text-sm font-extrabold text-amber-600">
            🔥 {streak} dag{streak > 1 ? "en" : ""} streak
          </p>
        )}
      </section>

      <button
        onClick={goLog}
        className="btn-big animate-rise bg-coral p-4 text-lg text-white shadow-pop"
      >
        + Klus registreren
      </button>

      {/* Meldingen */}
      {notices.length > 0 && (
        <section className="animate-rise">
          <h2 className="mb-2 px-1 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
            Meldingen
          </h2>
          <div className="flex flex-col gap-2">
            {notices.map((n) => (
              <div key={n.id} className={`rounded-xl2 p-3 text-sm font-bold ${TONE_STYLES[n.tone]}`}>
                {n.text}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Goedkeuringen (anti-cheat) */}
      {pendingForMe.length > 0 && (
        <section className="animate-rise">
          <h2 className="mb-2 px-1 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
            Goed te keuren
          </h2>
          <div className="flex flex-col gap-2">
            {pendingForMe.map((l) => {
              const who = profiles.find((p) => p.id === l.user_id);
              const chore = chores.find((c) => c.id === l.chore_id);
              return (
                <div key={l.id} className="card flex items-center gap-3 p-3">
                  <span className="text-2xl">{chore?.emoji ?? "🧹"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold">
                      {who?.name}: {chore?.name}
                    </p>
                    <p className="text-xs font-bold text-ink/40 dark:text-cream/40">
                      {formatTime(l.created_at)} · {l.points} ptn
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      decideLog(l.id, me.id, true);
                      playApprove();
                    }}
                    className="btn-big bg-teal px-3 py-2 text-white"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => decideLog(l.id, me.id, false)}
                    className="btn-big bg-ink/10 px-3 py-2 dark:bg-cream/10"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Helden */}
      {(heroWeek || heroMonth) && (
        <section className="grid animate-rise grid-cols-2 gap-3">
          {heroWeek && (
            <div className="card p-4 text-center">
              <p className="text-xs font-black uppercase text-ink/40 dark:text-cream/40">
                Huisheld v/d week
              </p>
              <p className="mt-1 text-3xl">{heroWeek.profile.emoji}</p>
              <p className="font-extrabold">{heroWeek.profile.name}</p>
              <p className="text-sm font-bold text-ink/50 dark:text-cream/50">{heroWeek.points} ptn</p>
            </div>
          )}
          {heroMonth && (
            <div className="card p-4 text-center">
              <p className="text-xs font-black uppercase text-ink/40 dark:text-cream/40">
                Huisheld v/d maand
              </p>
              <p className="mt-1 text-3xl">{heroMonth.profile.emoji}</p>
              <p className="font-extrabold">{heroMonth.profile.name}</p>
              <p className="text-sm font-bold text-ink/50 dark:text-cream/50">{heroMonth.points} ptn</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-xl bg-ink/5 p-2 dark:bg-cream/5">
      <p className="text-lg font-black">
        {value}
        {suffix && <span className="ml-0.5 text-xs font-bold text-ink/40 dark:text-cream/40">{suffix}</span>}
      </p>
      <p className="text-xs font-bold text-ink/40 dark:text-cream/40">{label}</p>
    </div>
  );
}
