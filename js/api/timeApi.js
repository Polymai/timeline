import { requireSupabase } from "../lib/supabaseClient.js";

async function must(result) {
  const { data, error } = await result;
  if (error) throw error;
  return data;
}

function normalizeEntry(workspaceId, userId, payload) {
  const targetKind = payload.target_kind;
  const targetId = payload.target_id;
  return {
    workspace_id: workspaceId,
    user_id: userId,
    entry_date: payload.entry_date,
    hours: Number(payload.hours),
    target_kind: targetKind,
    project_id: targetKind === "project" ? targetId : null,
    line_id: targetKind === "line" ? targetId : null,
    note: payload.note || "",
  };
}

export async function createTimeEntry(workspaceId, userId, payload) {
  const client = requireSupabase();
  return must(
    client
      .from("time_entries")
      .insert(normalizeEntry(workspaceId, userId, payload))
      .select("id, workspace_id, user_id, entry_date, hours, target_kind, project_id, line_id, note, created_at, updated_at")
      .single()
  );
}

export async function updateTimeEntry(entryId, workspaceId, userId, payload) {
  const client = requireSupabase();
  return must(
    client
      .from("time_entries")
      .update(normalizeEntry(workspaceId, userId, payload))
      .eq("id", entryId)
      .select("id, workspace_id, user_id, entry_date, hours, target_kind, project_id, line_id, note, created_at, updated_at")
      .single()
  );
}

export async function deleteTimeEntry(entryId) {
  const client = requireSupabase();
  return must(client.from("time_entries").delete().eq("id", entryId).select("id").single());
}
