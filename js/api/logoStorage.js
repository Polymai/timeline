import { mediaBucket } from "../lib/supabaseClient.js";

function safeFileName(name) {
  return String(name || "logo")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "logo";
}

export async function uploadWorkspaceLogo(workspaceId, file) {
  if (!workspaceId || !file) {
    throw new Error("Choose a logo file before uploading.");
  }
  const extension = safeFileName(file.name).split(".").pop() || "png";
  const path = `logos/${workspaceId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await mediaBucket().upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  return path;
}

export async function removeWorkspaceLogo(path) {
  if (!path) return;
  const { error } = await mediaBucket().remove([path]);
  if (error) throw error;
}

export async function getWorkspaceLogoUrl(path) {
  if (!path) return "";
  const { data, error } = await mediaBucket().createSignedUrl(path, 60 * 60);
  if (error) return "";
  return data?.signedUrl || "";
}
