import { appRpc, requireSupabase } from "../lib/supabaseClient.js";
import { getWorkspaceLogoUrl } from "./logoStorage.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function inviteToken() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function must(result) {
  const { data, error } = await result;
  if (error) throw error;
  return data;
}

export async function createWorkspace({ workspaceName, displayName }) {
  const data = await must(appRpc("create_workspace", {
    p_workspace_name: workspaceName,
    p_display_name: displayName || "",
  }));
  return data;
}

export async function acceptInvite({ inviteCode, displayName }) {
  const data = await must(appRpc("accept_invite", {
    p_token: String(inviteCode || "").trim().toUpperCase(),
    p_display_name: displayName || "",
  }));
  return data;
}

export async function loadWorkspaceBundle(user) {
  const client = requireSupabase();
  const profile = await must(
    client
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle()
  );

  const activeMember = await must(
    client
      .from("workspace_members")
      .select("id, workspace_id, user_id, email, role, status, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
  );

  if (!activeMember) {
    return {
      profile,
      workspace: null,
      role: "",
      projects: [],
      lines: [],
      members: [],
      invites: [],
      entries: [],
      directoryConnection: null,
    };
  }

  const workspace = await must(
    client
      .from("workspaces")
      .select("id, name, timezone, work_week_start, work_week_days, logo_path, created_by, created_at, updated_at")
      .eq("id", activeMember.workspace_id)
      .single()
  );

  const [projects, lines, rawMembers, invites, entries, directoryConnection] = await Promise.all([
    must(
      client
        .from("projects")
        .select("id, workspace_id, name, code, client, color, status, created_by, created_at, updated_at")
        .eq("workspace_id", workspace.id)
        .order("status", { ascending: true })
        .order("name", { ascending: true })
    ),
    must(
      client
        .from("lines")
        .select("id, workspace_id, name, code, manager_email, color, status, created_by, created_at, updated_at")
        .eq("workspace_id", workspace.id)
        .order("status", { ascending: true })
        .order("name", { ascending: true })
    ),
    must(
      client
        .from("workspace_members")
        .select("id, workspace_id, user_id, email, role, status, created_at, updated_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: true })
    ),
    must(
      client
        .from("invites")
        .select("id, workspace_id, email, role, token, status, expires_at, invited_by, accepted_by, created_at, accepted_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
    ),
    must(
      client
        .from("time_entries")
        .select("id, workspace_id, user_id, entry_date, hours, target_kind, project_id, line_id, note, created_at, updated_at")
        .eq("workspace_id", workspace.id)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(120)
    ),
    must(
      client
        .from("directory_connections")
        .select("id, workspace_id, provider, tenant_id, primary_domain, sync_mode, status, last_checked_at, created_by, created_at, updated_at")
        .eq("workspace_id", workspace.id)
        .maybeSingle()
    ),
  ]);

  const profileIds = rawMembers.map((member) => member.user_id).filter(Boolean);
  const profiles = profileIds.length
    ? await must(
        client
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .in("id", profileIds)
      )
    : [];
  const profilesById = new Map(profiles.map((item) => [item.id, item]));
  const members = rawMembers.map((member) => ({
    ...member,
    profile: profilesById.get(member.user_id) || null,
  }));

  const logoUrl = await getWorkspaceLogoUrl(workspace.logo_path);

  return {
    profile,
    workspace: { ...workspace, logoUrl },
    role: activeMember.role,
    projects,
    lines,
    members,
    invites,
    entries,
    directoryConnection,
  };
}

export async function updateWorkspace(workspaceId, updates) {
  const client = requireSupabase();
  return must(
    client
      .from("workspaces")
      .update({
        name: updates.name,
        timezone: updates.timezone,
        work_week_start: Number(updates.work_week_start),
        work_week_days: Number(updates.work_week_days),
        logo_path: updates.logo_path,
      })
      .eq("id", workspaceId)
      .select("id, name, timezone, work_week_start, work_week_days, logo_path, created_by, created_at, updated_at")
      .single()
  );
}

export async function updateProfile(profileId, updates) {
  const client = requireSupabase();
  return must(
    client
      .from("profiles")
      .update({
        full_name: updates.full_name,
      })
      .eq("id", profileId)
      .select("id, email, full_name, avatar_url, created_at, updated_at")
      .single()
  );
}

export async function createInvite(workspaceId, { email, role }) {
  const client = requireSupabase();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  return must(
    client
      .from("invites")
      .insert({
        workspace_id: workspaceId,
        email: normalizeEmail(email),
        role,
        token: inviteToken(),
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, workspace_id, email, role, token, status, expires_at, invited_by, accepted_by, created_at, accepted_at")
      .single()
  );
}

export async function revokeInvite(inviteId) {
  const client = requireSupabase();
  return must(
    client
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", inviteId)
      .select("id")
      .single()
  );
}

export async function updateMemberRole(memberId, role) {
  const client = requireSupabase();
  return must(
    client
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId)
      .select("id, workspace_id, user_id, email, role, status, created_at, updated_at")
      .single()
  );
}

export async function saveDirectoryConnection(workspaceId, payload) {
  const client = requireSupabase();
  return must(
    client
      .from("directory_connections")
      .upsert({
        workspace_id: workspaceId,
        provider: "entra_id",
        tenant_id: payload.tenant_id || "",
        primary_domain: normalizeEmail(payload.primary_domain),
        sync_mode: payload.sync_mode || "manual",
        status: payload.status || "draft",
        last_checked_at: new Date().toISOString(),
      }, { onConflict: "workspace_id" })
      .select("id, workspace_id, provider, tenant_id, primary_domain, sync_mode, status, last_checked_at, created_by, created_at, updated_at")
      .single()
  );
}
