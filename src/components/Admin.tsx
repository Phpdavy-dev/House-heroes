"use client";

import { useState } from "react";
import { useHouseData } from "@/lib/useData";
import { Profile } from "@/lib/types";
import { formatTime } from "@/lib/dates";
import { WEEKDAY_NAMES } from "@/lib/gamification";

type HouseData = ReturnType<typeof useHouseData>;

export default function Admin({ me, data }: { me: Profile; data: HouseData }) {
  const { chores, profiles, logs, assignments, weekGoal, updateChore, addChore, deleteChore, deleteLog, resetLogs, addAssignment, deleteAssignment, setWeekGoal } = data;
  const [taskUser, setTaskUser] = useState(0);
  const [taskChore, setTaskChore] = useState(0);
  const [taskDay, setTaskDay] = useState(1);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧹");
  const [points, setPoints] = useState(10);
  const [category, setCategory] = useState<"keuken" | "schoonmaak" | "was" | "overig">("overig");

  async function submit() {
    if (!name.trim()) return;
    await addChore({ name: name.trim(), emoji, points, category });
    setName("");
    setPoints(10);
  }

  function handleDeleteChore(id: number, choreName: string) {
    const ok = window.confirm(
      `"${choreName}" definitief verwijderen?\n\nLet op: alle geregistreerde punten van deze klus verdwijnen dan ook uit de geschiedenis. Wil je de klus alleen uit de lijst halen maar de punten bewaren, gebruik dan het oog-icoon (verbergen).`
    );
    if (ok) deleteChore(id);
  }

  function handleDeleteLog(id: number, desc: string) {
    if (window.confirm(`Registratie verwijderen?\n\n${desc}`)) deleteLog(id);
  }

  function handleReset() {
    if (!window.confirm("Weet je zeker dat je ALLE scores en geschiedenis wilt wissen? Dit kan niet ongedaan worden gemaakt.")) return;
    if (!window.confirm("Echt heel zeker? Iedereen begint dan weer op 0 punten.")) return;
    resetLogs();
  }

  const recent = logs.slice(0, 15);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black">Beheer</h1>
        <p className="text-sm font-bold text-ink/50 dark:text-cream/50">
          Hoi {me.name}! Wijzigingen hier gelden direct voor iedereen.
        </p>
      </div>

      {/* Klusjes beheren */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
          Klusjes & punten
        </h2>
        <div className="card divide-y divide-ink/5 p-2 dark:divide-night-line">
          {chores.map((c) => (
            <div key={c.id} className={`flex items-center gap-2 p-2 ${c.active ? "" : "opacity-40"}`}>
              <span className="text-xl">{c.emoji}</span>
              <p className="min-w-0 flex-1 truncate text-sm font-extrabold">{c.name}</p>
              <input
                type="number"
                min={1}
                defaultValue={c.points}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0 && v !== c.points) updateChore(c.id, { points: v });
                }}
                className="w-14 rounded-lg border border-ink/10 bg-transparent px-1 py-1 text-right text-sm font-extrabold dark:border-night-line"
              />
              <button
                onClick={() => updateChore(c.id, { active: !c.active })}
                className="chip bg-ink/5 dark:bg-cream/10"
                title={c.active ? "Verbergen (punten blijven bewaard)" : "Weer activeren"}
              >
                {c.active ? "👁️" : "🚫"}
              </button>
              <button
                onClick={() => handleDeleteChore(c.id, c.name)}
                className="chip bg-coral-soft text-coral-deep dark:bg-coral/20 dark:text-coral"
                title="Definitief verwijderen"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Nieuwe klus */}
      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
          Nieuwe klus
        </h2>
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 rounded-lg border border-ink/10 bg-transparent px-2 py-2 text-center dark:border-night-line"
            aria-label="Emoji"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam van de klus"
            className="flex-1 rounded-lg border border-ink/10 bg-transparent px-3 py-2 font-bold dark:border-night-line"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-20 rounded-lg border border-ink/10 bg-transparent px-2 py-2 text-right font-extrabold dark:border-night-line"
            aria-label="Punten"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="flex-1 rounded-lg border border-ink/10 bg-transparent px-2 py-2 font-bold dark:border-night-line dark:bg-night-card"
          >
            <option value="keuken">Keuken</option>
            <option value="schoonmaak">Schoonmaak</option>
            <option value="was">Was</option>
            <option value="overig">Overig</option>
          </select>
        </div>
        <button onClick={submit} className="btn-big bg-coral p-3 text-white">
          Klus toevoegen
        </button>
      </section>

      {/* Registraties corrigeren */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
          Laatste registraties (corrigeren)
        </h2>
        <div className="card divide-y divide-ink/5 dark:divide-night-line">
          {recent.length === 0 && (
            <p className="p-3 text-sm font-bold text-ink/40 dark:text-cream/40">Nog geen registraties.</p>
          )}
          {recent.map((l) => {
            const who = profiles.find((p) => p.id === l.user_id);
            const chore = chores.find((c) => c.id === l.chore_id);
            const desc = `${who?.name}: ${chore?.name ?? "?"} (${formatTime(l.created_at)})`;
            return (
              <div key={l.id} className="flex items-center gap-2 p-2.5">
                <span className="text-lg">{who?.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">
                    {who?.name} · {chore?.name ?? "verwijderde klus"}
                  </p>
                  <p className="text-xs font-bold text-ink/40 dark:text-cream/40">
                    {formatTime(l.created_at)} · {l.points} ptn · {l.status === "approved" ? "goedgekeurd" : l.status === "pending" ? "wacht" : "afgekeurd"}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteLog(l.id, desc)}
                  className="chip bg-coral-soft text-coral-deep dark:bg-coral/20 dark:text-coral"
                  title="Registratie verwijderen"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekdoel */}
      <section className="card flex flex-col gap-2 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
          Weekdoel
        </h2>
        <p className="-mt-1 text-xs font-bold text-ink/40 dark:text-cream/40">
          Hoeveel klusjes moet iedereen per week doen? Geldt voor de voortgangsbalk, de kleuren en de meldingen.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            defaultValue={weekGoal}
            key={weekGoal}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v >= 1 && v !== weekGoal) setWeekGoal(v);
            }}
            className="w-20 rounded-lg border border-ink/10 bg-transparent px-2 py-2 text-right text-lg font-black dark:border-night-line"
          />
          <span className="text-sm font-extrabold text-ink/50 dark:text-cream/50">klusjes per week, per persoon</span>
        </div>
      </section>

      {/* Vaste taken */}
      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-ink/40 dark:text-cream/40">
          Vaste taken (wekelijks)
        </h2>
        <p className="-mt-2 text-xs font-bold text-ink/40 dark:text-cream/40">
          Bijv. elke dinsdag de vaatwasser voor Jayden. Diegene krijgt er die dag een melding van op het dashboard.
        </p>
        <div className="flex flex-col gap-2">
          <select
            value={taskUser}
            onChange={(e) => setTaskUser(Number(e.target.value))}
            className="rounded-lg border border-ink/10 bg-transparent px-2 py-2 font-bold dark:border-night-line dark:bg-night-card"
          >
            <option value={0}>Wie?</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
          <select
            value={taskChore}
            onChange={(e) => setTaskChore(Number(e.target.value))}
            className="rounded-lg border border-ink/10 bg-transparent px-2 py-2 font-bold dark:border-night-line dark:bg-night-card"
          >
            <option value={0}>Welke klus?</option>
            {chores.filter((c) => c.active).map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
          <select
            value={taskDay}
            onChange={(e) => setTaskDay(Number(e.target.value))}
            className="rounded-lg border border-ink/10 bg-transparent px-2 py-2 font-bold capitalize dark:border-night-line dark:bg-night-card"
          >
            {WEEKDAY_NAMES.map((d, i) => (
              <option key={i} value={i + 1}>elke {d}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (taskUser && taskChore) {
                addAssignment(taskUser, taskChore, taskDay);
                setTaskUser(0);
                setTaskChore(0);
              }
            }}
            className="btn-big bg-teal p-3 text-white disabled:opacity-40"
            disabled={!taskUser || !taskChore}
          >
            Vaste taak toevoegen
          </button>
        </div>

        {assignments.length > 0 && (
          <div className="divide-y divide-ink/5 dark:divide-night-line">
            {assignments.map((a) => {
              const who = profiles.find((p) => p.id === a.user_id);
              const chore = chores.find((c) => c.id === a.chore_id);
              return (
                <div key={a.id} className="flex items-center gap-2 py-2">
                  <span className="text-lg">{who?.emoji}</span>
                  <p className="min-w-0 flex-1 truncate text-sm font-extrabold">
                    {who?.name}: {chore?.emoji} {chore?.name}
                    <span className="ml-1 font-bold capitalize text-ink/40 dark:text-cream/40">
                      · {WEEKDAY_NAMES[a.weekday - 1]}
                    </span>
                  </p>
                  <button
                    onClick={() => deleteAssignment(a.id)}
                    className="chip bg-coral-soft text-coral-deep dark:bg-coral/20 dark:text-coral"
                    title="Vaste taak verwijderen"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Gevarenzone */}
      <section className="card border-2 border-coral/30 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-coral-deep dark:text-coral">
          Gevarenzone
        </h2>
        <p className="mt-1 text-sm font-bold text-ink/50 dark:text-cream/50">
          Wist alle scores, streaks en geschiedenis van iedereen. Klusjes en punten-instellingen blijven bestaan.
        </p>
        <button onClick={handleReset} className="btn-big mt-3 w-full bg-coral p-3 text-white">
          🧨 Volledig overzicht resetten
        </button>
      </section>
    </div>
  );
}
