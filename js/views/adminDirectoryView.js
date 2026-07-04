function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function selected(value, expected) {
  return String(value) === String(expected) ? "selected" : "";
}

function renderStatus(status) {
  if (!status) return "";
  const type = status.type === "error" ? "error" : status.type === "success" ? "success" : "";
  const spinner = status.type === "loading" ? '<span class="loader" aria-hidden="true"></span>' : "";
  return `<div class="status ${type}" role="status">${spinner}<span>${escapeHtml(status.message)}</span></div>`;
}

export function renderAdminDirectoryView(state) {
  const connection = state.directoryConnection || {};
  return `
    <section>
      <div class="page-head">
        <div>
          <p class="eyebrow">Admin settings</p>
          <h1>Directory</h1>
          <p>Record Entra ID-style connection details and readiness so people setup has a clear owner path.</p>
        </div>
      </div>
      <div class="admin-grid">
        <article class="card">
          <h2>Connection status</h2>
          <form class="form-stack" data-directory-form>
            <div class="field">
              <label for="tenantId">Tenant ID</label>
              <input id="tenantId" name="tenant_id" value="${escapeHtml(connection.tenant_id)}" placeholder="00000000-0000-0000-0000-000000000000">
            </div>
            <div class="field">
              <label for="primaryDomain">Primary domain</label>
              <input id="primaryDomain" name="primary_domain" value="${escapeHtml(connection.primary_domain)}" placeholder="company.com">
            </div>
            <div class="field-row">
              <div class="field">
                <label for="syncMode">Sync mode</label>
                <select id="syncMode" name="sync_mode">
                  <option value="manual" ${selected(connection.sync_mode || "manual", "manual")}>Manual</option>
                  <option value="scheduled" ${selected(connection.sync_mode, "scheduled")}>Scheduled</option>
                </select>
              </div>
              <div class="field">
                <label for="directoryStatus">Status</label>
                <select id="directoryStatus" name="status">
                  <option value="draft" ${selected(connection.status || "draft", "draft")}>Draft</option>
                  <option value="ready" ${selected(connection.status, "ready")}>Ready</option>
                  <option value="paused" ${selected(connection.status, "paused")}>Paused</option>
                </select>
              </div>
            </div>
            <button class="button primary" type="submit">Save directory details</button>
          </form>
          ${renderStatus(state.actionStatus)}
        </article>
        <article class="card">
          <h2>Readiness notes</h2>
          ${connection.id ? `
            <div class="stat-grid">
              <div class="stat-card"><span>Provider</span><strong>Entra</strong></div>
              <div class="stat-card"><span>Status</span><strong>${escapeHtml(connection.status || "draft")}</strong></div>
              <div class="stat-card"><span>Mode</span><strong>${escapeHtml(connection.sync_mode || "manual")}</strong></div>
            </div>
            <p class="entry-note">Last checked ${escapeHtml(String(connection.last_checked_at || connection.updated_at || "").slice(0, 16).replace("T", " "))}</p>
          ` : `
            <div class="empty-state">
              <strong>No directory details saved</strong>
              <span>Save the tenant and domain metadata when your identity owner is ready to connect people data.</span>
            </div>
          `}
          <div class="status warning" role="status">Directory sync is not active yet. Employee access still works through TimeLine invites.</div>
        </article>
      </div>
    </section>
  `;
}

export function bindAdminDirectoryView(root, handlers) {
  root.querySelector("[data-directory-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    handlers.saveDirectory({
      tenant_id: data.get("tenant_id"),
      primary_domain: data.get("primary_domain"),
      sync_mode: data.get("sync_mode"),
      status: data.get("status"),
    });
  });
}
