"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { useHouseData } from "@/lib/useData";
import { Profile } from "@/lib/types";
import { formatTime } from "@/lib/dates";
import { canApprove } from "@/lib/gamification";
import { playLog } from "@/lib/sounds";

type HouseData = ReturnType<typeof useHouseData>;

export default function ChoreGrid({ me, data }: { me: Profile; data: HouseData }) {
  const { chores, logs, profiles, logChore, deleteLog } = data;
  const [justLogged, setJustLogged] = useState<number | null>(null);
  const active = chores.filter((c) => c.active);
  const isAdmin = canApprove(me);

  const recent = logs.slice(0, isAdmin ? 15 : 8);

  async function handleDelete(logId: number, label: string) {
    if (window.confirm(`"${label}" verwijderen? De punten vervallen dan.`)) {
      await deleteLog(logId);
    }
  }

  async function handleLog(choreId: number) {
    const chore = chores.find((c) => c.id === choreId);
    if (!chore) return;
    setJustLogged(choreId);
    playLog();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, scalar: 0.8 });
    await logChore(me.id, chore);
    setTimeout(() => setJustLogged(null), 800);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="mb-1 text-2xl font-black">Klus registreren</h1>
        <p className="text-sm font-bold text-ink/50 dark:text-cream/50">
          Eén tik en hij staat erin. Manuela of Davy keurt hem daarna goed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {active.map((c, i) => (
          <button
            key={c.id}
            onClick={() => handleLog(c.id)}
            className={`btn-big card animate-rise p-4 text-left ${
              justLogged === c.id ? "ring-4 ring-teal" : ""
            }`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="text-3xl">{c.emoji}</span>
            <p className="mt-2 text-sm font-extrabold leading-tight">{c.name}</p>
            <span className="chip mt-2 bg-sun-soft text-amber-700 dark:bg-sun/20 dark:text-sun">
              +{c.points} ptn
            </span>
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
            Laatste activiteit
          </h2>
          <div className="card divide-y divide-ink/5 dark:divide-night-line">
            {recent.map((l) => {
              const who = profiles.find((p) => p.id === l.user_id);
              const chore = chores.find((c) => c.id === l.chore_id);
              return (
                <div key={l.id} className="flex items-center gap-3 p-3">
                  <span className="text-xl">{who?.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">
                      {who?.name} · {chore?.name}
                    </p>
                    <p className="text-xs font-bold text-ink/40 dark:text-cream/40">
                      {formatTime(l.created_at)}
                    </p>
                  </div>
                  <span
                    className={`chip ${
                      l.status === "approved"
                        ? "bg-teal-soft text-teal-deep dark:bg-teal/20 dark:text-teal"
                        : l.status === "pending"
                        ? "bg-sun-soft text-amber-700 dark:bg-sun/20 dark:text-sun"
                        : "bg-ink/5 text-ink/40 dark:bg-cream/10 dark:text-cream/40"
                    }`}
                  >
                    {l.status === "approved" && `+${l.points}`}
                    {l.status === "pending" && "wacht"}
                    {l.status === "rejected" && "afgekeurd"}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(l.id, `${who?.name}: ${chore?.name}`)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 transition active:scale-90 dark:bg-cream/10"
                      title="Registratie verwijderen"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
