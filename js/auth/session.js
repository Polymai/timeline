import { getAuthRedirectUrl, removeScopedStorage, writeScopedStorage } from "../config/runtime.js";
import { requireSupabase, supabase } from "../lib/supabaseClient.js";
import { acceptInvite, createWorkspace, loadWorkspaceBundle } from "../api/workspaceApi.js";
import { clearWorkspaceState, getState, setActionStatus, setState } from "../state/store.js";

function messageFromError(error) {
  const raw = String(error?.message || error || "");
  if (/already|registered|exists|duplicate/i.test(raw)) {
    return "This email may already work for sign-in. Sign in instead, or reset your password.";
  }
  if (/invalid login|credentials/i.test(raw)) {
    return "The email or password did not match. Check the details and try again.";
  }
  return raw || "Something went wrong. Try again.";
}

async function applySession(session) {
  if (!session) {
    setState({
      appLoading: false,
      session: null,
      fatalError: "",
      actionStatus: null,
      requiresWorkspaceSetup: false,
    });
    clearWorkspaceState();
    return;
  }

  setState({ session, appLoading: true, fatalError: "" });
  await refreshWorkspaceData();
}

export async function initializeAuth() {
  if (!supabase) {
    setState({
      appLoading: false,
      fatalError: "TimeLine is waiting for its Supabase runtime configuration.",
    });
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setState({ appLoading: false, fatalError: messageFromError(error) });
    return;
  }
  await applySession(data.session);

  supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });
}

export async function refreshWorkspaceData() {
  const state = getState();
  const session = state.session;
  if (!session?.user) return;

  try {
    const bundle = await loadWorkspaceBundle(session.user);
    setState({
      ...bundle,
      appLoading: false,
      fatalError: "",
      requiresWorkspaceSetup: !bundle.workspace,
    });
  } catch (error) {
    setState({
      appLoading: false,
      fatalError: messageFromError(error),
      requiresWorkspaceSetup: false,
    });
  }
}

export async function signInUser({ email, password }) {
  const client = requireSupabase();
  setActionStatus({ type: "loading", message: "Signing in..." });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    setActionStatus({ type: "error", message: messageFromError(error) });
    return;
  }
  removeScopedStorage("pending-signup");
  setActionStatus({ type: "success", message: "Signed in." });
}

export async function signUpUser({ email, password, fullName }) {
  const client = requireSupabase();
  setActionStatus({ type: "loading", message: "Creating your account..." });
  writeScopedStorage("pending-signup", { email, fullName, createdAt: Date.now() });
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) {
    setActionStatus({ type: "error", message: messageFromError(error) });
    return;
  }
  if (!data.session) {
    setActionStatus({
      type: "success",
      message: "Check your email to finish sign-up, then return here to create your company.",
    });
    return;
  }
  setActionStatus({ type: "success", message: "Account ready. Create your company next." });
}

export async function signOutUser() {
  const client = requireSupabase();
  setActionStatus({ type: "loading", message: "Signing out..." });
  await client.auth.signOut();
  setActionStatus(null);
}

export async function createFirstWorkspace({ workspaceName, displayName }) {
  setActionStatus({ type: "loading", message: "Creating your company..." });
  try {
    await createWorkspace({ workspaceName, displayName });
    await refreshWorkspaceData();
    setActionStatus({ type: "success", message: "Company created." });
  } catch (error) {
    setActionStatus({ type: "error", message: messageFromError(error) });
  }
}

export async function joinCompanyWithInvite({ inviteCode, displayName }) {
  setActionStatus({ type: "loading", message: "Joining company..." });
  try {
    await acceptInvite({ inviteCode, displayName });
    await refreshWorkspaceData();
    setActionStatus({ type: "success", message: "Company joined." });
  } catch (error) {
    setActionStatus({ type: "error", message: messageFromError(error) });
  }
}
