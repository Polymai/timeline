function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function numberHours(value) {
  const amount = Number(value || 0);
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function targetMap(state) {
  const map = new Map();
  for (const project of state.projects) {
    map.set(`project:${project.id}`, { kind: "project", id: project.id, name: project.name, meta: project.client || project.code || "Project" });
  }
  for (const line of state.lines) {
    map.set(`line:${line.id}`, { kind: "line", id: line.id, name: line.name, meta: line.manager_email || line.code || "Line" });
  }
  return map;
}

function targetKey(entry) {
  return entry.target_kind === "project" ? `project:${entry.project_id}` : `line:${entry.line_id}`;
}

function targetName(entry, targets) {
  return targets.get(targetKey(entry))?.name || "Archived target";
}

function entryOwner(entry, state) {
  const member = state.members.find((item) => item.user_id === entry.user_id);
  return member?.profile?.full_name || member?.email || state.profile?.full_name || "Team member";
}

function weekStart(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function renderStatus(status) {
  if (!status) return "";
  const type = status.type === "error" ? "error" : status.type === "success" ? "success" : "";
  const spinner = status.type === "loading" ? '<span class="loader" aria-hidden="true"></span>' : "";
  return `<div class="status ${type}" role="status">${spinner}<span>${escapeHtml(status.message)}</span></div>`;
}

function renderTargetOptions(state) {
  const activeProjects = state.projects.filter((item) => item.status === "active");
  const activeLines = state.lines.filter((item) => item.status === "active");
  if (!activeProjects.length && !activeLines.length) {
    return '<option value="">Create a project or line first</option>';
  }
  return `
    ${activeProjects.length ? `
      <optgroup label="Projects">
        ${activeProjects.map((project) => `<option value="project:${project.id}">${escapeHtml(project.name)}</option>`).join("")}
      </optgroup>
    ` : ""}
    ${activeLines.length ? `
      <optgroup label="Lines">
        ${activeLines.map((line) => `<option value="line:${line.id}">${escapeHtml(line.name)}</option>`).join("")}
      </optgroup>
    ` : ""}
  `;
}

function renderEntries(state) {
  const targets = targetMap(state);
  if (!state.entries.length) {
    return `
      <div class="empty-state">
        <strong>No time entries yet</strong>
        <span>Add your first entry once an admin has created at least one active project or line.</span>
      </div>
    `;
  }

  return `
    <div class="list-card">
      <div class="list-head">
        <span>Entry</span>
        <span>Hours</span>
        <span></span>
      </div>
      ${state.entries.map((entry) => `
        <div class="list-row" data-entry-row="${entry.id}">
          <div class="row-title">
            <strong>${escapeHtml(targetName(entry, targets))}</strong>
            <span>${escapeHtml(entry.entry_date)} by ${escapeHtml(entryOwner(entry, state))}${entry.note ? ` - ${escapeHtml(entry.note)}` : ""}</span>
          </div>
          <span class="pill">${numberHours(entry.hours)} h</span>
          <div class="row-actions">
            <button class="button secondary" type="button" data-action="edit-entry" data-entry-id="${entry.id}">Edit</button>
            <button class="button ghost" type="button" data-action="delete-entry" data-entry-id="${entry.id}">Delete</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStats(state) {
  const now = new Date();
  const start = weekStart(now);
  const month = now.toISOString().slice(0, 7);
  const ownEntries = state.entries.filter((entry) => entry.user_id === state.session?.user?.id);
  const weekHours = ownEntries
    .filter((entry) => new Date(`${entry.entry_date}T00:00:00`) >= start)
    .reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  const monthHours = ownEntries
    .filter((entry) => entry.entry_date.startsWith(month))
    .reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  const teamHours = state.entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  return `
    <div class="stat-grid">
      <div class="stat-card"><span>This week</span><strong>${numberHours(weekHours)}h</strong></div>
      <div class="stat-card"><span>This month</span><strong>${numberHours(monthHours)}h</strong></div>
      <div class="stat-card"><span>Visible total</span><strong>${numberHours(teamHours)}h</strong></div>
    </div>
  `;
}

export function renderTimeReportView(state) {
  const hasTargets = state.projects.some((item) => item.status === "active") || state.lines.some((item) => item.status === "active");
  return `
    <section>
      <div class="page-head">
        <div>
          <p class="eyebrow">Daily reporting</p>
          <h1>Report time</h1>
          <p>Log hours against the project or line organization that actually used the work.</p>
        </div>
      </div>
      ${renderStats(state)}
      <div class="view-grid">
        <article class="card">
          <h2>New entry</h2>
          <p>Use decimal hours, for example 1.5 for one hour and thirty minutes.</p>
          <form class="form-stack" data-time-form>
            <input type="hidden" name="entryId">
            <div class="field-row">
              <div class="field">
                <label for="entryDate">Date</label>
                <input id="entryDate" name="entry_date" type="date" value="${todayIso()}" required>
              </div>
              <div class="field">
                <label for="hours">Hours</label>
                <input id="hours" name="hours" type="number" min="0.25" max="24" step="0.25" placeholder="7.5" required>
              </div>
            </div>
            <div class="field">
              <label for="targetKey">Project or line</label>
              <select id="targetKey" name="target_key" ${hasTargets ? "" : "disabled"} required>
                ${renderTargetOptions(state)}
              </select>
            </div>
            <div class="field">
              <label for="note">Note</label>
              <textarea id="note" name="note" maxlength="500" placeholder="Optional context for this entry"></textarea>
            </div>
            <div class="row-actions">
              <button class="button secondary" type="button" data-action="reset-entry-form">Reset</button>
              <button class="button primary" type="submit" ${hasTargets ? "" : "disabled"}>Save entry</button>
            </div>
          </form>
          ${!hasTargets ? `
            <div class="status warning" role="status">An admin needs to create an active project or line before time can be reported.</div>
          ` : ""}
          ${renderStatus(state.actionStatus)}
        </article>
        <article>
          ${renderEntries(state)}
        </article>
      </div>
    </section>
  `;
}

export function bindTimeReportView(root, state, handlers) {
  const form = root.querySelector("[data-time-form]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    handlers.saveEntry({
      entryId: data.get("entryId"),
      entry_date: data.get("entry_date"),
      hours: data.get("hours"),
      target_key: data.get("target_key"),
      note: data.get("note"),
    });
  });

  root.querySelector("[data-action='reset-entry-form']")?.addEventListener("click", () => form?.reset());

  root.querySelectorAll("[data-action='edit-entry']").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = state.entries.find((item) => item.id === button.dataset.entryId);
      if (!entry || !form) return;
      form.elements.entryId.value = entry.id;
      form.elements.entry_date.value = entry.entry_date;
      form.elements.hours.value = numberHours(entry.hours);
      form.elements.target_key.value = targetKey(entry);
      form.elements.note.value = entry.note || "";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  root.querySelectorAll("[data-action='delete-entry']").forEach((button) => {
    button.addEventListener("click", () => handlers.deleteEntry(button.dataset.entryId));
  });
}
