"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHouseData } from "@/lib/useData";
import { Tab } from "@/lib/types";
import { setSoundsEnabled, soundsEnabled } from "@/lib/sounds";
import Dashboard from "@/components/Dashboard";
import ChoreGrid from "@/components/ChoreGrid";
import Leaderboard from "@/components/Leaderboard";
import Stats from "@/components/Stats";
import Admin from "@/components/Admin";
import { canApprove } from "@/lib/gamification";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "dashboard", label: "Home", emoji: "🏠" },
  { id: "klusjes", label: "Klusjes", emoji: "🧹" },
  { id: "scorebord", label: "Scores", emoji: "🏆" },
  { id: "stats", label: "Stats", emoji: "📊" },
  { id: "admin", label: "Beheer", emoji: "⚙️" },
];

export default function HomeApp() {
  const router = useRouter();
  const data = useHouseData();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [userId, setUserId] = useState<number | null>(null);
  const [dark, setDark] = useState(false);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("hh-user");
    if (!id) {
      router.replace("/");
      return;
    }
    setUserId(Number(id));
    setDark(document.documentElement.classList.contains("dark"));
    setSound(soundsEnabled());
  }, [router]);

  const me = useMemo(
    () => data.profiles.find((p) => p.id === userId) ?? null,
    [data.profiles, userId]
  );

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hh-theme", next ? "dark" : "light");
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundsEnabled(next);
  }

  if (data.loading || !userId) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="animate-pop text-5xl">🏠</div>
      </main>
    );
  }

  if (data.error) {
    return (
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="card border-2 border-coral/40 p-5 font-semibold text-coral-deep">
          {data.error}
        </div>
      </main>
    );
  }

  if (!me) return null;

  const visibleTabs = TABS.filter((t) => t.id !== "admin" || canApprove(me));

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-cream/90 px-5 pb-2 pt-4 backdrop-blur dark:bg-night/90">
        <button
          onClick={() => {
            localStorage.removeItem("hh-user");
            router.push("/");
          }}
          className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-card dark:bg-night-card"
          title="Wissel van gebruiker"
        >
          <span className="text-xl">{me.emoji}</span>
          <span className="font-extrabold">{me.name}</span>
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={toggleSound}
            className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-card dark:bg-night-card"
            title="Geluid aan/uit"
          >
            {sound ? "🔊" : "🔇"}
          </button>
          <button
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-card dark:bg-night-card"
            title="Licht/donker"
          >
            {dark ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-2">
        {tab === "dashboard" && <Dashboard me={me} data={data} goLog={() => setTab("klusjes")} />}
        {tab === "klusjes" && <ChoreGrid me={me} data={data} />}
        {tab === "scorebord" && <Leaderboard me={me} data={data} />}
        {tab === "stats" && <Stats me={me} data={data} />}
        {tab === "admin" && canApprove(me) && <Admin me={me} data={data} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-ink/5 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur dark:border-night-line dark:bg-night-card/95">
        <div className="flex">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs font-bold transition ${
                tab === t.id
                  ? "text-coral"
                  : "text-ink/40 dark:text-cream/40"
              }`}
            >
              <span className={`text-xl ${tab === t.id ? "animate-pop" : ""}`}>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
