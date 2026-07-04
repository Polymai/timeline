import { requireSupabase } from "../lib/supabaseClient.js";

async function must(result) {
  const { data, error } = await result;
  if (error) throw error;
  return data;
}

export async function createProject(workspaceId, payload) {
  const client = requireSupabase();
  return must(
    client
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        name: payload.name,
        code: payload.code || "",
        client: payload.client || "",
        color: payload.color || "#0f6d6b",
        status: payload.status || "active",
      })
      .select("id, workspace_id, name, code, client, color, status, created_by, created_at, updated_at")
      .single()
  );
}

export async function updateProject(projectId, payload) {
  const client = requireSupabase();
  return must(
    client
      .from("projects")
      .update({
        name: payload.name,
        code: payload.code || "",
        client: payload.client || "",
        color: payload.color || "#0f6d6b",
        status: payload.status || "active",
      })
      .eq("id", projectId)
      .select("id, workspace_id, name, code, client, color, status, created_by, created_at, updated_at")
      .single()
  );
}

export async function deleteProject(projectId) {
  const client = requireSupabase();
  return must(client.from("projects").delete().eq("id", projectId).select("id").single());
}

export async function createLine(workspaceId, payload) {
  const client = requireSupabase();
  return must(
    client
      .from("lines")
      .insert({
        workspace_id: workspaceId,
        name: payload.name,
        code: payload.code || "",
        manager_email: payload.manager_email || "",
        color: payload.color || "#ec7e4c",
        status: payload.status || "active",
      })
      .select("id, workspace_id, name, code, manager_email, color, status, created_by, created_at, updated_at")
      .single()
  );
}

export async function updateLine(lineId, payload) {
  const client = requireSupabase();
  return must(
    client
      .from("lines")
      .update({
        name: payload.name,
        code: payload.code || "",
        manager_email: payload.manager_email || "",
        color: payload.color || "#ec7e4c",
        status: payload.status || "active",
      })
      .eq("id", lineId)
      .select("id, workspace_id, name, code, manager_email, color, status, created_by, created_at, updated_at")
      .single()
  );
}

export async function deleteLine(lineId) {
  const client = requireSupabase();
  return must(client.from("lines").delete().eq("id", lineId).select("id").single());
}
