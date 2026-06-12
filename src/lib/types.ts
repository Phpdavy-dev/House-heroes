export type Profile = {
  id: number;
  name: string;
  emoji: string;
  color: string;
};

export type Chore = {
  id: number;
  name: string;
  emoji: string;
  points: number;
  category: "keuken" | "schoonmaak" | "was" | "overig";
  active: boolean;
};

export type LogStatus = "pending" | "approved" | "rejected";

export type ChoreLog = {
  id: number;
  user_id: number;
  chore_id: number;
  points: number;
  status: LogStatus;
  approved_by: number | null;
  created_at: string;
  decided_at: string | null;
};

export type Tab = "dashboard" | "klusjes" | "scorebord" | "stats" | "admin";

export type Assignment = {
  id: number;
  user_id: number;
  chore_id: number;
  weekday: number; // 1 = maandag ... 7 = zondag
};
