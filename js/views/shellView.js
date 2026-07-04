import { ROUTES } from "../config/runtime.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const navItems = [
  { route: ROUTES.time, label: "Report time", admin: false },
  { route: ROUTES.company, label: "Company", admin: true },
  { route: ROUTES.people, label: "People", admin: true },
  { route: ROUTES.catalog, label: "Catalog", admin: true },
  { route: ROUTES.directory, label: "Directory", admin: true },
];

function renderLogo(workspace) {
  if (workspace?.logoUrl) {
    return `<span class="workspace-logo"><img src="${escapeHtml(workspace.logoUrl)}" alt="${escapeHtml(workspace.name)} logo"></span>`;
  }
  const initial = (workspace?.name || "TimeLine").trim().charAt(0).toUpperCase() || "T";
  return `<span class="workspace-logo" aria-hidden="true">${escapeHtml(initial)}</span>`;
}

function renderNav(state) {
  const isAdmin = state.role === "admin";
  const items = navItems.filter((item) => !item.admin || isAdmin);
  return `
    <nav class="side-nav" id="mobile-navigation" aria-label="Main navigation">
      <ul class="nav-list">
        ${items.map((item) => `
          <li>
            <a class="nav-link ${state.route === item.route ? "active" : ""}" href="#${item.route}" data-route-link="${item.route}">
              <span>${escapeHtml(item.label)}</span>
            </a>
          </li>
        `).join("")}
      </ul>
    </nav>
  `;
}

export function renderShell(state, content) {
  const workspaceName = state.workspace?.name || "TimeLine";
  const navOpen = state.navOpen ? "nav-open" : "";
  return `
    <div class="shell ${navOpen}">
      <header class="shell-header">
        <div class="shell-brand">
          <button class="icon-button menu-toggle" type="button" aria-label="Open navigation" aria-expanded="${state.navOpen ? "true" : "false"}" aria-controls="mobile-navigation" data-action="toggle-mobile-nav">
            <span class="menu-lines" aria-hidden="true"></span>
          </button>
          ${renderLogo(state.workspace)}
          <div class="shell-title">
            <div class="brand-wordmark" aria-label="TimeLine">Time<span>Line</span></div>
            <p>${escapeHtml(workspaceName)}</p>
          </div>
        </div>
        <button class="button ghost" type="button" data-action="sign-out">Sign out</button>
      </header>
      <div class="shell-body">
        ${renderNav(state)}
        <button class="mobile-backdrop" type="button" aria-label="Close navigation" data-action="close-mobile-nav"></button>
        <main class="shell-main" tabindex="-1">
          ${content}
        </main>
      </div>
    </div>
  `;
}

export function bindShellView(root, handlers) {
  root.querySelector("[data-action='toggle-mobile-nav']")?.addEventListener("click", handlers.toggleNav);
  root.querySelector("[data-action='close-mobile-nav']")?.addEventListener("click", handlers.closeNav);
  root.querySelector("[data-action='sign-out']")?.addEventListener("click", handlers.signOut);
  root.querySelectorAll("[data-route-link]").forEach((link) => {
    link.addEventListener("click", () => handlers.closeNav());
  });
}
