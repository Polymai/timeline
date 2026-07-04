function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderStatus(status) {
  if (!status) return "";
  const type = status.type === "error" ? "error" : status.type === "success" ? "success" : "";
  const spinner = status.type === "loading" ? '<span class="loader" aria-hidden="true"></span>' : "";
  return `<div class="status ${type}" role="status">${spinner}<span>${escapeHtml(status.message)}</span></div>`;
}

function selected(value, expected) {
  return String(value) === String(expected) ? "selected" : "";
}

export function renderAdminCompanyView(state) {
  const workspace = state.workspace || {};
  const profile = state.profile || {};
  const isOwner = workspace.created_by === state.session?.user?.id;
  return `
    <section>
      <div class="page-head">
        <div>
          <p class="eyebrow">Admin settings</p>
          <h1>Company profile</h1>
          <p>Keep the company identity, time zone, work week, and your display name accurate for reporting.</p>
        </div>
      </div>
      <div class="admin-grid">
        <article class="card">
          <h2>Profile details</h2>
          <form class="form-stack" data-company-form>
            <div class="field">
              <label for="companyName">Company name</label>
              <input id="companyName" name="name" value="${escapeHtml(workspace.name)}" autocomplete="organization" required>
            </div>
            <div class="field">
              <label for="displayName">Your display name</label>
              <input id="displayName" name="full_name" value="${escapeHtml(profile.full_name)}" autocomplete="name" required>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="timezone">Time zone</label>
                <select id="timezone" name="timezone">
                  <option value="Europe/Stockholm" ${selected(workspace.timezone, "Europe/Stockholm")}>Europe/Stockholm</option>
                  <option value="Europe/London" ${selected(workspace.timezone, "Europe/London")}>Europe/London</option>
                  <option value="UTC" ${selected(workspace.timezone, "UTC")}>UTC</option>
                  <option value="America/New_York" ${selected(workspace.timezone, "America/New_York")}>America/New_York</option>
                </select>
              </div>
              <div class="field">
                <label for="workWeekDays">Work days per week</label>
                <input id="workWeekDays" name="work_week_days" type="number" min="1" max="7" value="${escapeHtml(workspace.work_week_days || 5)}" required>
              </div>
            </div>
            <div class="field">
              <label for="workWeekStart">Week starts on</label>
              <select id="workWeekStart" name="work_week_start">
                <option value="1" ${selected(workspace.work_week_start, 1)}>Monday</option>
                <option value="0" ${selected(workspace.work_week_start, 0)}>Sunday</option>
                <option value="6" ${selected(workspace.work_week_start, 6)}>Saturday</option>
              </select>
            </div>
            <button class="button primary" type="submit">Save profile</button>
          </form>
          ${renderStatus(state.actionStatus)}
        </article>
        <div>
          <article class="card">
            <h2>Company logo</h2>
            <p>Upload a compact square or horizontal image. TimeLine signs it for members when the app loads.</p>
            <div class="workspace-logo" style="width:88px;height:88px;margin-bottom:16px;">
              ${workspace.logoUrl ? `<img src="${escapeHtml(workspace.logoUrl)}" alt="${escapeHtml(workspace.name)} logo">` : escapeHtml((workspace.name || "T").charAt(0).toUpperCase())}
            </div>
            <form class="form-stack" data-logo-form>
              <div class="field">
                <label for="logoFile">Logo image</label>
                <input id="logoFile" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml">
              </div>
              <button class="button secondary" type="submit">Upload logo</button>
            </form>
            ${workspace.logo_path ? `<p class="entry-note">A company logo is active for signed-in members.</p>` : `<div class="empty-state"><strong>No logo yet</strong><span>The text wordmark remains the visible product brand.</span></div>`}
          </article>
          <article class="card">
            <h2>Plan</h2>
            <div class="plan-stack">
              <div class="plan-row">
                <div>
                  <strong>Free</strong>
                  <span>One company included</span>
                </div>
                <span class="pill">Active</span>
              </div>
              <div class="plan-row">
                <div>
                  <strong>Extra company</strong>
                  <span>$9 USD incl. VAT for each additional company</span>
                </div>
                <span class="pill warn">$9</span>
              </div>
            </div>
            <p class="entry-note">Companies owned by you: ${escapeHtml(state.ownedWorkspaceCount || 0)}. Team invites do not require the person joining to buy a company.</p>
            ${isOwner ? `
              <form class="form-stack" data-extra-company-form>
                <div class="field">
                  <label for="extraCompanyName">New company name</label>
                  <input id="extraCompanyName" name="companyName" autocomplete="organization" required>
                </div>
                <div class="field">
                  <label for="extraDisplayName">Your display name there</label>
                  <input id="extraDisplayName" name="displayName" autocomplete="name" value="${escapeHtml(profile.full_name || "")}" required>
                </div>
                <button class="button primary" type="submit">Continue to checkout</button>
              </form>
            ` : `
              <div class="empty-state">
                <strong>Owner billing</strong>
                <span>Ask the company owner to add another paid company.</span>
              </div>
            `}
          </article>
        </div>
      </div>
    </section>
  `;
}

export function bindAdminCompanyView(root, handlers) {
  root.querySelector("[data-company-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    handlers.saveCompany({
      name: data.get("name"),
      full_name: data.get("full_name"),
      timezone: data.get("timezone"),
      work_week_start: data.get("work_week_start"),
      work_week_days: data.get("work_week_days"),
    });
  });

  root.querySelector("[data-logo-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    handlers.uploadLogo(data.get("logo"));
  });

  root.querySelector("[data-extra-company-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    handlers.startExtraCompanyCheckout({
      companyName: data.get("companyName"),
      displayName: data.get("displayName"),
    });
  });
}
