"use client";

import { useRouter } from "next/navigation";
import { useHouseData } from "@/lib/useData";

const FALLBACK = [
  { id: 1, name: "Manuela", emoji: "🌸", color: "#E0589B" },
  { id: 2, name: "Davy", emoji: "🦊", color: "#FF6B4A" },
  { id: 3, name: "Destiny", emoji: "⭐", color: "#F5B12D" },
  { id: 4, name: "Jayden", emoji: "🚀", color: "#2D9C8F" },
  { id: 5, name: "Gwenn", emoji: "🦄", color: "#7C6BD6" },
];

export default function Home() {
  const router = useRouter();
  const { profiles, loading, error } = useHouseData();
  const list = profiles.length ? profiles : FALLBACK;

  function choose(id: number) {
    localStorage.setItem("hh-user", String(id));
    router.push("/home");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="text-center animate-rise">
        <div className="mb-3 text-6xl">🏠</div>
        <h1 className="text-4xl font-black tracking-tight">House Heroes</h1>
        <p className="mt-2 font-semibold text-ink/60 dark:text-cream/60">
          Verdien punten, versla je huisgenoten en houd het huis netjes.
        </p>
      </div>

      {error && (
        <div className="card border-2 border-coral/40 p-4 text-sm font-semibold text-coral-deep">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {list.map((p, i) => (
          <button
            key={p.id}
            onClick={() => choose(p.id)}
            disabled={loading && !profiles.length}
            className="btn-big card flex items-center gap-4 p-4 text-left text-lg animate-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className="grid h-12 w-12 place-items-center rounded-full text-2xl"
              style={{ backgroundColor: p.color + "26" }}
            >
              {p.emoji}
            </span>
            <span>
              Ik ben <span style={{ color: p.color }}>{p.name}</span>
            </span>
            <span className="ml-auto text-ink/30 dark:text-cream/30">→</span>
          </button>
        ))}
      </div>
    </main>
  );
}
