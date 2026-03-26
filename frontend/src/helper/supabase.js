import supabase from "../helper/supabaseClient";

function getWeekStart() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function fetchStats(game) {
  const weekStart = getWeekStart();

  const { data: allTime } = await supabase
    .from("game_sessions")
    .select("duration_seconds")
    .eq("game", game)
    .order("duration_seconds", { ascending: true });

  const { data: thisWeek } = await supabase
    .from("game_sessions")
    .select("duration_seconds")
    .eq("game", game)
    .gte("completed_at", weekStart)
    .order("duration_seconds", { ascending: true });

  return {
    totalPlayed: allTime?.length ?? 0,
    bestTime: allTime?.[0]?.duration_seconds ?? null,
    weekPlayed: thisWeek?.length ?? 0,
    bestTimeWeek: thisWeek?.[0]?.duration_seconds ?? null,
  };
}

export async function recordSession(game, durationSeconds) {
  await supabase.from("game_sessions").insert({
    game,
    duration_seconds: durationSeconds,
    completed_at: new Date().toISOString(),
  });
}