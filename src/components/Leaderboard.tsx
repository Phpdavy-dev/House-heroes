"use client";

import { useState } from "react";
import { useHouseData } from "@/lib/useData";
import { Profile } from "@/lib/types";
import { addDays, startOfMonth, startOfWeek } from "@/lib/dates";
import { ranking, RankRow } from "@/lib/gamification";

type HouseData = ReturnType<typeof useHouseData>;
type Period = "week" | "maand" | "alltime";

export default function Leaderboard({ me, data }: { me: Profile; data: HouseData }) {
  const { profiles, logs } = data;
  const [period, setPeriod] = useState<Period>("week");

  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  let rows: RankRow[];
  if (period === "week") {
    rows = ranking(profiles, logs, weekStart, undefined, addDays(weekStart, -7), weekStart);
  } else if (period === "maand") {
    rows = ranking(profiles, logs, monthStart, undefined, prevMonthStart, monthStart);
  } else {
    rows = ranking(profiles, logs, new Date(0));
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Scorebord</h1>

      <div className="flex rounded-xl2 bg-ink/5 p-1 dark:bg-cream/10">
        {(["week", "maand", "alltime"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-xl py-2 text-sm font-extrabold capitalize transition ${
              period === p ? "bg-white shadow-card dark:bg-night-card" : "text-ink/40 dark:text-cream/40"
            }`}
          >
            {p === "alltime" ? "All-time" : p}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div
            key={r.profile.id}
            className={`card flex animate-rise items-center gap-3 p-4 ${
              r.profile.id === me.id ? "ring-2 ring-coral" : ""
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="w-8 text-center text-xl font-black">
              {medals[i] ?? r.rank}
            </span>
            <span
              className="grid h-11 w-11 place-items-center rounded-full text-xl"
              style={{ backgroundColor: r.profile.color + "26" }}
            >
              {r.profile.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{r.profile.name}</p>
              <p className="text-xs font-bold text-ink/40 dark:text-cream/40">
                {r.chores} klusjes
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black">{r.points}</p>
              {period !== "alltime" && (
                <p className="text-sm">
                  {r.trend === "up" && <span className="text-teal-deep dark:text-teal">▲</span>}
                  {r.trend === "down" && <span className="text-coral-deep dark:text-coral">▼</span>}
                  {r.trend === "same" && <span className="text-ink/30 dark:text-cream/30">—</span>}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
