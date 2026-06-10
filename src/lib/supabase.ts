import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Vul hieronder je eigen Supabase-gegevens in:
const SUPABASE_URL = "https://evrxuczknavtnyivtzfi.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cnh1Y3prbmF2dG55aXZ0emZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDc3NjgsImV4cCI6MjA5NjYyMzc2OH0.D8G1cQGvmrD_UuQJGfSEcouVHrJV78lkU_MM9BFbb5I";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  if (!url || url.includes("JOUWPROJECT") || !key || key.includes("PLAK-HIER")) return null;
  if (!client) client = createClient(url, key);
  return client;
}
