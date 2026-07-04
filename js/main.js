import { ROUTES } from "./config/runtime.js";
import { createLine, createProject, deleteLine, deleteProject, updateLine, updateProject } from "./api/catalogApi.js";
import { removeWorkspaceLogo, uploadWorkspaceLogo } from "./api/logoStorage.js";
import { createTimeEntry, deleteTimeEntry, updateTimeEntry } from "./api/timeApi.js";
import {
  createInvite,
  revokeInvite,
  saveDirectoryConnection,
  updateMemberRole,
  updateProfile,
  updateWorkspace,
} from "./api/workspaceApi.js";
import {
  createFirstWorkspace,
  initializeAuth,
  joinCompanyWithInvite,
  refreshWorkspaceData,
  signInUser,
  signOutUser,
  signUpUser,
} from "./auth/session.js";
import { bindRouter, routeForRole } from "./routes.js";
import { clearActionStatus, getState, setActionStatus, setNavOpen, setRoute, setState, subscribe } from "./state/store.js";
import { bindAdminCatalogView, renderAdminCatalogView } from "./views/adminCatalogView.js";
import { bindAdminCompanyView, renderAdminCompanyView } from "./views/adminCompanyView.js";
import { bindAdminDirectoryView, renderAdminDirectoryView } from "./views/adminDirectoryView.js";
import { bindAdminPeopleView, renderAdminPeopleView } from "./views/adminPeopleView.js";
import { bindAuthView, renderAuthView } from "./views/authView.js";
import { bindShellView, renderShell } from "./views/shellView.js";
import { bindTimeReportView, renderTimeReportView } from "./views/timeReportView.js";

const root = document.getElementById("app");

function messageFromError(error) {
  return String(error?.message || error || "Something went wrong. Try again.");
}

function parseTargetKey(targetKey) {
  const [target_kind, target_id] = String(targetKey || "").split(":");
  if (!["project", "line"].includes(target_kind) || !target_id) {
    throw new Error("Choose a project or line before saving time.");
  }
  return { target_kind, target_id };
}

function renderLoadingScreen(state) {
  const message = state.fatalError || "Preparing your reporting surface.";
  return `
    <main class="boot-screen" aria-busy="${state.fatalError ? "false" : "true"}">
      <p class="eyebrow">TimeLine</p>
      <h1>${state.fatalError ? "TimeLine needs attention" : "Loading your company"}</h1>
      <p>${message}</p>
    </main>
  `;
}

function activeContent(state, activeRoute) {
  if (activeRoute === ROUTES.company) return renderAdminCompanyView(state);
  if (activeRoute === ROUTES.people) return renderAdminPeopleView(state);
  if (activeRoute === ROUTES.catalog) return renderAdminCatalogView(state);
  if (activeRoute === ROUTES.directory) return renderAdminDirectoryView(state);
  return renderTimeReportView(state);
}

async function runAction(loadingMessage, action, successMessage) {
  setActionStatus({ type: "loading", message: loadingMessage });
  try {
    await action();
    await refreshWorkspaceData();
    setActionStatus({ type: "success", message: successMessage });
  } catch (error) {
    setActionStatus({ type: "error", message: messageFromError(error) });
  }
}

