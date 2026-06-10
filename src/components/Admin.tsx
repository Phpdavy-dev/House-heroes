"use client";

import { useState } from "react";
import { useHouseData } from "@/lib/useData";

type HouseData = ReturnType<typeof useHouseData>;

export default function Admin({ data }: { data: HouseData }) {
  const { chores, updateChore, addChore } = data;
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black">Beheer</h1>
        <p className="text-sm font-bold text-ink/50 dark:text-cream/50">
          Pas punten aan of voeg klusjes toe. Geldt direct voor iedereen.
        </p>
      </div>

      <section className="card divide-y divide-ink/5 p-2 dark:divide-night-line">
        {chores.map((c) => (
          <div key={c.id} className={`flex items-center gap-3 p-2 ${c.active ? "" : "opacity-40"}`}>
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
              className="w-16 rounded-lg border border-ink/10 bg-transparent px-2 py-1 text-right text-sm font-extrabold dark:border-night-line"
            />
            <button
              onClick={() => updateChore(c.id, { active: !c.active })}
              className="chip bg-ink/5 dark:bg-cream/10"
              title={c.active ? "Verbergen" : "Activeren"}
            >
              {c.active ? "👁️" : "🚫"}
            </button>
          </div>
        ))}
      </section>

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
    </div>
  );
}
