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

function renderProjectRows(projects) {
  if (!projects.length) {
    return `<div class="empty-state"><strong>No projects</strong><span>Add billable or internal projects that receive reported time.</span></div>`;
  }
  return projects.map((project) => `
    <div class="list-row">
      <div class="row-title">
        <strong>${escapeHtml(project.name)}</strong>
        <span>${escapeHtml(project.client || project.code || "Project")}</span>
      </div>
      <span class="pill">${escapeHtml(project.status)}</span>
      <div class="row-actions">
        <button class="button secondary" type="button" data-action="edit-project" data-project-id="${project.id}">Edit</button>
        <button class="button ghost" type="button" data-action="delete-project" data-project-id="${project.id}">Delete</button>
      </div>
    </div>
  `).join("");
}

function renderLineRows(lines) {
  if (!lines.length) {
    return `<div class="empty-state"><strong>No line organizations</strong><span>Add production, service, or operational lines that receive reported time.</span></div>`;
  }
  return lines.map((line) => `
    <div class="list-row">
      <div class="row-title">
        <strong>${escapeHtml(line.name)}</strong>
        <span>${escapeHtml(line.manager_email || line.code || "Line")}</span>
      </div>
      <span class="pill">${escapeHtml(line.status)}</span>
      <div class="row-actions">
        <button class="button secondary" type="button" data-action="edit-line" data-line-id="${line.id}">Edit</button>
        <button class="button ghost" type="button" data-action="delete-line" data-line-id="${line.id}">Delete</button>
      </div>
    </div>
  `).join("");
}

export function renderAdminCatalogView(state) {
  return `
    <section>
      <div class="page-head">
        <div>
          <p class="eyebrow">Admin settings</p>
          <h1>Catalog</h1>
          <p>Maintain the projects and line organizations employees can choose when they report time.</p>
        </div>
      </div>
      <div class="two-column-list">
        <article class="card">
          <h2>Project</h2>
          <form class="form-stack" data-project-form>
            <input type="hidden" name="id">
            <div class="field">
              <label for="projectName">Name</label>
              <input id="projectName" name="name" required>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="projectCode">Code</label>
                <input id="projectCode" name="code">
              </div>
              <div class="field">
                <label for="projectClient">Client</label>
                <input id="projectClient" name="client">
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="projectColor">Color</label>
                <input id="projectColor" name="color" type="color" value="#0f6d6b">
              </div>
              <div class="field">
                <label for="projectStatus">Status</label>
                <select id="projectStatus" name="status">
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div class="row-actions">
              <button class="button secondary" type="button" data-action="reset-project-form">Reset</button>
              <button class="button primary" type="submit">Save project</button>
            </div>
          </form>
        </article>
        <article class="card">
          <h2>Line organization</h2>
          <form class="form-stack" data-line-form>
            <input type="hidden" name="id">
            <div class="field">
              <label for="lineName">Name</label>
              <input id="lineName" name="name" required>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="lineCode">Code</label>
                <input id="lineCode" name="code">
              </div>
              <div class="field">
                <label for="lineManager">Manager email</label>
                <input id="lineManager" name="manager_email" type="email">
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="lineColor">Color</label>
                <input id="lineColor" name="color" type="color" value="#ec7e4c">
              </div>
              <div class="field">
                <label for="lineStatus">Status</label>
                <select id="lineStatus" name="status">
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div class="row-actions">
              <button class="button secondary" type="button" data-action="reset-line-form">Reset</button>
              <button class="button primary" type="submit">Save line</button>
            </div>
          </form>
        </article>
      </div>
      ${renderStatus(state.actionStatus)}
      <div class="two-column-list" style="margin-top:18px;">
        <article class="list-card">
          <div class="list-head"><span>Projects</span><span>Status</span><span></span></div>
          ${renderProjectRows(state.projects)}
        </article>
        <article class="list-card">
          <div class="list-head"><span>Lines</span><span>Status</span><span></span></div>
          ${renderLineRows(state.lines)}
        </article>
      </div>
    </section>
  `;
}

export function bindAdminCatalogView(root, state, handlers) {
  const projectForm = root.querySelector("[data-project-form]");
  const lineForm = root.querySelector("[data-line-form]");

  projectForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(projectForm);
    handlers.saveProject({
      id: data.get("id"),
      name: data.get("name"),
      code: data.get("code"),
      client: data.get("client"),
      color: data.get("color"),
      status: data.get("status"),
    });
  });

  lineForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(lineForm);
    handlers.saveLine({
      id: data.get("id"),
      name: data.get("name"),
      code: data.get("code"),
      manager_email: data.get("manager_email"),
      color: data.get("color"),
      status: data.get("status"),
    });
  });

  root.querySelector("[data-action='reset-project-form']")?.addEventListener("click", () => projectForm?.reset());
  root.querySelector("[data-action='reset-line-form']")?.addEventListener("click", () => lineForm?.reset());

  root.querySelectorAll("[data-action='edit-project']").forEach((button) => {
    button.addEventListener("click", () => {
      const project = state.projects.find((item) => item.id === button.dataset.projectId);
      if (!project || !projectForm) return;
      projectForm.elements.id.value = project.id;
      projectForm.elements.name.value = project.name || "";
      projectForm.elements.code.value = project.code || "";
      projectForm.elements.client.value = project.client || "";
      projectForm.elements.color.value = project.color || "#0f6d6b";
      projectForm.elements.status.value = project.status || "active";
      projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  root.querySelectorAll("[data-action='edit-line']").forEach((button) => {
    button.addEventListener("click", () => {
      const line = state.lines.find((item) => item.id === button.dataset.lineId);
      if (!line || !lineForm) return;
      lineForm.elements.id.value = line.id;
      lineForm.elements.name.value = line.name || "";
      lineForm.elements.code.value = line.code || "";
      lineForm.elements.manager_email.value = line.manager_email || "";
      lineForm.elements.color.value = line.color || "#ec7e4c";
      lineForm.elements.status.value = line.status || "active";
      lineForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  root.querySelectorAll("[data-action='delete-project']").forEach((button) => {
    button.addEventListener("click", () => handlers.deleteProject(button.dataset.projectId));
  });

  root.querySelectorAll("[data-action='delete-line']").forEach((button) => {
    button.addEventListener("click", () => handlers.deleteLine(button.dataset.lineId));
  });
}