function bindCurrentView(state, activeRoute) {
  bindShellView(root, {
    toggleNav: () => setNavOpen(!getState().navOpen),
    closeNav: () => setNavOpen(false),
    signOut: () => signOutUser(),
  });

  if (activeRoute === ROUTES.company) {
    bindAdminCompanyView(root, {
      saveCompany: (payload) => runAction("Saving company profile...", async () => {
        const current = getState();
        await updateWorkspace(current.workspace.id, {
          ...payload,
          logo_path: current.workspace.logo_path || null,
        });
        await updateProfile(current.profile.id, { full_name: payload.full_name });
      }, "Company profile saved."),
      uploadLogo: (file) => runAction("Uploading logo...", async () => {
        if (!file || !file.name) throw new Error("Choose a logo file before uploading.");
        const current = getState();
        const oldPath = current.workspace.logo_path;
        const logo_path = await uploadWorkspaceLogo(current.workspace.id, file);
        await updateWorkspace(current.workspace.id, {
          name: current.workspace.name,
          timezone: current.workspace.timezone,
          work_week_start: current.workspace.work_week_start,
          work_week_days: current.workspace.work_week_days,
          logo_path,
        });
        if (oldPath && oldPath !== logo_path) await removeWorkspaceLogo(oldPath);
      }, "Company logo uploaded."),
    });
    return;
  }

  if (activeRoute === ROUTES.people) {
    bindAdminPeopleView(root, {
      createInvite: (payload) => runAction("Creating invite...", async () => {
        await createInvite(getState().workspace.id, payload);
      }, "Invite created."),
      updateMemberRole: (memberId, role) => runAction("Saving role...", async () => {
        await updateMemberRole(memberId, role);
      }, "Member role saved."),
      revokeInvite: (inviteId) => runAction("Revoking invite...", async () => {
        await revokeInvite(inviteId);
      }, "Invite revoked."),
      copyInvite: async (token) => {
        try {
          await navigator.clipboard.writeText(token);
          setActionStatus({ type: "success", message: "Invite code copied." });
        } catch {
          setActionStatus({ type: "error", message: "Copy failed. Select the code text and copy it manually." });
        }
      },
    });
    return;
  }

  if (activeRoute === ROUTES.catalog) {
    bindAdminCatalogView(root, state, {
      saveProject: (payload) => runAction("Saving project...", async () => {
        if (payload.id) await updateProject(payload.id, payload);
        else await createProject(getState().workspace.id, payload);
      }, "Project saved."),
      deleteProject: (projectId) => {
        if (!window.confirm("Delete this project? Existing time entries may prevent deletion.")) return;
        runAction("Deleting project...", async () => deleteProject(projectId), "Project deleted.");
      },
      saveLine: (payload) => runAction("Saving line...", async () => {
        if (payload.id) await updateLine(payload.id, payload);
        else await createLine(getState().workspace.id, payload);
      }, "Line saved."),
      deleteLine: (lineId) => {
        if (!window.confirm("Delete this line? Existing time entries may prevent deletion.")) return;
        runAction("Deleting line...", async () => deleteLine(lineId), "Line deleted.");
      },
    });
    return;
  }

  if (activeRoute === ROUTES.directory) {
    bindAdminDirectoryView(root, {
      saveDirectory: (payload) => runAction("Saving directory details...", async () => {
        await saveDirectoryConnection(getState().workspace.id, payload);
      }, "Directory details saved."),
    });
    return;
  }

  bindTimeReportView(root, state, {
    saveEntry: (payload) => runAction("Saving time entry...", async () => {
      const current = getState();
      const target = parseTargetKey(payload.target_key);
      const entryPayload = { ...payload, ...target };
      if (payload.entryId) {
        await updateTimeEntry(payload.entryId, current.workspace.id, current.session.user.id, entryPayload);
      } else {
        await createTimeEntry(current.workspace.id, current.session.user.id, entryPayload);
      }
    }, "Time entry saved."),
    deleteEntry: (entryId) => {
      if (!window.confirm("Delete this time entry?")) return;
      runAction("Deleting time entry...", async () => deleteTimeEntry(entryId), "Time entry deleted.");
    },
  });
}

function bindAuth(state) {
  bindAuthView(root, {
    setAuthMode: (authMode) => {
      clearActionStatus();
      setState({ authMode });
    },
    submitAuth: ({ mode, email, password, fullName }) => {
      if (mode === "signup") {
        signUpUser({ email, password, fullName });
      } else {
        signInUser({ email, password });
      }
    },
    createWorkspace: (payload) => createFirstWorkspace(payload),
    joinInvite: (payload) => joinCompanyWithInvite(payload),
  });
}

function render() {
  const state = getState();
  if (!root) return;

  if (state.appLoading) {
    root.innerHTML = renderLoadingScreen(state);
    return;
  }

  if (!state.session || state.requiresWorkspaceSetup) {
    root.innerHTML = renderAuthView(state);
    bindAuth(state);
    return;
  }

  const activeRoute = routeForRole(state.route, state.role);
  root.innerHTML = renderShell(state, activeContent(state, activeRoute));
  bindCurrentView(state, activeRoute);
}

subscribe(render);
bindRouter((route) => setRoute(route));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNavOpen(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980 && getState().navOpen) setNavOpen(false);
});

initializeAuth();
render();
