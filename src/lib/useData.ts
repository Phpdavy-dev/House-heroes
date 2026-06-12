"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { Assignment, Chore, ChoreLog, Profile } from "./types";

export function useHouseData() {
  const supabase = getSupabase();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [logs, setLogs] = useState<ChoreLog[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [weekGoal, setWeekGoalState] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is nog niet gekoppeld. Vul .env.local in (zie README).");
      setLoading(false);
      return;
    }
    const [p, c, l, a, st] = await Promise.all([
      supabase.from("profiles").select("*").order("id"),
      supabase.from("chores").select("*").order("id"),
      supabase.from("chore_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("assignments").select("*").order("weekday"),
      supabase.from("settings").select("*"),
    ]);
    if (p.error || c.error || l.error) {
      setError(p.error?.message || c.error?.message || l.error?.message || "Onbekende fout");
    } else {
      setProfiles(p.data as Profile[]);
      setChores(c.data as Chore[]);
      setLogs(l.data as ChoreLog[]);
      setAssignments((a.data as Assignment[]) ?? []); // tabel kan ontbreken als SQL-update nog niet is gedraaid
      const goalRow = (st.data as { key: string; value: number }[] | null)?.find((r) => r.key === "week_goal");
      if (goalRow && goalRow.value > 0) setWeekGoalState(goalRow.value);
      setError(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const channel = supabase
      .channel("house-heroes")
      .on("postgres_changes", { event: "*", schema: "public", table: "chore_logs" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "chores" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refresh]);

  const logChore = useCallback(
    async (userId: number, chore: Chore) => {
      if (!supabase) return;
      await supabase.from("chore_logs").insert({
        user_id: userId,
        chore_id: chore.id,
        points: chore.points,
        status: "pending",
      });
      refresh();
    },
    [supabase, refresh]
  );

  const decideLog = useCallback(
    async (logId: number, approverId: number, approve: boolean) => {
      if (!supabase) return;
      await supabase
        .from("chore_logs")
        .update({
          status: approve ? "approved" : "rejected",
          approved_by: approverId,
          decided_at: new Date().toISOString(),
        })
        .eq("id", logId);
      refresh();
    },
    [supabase, refresh]
  );

  const deleteLog = useCallback(
    async (logId: number) => {
      if (!supabase) return;
      await supabase.from("chore_logs").delete().eq("id", logId);
      refresh();
    },
    [supabase, refresh]
  );

  const updateChore = useCallback(
    async (id: number, patch: Partial<Chore>) => {
      if (!supabase) return;
      await supabase.from("chores").update(patch).eq("id", id);
      refresh();
    },
    [supabase, refresh]
  );

  const addChore = useCallback(
    async (chore: Omit<Chore, "id" | "active">) => {
      if (!supabase) return;
      await supabase.from("chores").insert({ ...chore, active: true });
      refresh();
    },
    [supabase, refresh]
  );

  const deleteChore = useCallback(
    async (id: number) => {
      if (!supabase) return;
      await supabase.from("chores").delete().eq("id", id);
      refresh();
    },
    [supabase, refresh]
  );

  const resetLogs = useCallback(async () => {
    if (!supabase) return;
    await supabase.from("chore_logs").delete().gt("id", 0);
    refresh();
  }, [supabase, refresh]);

  const addAssignment = useCallback(
    async (userId: number, choreId: number, weekday: number) => {
      if (!supabase) return;
      await supabase.from("assignments").insert({ user_id: userId, chore_id: choreId, weekday });
      refresh();
    },
    [supabase, refresh]
  );

  const setWeekGoal = useCallback(
    async (value: number) => {
      if (!supabase || value < 1) return;
      setWeekGoalState(value);
      await supabase.from("settings").upsert({ key: "week_goal", value });
      refresh();
    },
    [supabase, refresh]
  );

  const deleteAssignment = useCallback(
    async (id: number) => {
      if (!supabase) return;
      await supabase.from("assignments").delete().eq("id", id);
      refresh();
    },
    [supabase, refresh]
  );

  return { profiles, chores, logs, assignments, weekGoal, loading, error, logChore, decideLog, deleteLog, updateChore, addChore, deleteChore, resetLogs, addAssignment, deleteAssignment, setWeekGoal, refresh };
}
