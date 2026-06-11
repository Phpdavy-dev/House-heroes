"use client";

import { useMemo, useState } from "react";
import { useHouseData } from "@/lib/useData";
import { Profile } from "@/lib/types";
import { addDays, dayKey, startOfDay, startOfWeek } from "@/lib/dates";
import {
  achievementsFor,
  approvedLogs,
  levelFor,
  logsOf,
  streaks,
  sumPoints,
} from "@/lib/gamification";

type HouseData = ReturnType<typeof useHouseData>;

export default function Stats({ me, data }: { me: Profile; data: HouseData }) {
  const { chores, logs, profiles } = data;
  const mine = logsOf(approvedLogs(logs), me.id);

  const totalPoints = sumPoints(mine);
  const level = levelFor(totalPoints);
  const { current, longest } = streaks(mine);
  const achievements = achievementsFor(mine, chores);

  // meest gedane klus
  const counts = new Map<number, number>();
  for (const l of mine) counts.set(l.chore_id, (counts.get(l.chore_id) ?? 0) + 1);
  const topChoreId = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topChore = chores.find((c) => c.id === topChoreId);

  // gemiddelde punten per week (vanaf eerste klus)
  let avgWeek = 0;
  if (mine.length > 0) {
    const first = startOfWeek(new Date(mine[mine.length - 1].created_at));
    const weeks = Math.max(1, Math.ceil((Date.now() - first.getTime()) / (7 * 864e5)));
    avgWeek = Math.round(totalPoints / weeks);
  }

  // activiteit afgelopen 14 dagen
  const days: { label: string; points: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDays(startOfDay(new Date()), -i);
    const key = dayKey(d);
    const pts = sumPoints(mine.filter((l) => dayKey(new Date(l.created_at)) === key));
    days.push({ label: d.toLocaleDateString("nl-NL", { weekday: "narrow" }), points: pts });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.points));

  function exportCsv() {
    const header = "Datum;Tijd;Gebruiker;Klus;Punten;Status";
    const rows = logs.map((l) => {
      const d = new Date(l.created_at);
      const who = profiles.find((p) => p.id === l.user_id)?.name ?? l.user_id;
      const chore = chores.find((c) => c.id === l.chore_id)?.name ?? l.chore_id;
      return [
        d.toLocaleDateString("nl-NL"),
        d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
        who,
        chore,
        l.points,
        l.status,
      ].join(";");
    });
    const blob = new Blob(["\uFEFF" + [header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "house-heroes-statistieken.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">Statistieken</h1>

      {/* Level */}
      <section className="card animate-rise p-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{level.current.emoji}</span>
          <div className="flex-1">
            <p className="font-black">{level.current.name}</p>
            <p className="text-xs font-bold text-ink/40 dark:text-cream/40">
              {totalPoints} punten totaal
              {level.next && ` · nog ${level.next.min - totalPoints} tot ${level.next.name}`}
            </p>
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10 dark:bg-cream/10">
          <div
            className="h-full rounded-full bg-coral transition-all duration-500"
            style={{ width: `${level.progress * 100}%` }}
          />
        </div>
      </section>

      {/* Kerncijfers */}
      <section className="grid animate-rise grid-cols-2 gap-3">
        <Card title="Klusjes totaal" value={`${mine.length}`} emoji="🧹" />
        <Card title="Gem. ptn/week" value={`${avgWeek}`} emoji="📈" />
        <Card title="Huidige streak" value={`${current} dgn`} emoji="🔥" />
        <Card title="Langste streak" value={`${longest} dgn`} emoji="🏔️" />
      </section>

      {topChore && (
        <section className="card animate-rise flex items-center gap-3 p-4">
          <span className="text-3xl">{topChore.emoji}</span>
          <div>
            <p className="text-xs font-black uppercase text-ink/40 dark:text-cream/40">
              Meest gedane klus
            </p>
            <p className="font-extrabold">
              {topChore.name} · {counts.get(topChore.id)}×
            </p>
          </div>
        </section>
      )}

      {/* Activiteit */}
      <section className="card animate-rise p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
          Punten per dag (14 dagen)
        </h2>
        <div className="flex h-28 items-end gap-1">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md ${d.points > 0 ? "bg-teal" : "bg-ink/10 dark:bg-cream/10"}`}
                style={{ height: `${Math.max(4, (d.points / maxDay) * 100)}%` }}
                title={`${d.points} ptn`}
              />
              <span className="text-[10px] font-bold text-ink/30 dark:text-cream/30">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section className="animate-rise">
        <h2 className="mb-2 px-1 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
          Achievements
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => (
            <div key={a.id} className={`card p-3 ${a.earned ? "" : "opacity-40 grayscale"}`}>
              <span className="text-2xl">{a.emoji}</span>
              <p className="mt-1 text-sm font-extrabold leading-tight">{a.name}</p>
              <p className="text-xs font-bold text-ink/40 dark:text-cream/40">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Geschiedenis per dag */}
      <HistorySection me={me} data={data} />

      <button onClick={exportCsv} className="btn-big card p-4">
        📥 Exporteer statistieken (Excel/CSV)
      </button>
    </div>
  );
}

function Card({ title, value, emoji }: { title: string; value: string; emoji: string }) {
  return (
    <div className="card p-4">
      <span className="text-2xl">{emoji}</span>
      <p className="mt-1 text-xl font-black">{value}</p>
      <p className="text-xs font-bold text-ink/40 dark:text-cream/40">{title}</p>
    </div>
  );
}

const DAY_LABEL = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function HistorySection({ me, data }: { me: Profile; data: HouseData }) {
  const { profiles, chores, logs } = data;
  const [personId, setPersonId] = useState(me.id);
  const [daysShown, setDaysShown] = useState(7);

  const grouped = useMemo(() => {
    const mine = logs.filter((l) => l.user_id === personId && l.status !== "rejected");
    const map = new Map<string, typeof mine>();
    for (const l of mine) {
      const key = new Date(l.created_at).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return Array.from(map.entries()); // al gesorteerd: logs staan nieuwste eerst
  }, [logs, personId]);

  const visible = grouped.slice(0, daysShown);
  const person = profiles.find((p) => p.id === personId);

  return (
    <section className="animate-rise">
      <h2 className="mb-2 px-1 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
        Klusjes per dag
      </h2>

      {/* Persoon kiezen */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPersonId(p.id);
              setDaysShown(7);
            }}
            className={`chip shrink-0 ${
              p.id === personId
                ? "bg-coral text-white"
                : "bg-white shadow-card dark:bg-night-card"
            }`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="card p-4 text-sm font-bold text-ink/40 dark:text-cream/40">
          {person?.name} heeft nog geen klusjes geregistreerd.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visible.map(([dayKey, dayLogs]) => {
          const approvedPts = dayLogs
            .filter((l) => l.status === "approved")
            .reduce((s, l) => s + l.points, 0);
          return (
            <div key={dayKey} className="card p-3">
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-sm font-black capitalize">{DAY_LABEL.format(new Date(dayKey))}</p>
                <span className="text-xs font-extrabold text-teal-deep dark:text-teal">
                  +{approvedPts} ptn
                </span>
              </div>
              <div className="divide-y divide-ink/5 dark:divide-night-line">
                {dayLogs.map((l) => {
                  const chore = chores.find((c) => c.id === l.chore_id);
                  return (
                    <div key={l.id} className="flex items-center gap-2 py-1.5">
                      <span>{chore?.emoji ?? "🧹"}</span>
                      <p className="min-w-0 flex-1 truncate text-sm font-bold">
                        {chore?.name ?? "verwijderde klus"}
                      </p>
                      <span className="text-xs font-bold text-ink/40 dark:text-cream/40">
                        {new Date(l.created_at).toLocaleTimeString("nl-NL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span
                        className={`chip ${
                          l.status === "approved"
                            ? "bg-teal-soft text-teal-deep dark:bg-teal/20 dark:text-teal"
                            : "bg-sun-soft text-amber-700 dark:bg-sun/20 dark:text-sun"
                        }`}
                      >
                        {l.status === "approved" ? `+${l.points}` : "wacht"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {grouped.length > daysShown && (
        <button
          onClick={() => setDaysShown((d) => d + 7)}
          className="btn-big card mt-3 w-full p-3 text-sm"
        >
          Meer dagen tonen
        </button>
      )}
    </section>
  );
}
