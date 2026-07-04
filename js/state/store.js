import { DEFAULT_ROUTE } from "../config/runtime.js";

const listeners = new Set();

const initialState = {
  appLoading: true,
  actionStatus: null,
  blockingStatus: null,
  fatalError: "",
  session: null,
  profile: null,
  workspace: null,
  workspaces: [],
  ownedWorkspaceCount: 0,
  role: "",
  projects: [],
  lines: [],
  members: [],
  invites: [],
  entries: [],
  directoryConnection: null,
  requiresWorkspaceSetup: false,
  route: DEFAULT_ROUTE,
  navOpen: false,
  authMode: "signin",
};

let state = { ...initialState };

export function getState() {
  return state;
}

export function setState(patch) {
  state = { ...state, ...patch };
  for (const listener of listeners) {
    listener(state);
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearWorkspaceState() {
  setState({
    profile: null,
    workspace: null,
    workspaces: [],
    ownedWorkspaceCount: 0,
    role: "",
    projects: [],
    lines: [],
    members: [],
    invites: [],
    entries: [],
    directoryConnection: null,
    requiresWorkspaceSetup: false,
    navOpen: false,
  });
}

export function setActionStatus(status) {
  setState({ actionStatus: status });
}

export function clearActionStatus() {
  setState({ actionStatus: null });
}

export function setBlockingStatus(status) {
  setState({ blockingStatus: status });
}

export function clearBlockingStatus() {
  setState({ blockingStatus: null });
}

export function setRoute(route) {
  setState({ route, navOpen: false });
}

export function setNavOpen(navOpen) {
  setState({ navOpen });
}
