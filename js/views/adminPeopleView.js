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

function roleOption(role, expected) {
  return role === expected ? "selected" : "";
}

function memberName(member) {
  return member.profile?.full_name || member.email;
}

export function renderAdminPeopleView(state) {
  const pendingInvites = state.invites.filter((invite) => invite.status === "pending");
  return `
    <section>
      <div class="page-head">
        <div>
          <p class="eyebrow">Admin settings</p>
          <h1>People</h1>
          <p>Invite employees by email and keep roles clear for reporting and administration.</p>
        </div>
      </div>
      <div class="admin-grid">
        <article class="card">
          <h2>Invite a person</h2>
          <form class="form-stack" data-invite-form>
            <div class="field">
              <label for="inviteEmail">Email</label>
              <input id="inviteEmail" name="email" type="email" autocomplete="email" required>
            </div>
            <div class="field">
              <label for="inviteRole">Role</label>
              <select id="inviteRole" name="role">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button class="button primary" type="submit">Create invite</button>
          </form>
          <p class="entry-note">The invite code can be shared directly with the employee while automatic email delivery is connected.</p>
          ${renderStatus(state.actionStatus)}
        </article>
        <div>
          <article class="list-card">
            <div class="list-head">
              <span>Member</span>
              <span>Role</span>
              <span></span>
            </div>
            ${state.members.map((member) => `
              <div class="list-row">
                <div class="row-title">
                  <strong>${escapeHtml(memberName(member))}</strong>
                  <span>${escapeHtml(member.email)}</span>
                </div>
                <select aria-label="Role for ${escapeHtml(member.email)}" data-member-role="${member.id}">
                  <option value="member" ${roleOption(member.role, "member")}>Member</option>
                  <option value="admin" ${roleOption(member.role, "admin")}>Admin</option>
                </select>
                <div class="row-actions">
                  <button class="button secondary" type="button" data-action="save-member-role" data-member-id="${member.id}">Save</button>
                </div>
              </div>
            `).join("")}
          </article>
          <article class="list-card">
            <div class="list-head">
              <span>Pending invite</span>
              <span>Role</span>
              <span></span>
            </div>
            ${pendingInvites.length ? pendingInvites.map((invite) => `
              <div class="list-row">
                <div class="row-title">
                  <strong>${escapeHtml(invite.email)}</strong>
                  <span>Code ${escapeHtml(invite.token)} expires ${escapeHtml(String(invite.expires_at || "").slice(0, 10))}</span>
                </div>
                <span class="pill warn">${escapeHtml(invite.role)}</span>
                <div class="row-actions">
                  <button class="button secondary" type="button" data-action="copy-invite" data-token="${escapeHtml(invite.token)}">Copy code</button>
                  <button class="button ghost" type="button" data-action="revoke-invite" data-invite-id="${invite.id}">Revoke</button>
                </div>
              </div>
            `).join("") : `
              <div class="empty-state">
                <strong>No pending invites</strong>
                <span>New invites will appear here with shareable codes.</span>
              </div>
            `}
          </article>
        </div>
      </div>
    </section>
  `;
}

export function bindAdminPeopleView(root, handlers) {
  root.querySelector("[data-invite-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    handlers.createInvite({ email: data.get("email"), role: data.get("role") });
  });

  root.querySelectorAll("[data-action='save-member-role']").forEach((button) => {
    button.addEventListener("click", () => {
      const select = root.querySelector(`[data-member-role="${button.dataset.memberId}"]`);
      handlers.updateMemberRole(button.dataset.memberId, select?.value || "member");
    });
  });

  root.querySelectorAll("[data-action='revoke-invite']").forEach((button) => {
    button.addEventListener("click", () => handlers.revokeInvite(button.dataset.inviteId));
  });

  root.querySelectorAll("[data-action='copy-invite']").forEach((button) => {
    button.addEventListener("click", () => handlers.copyInvite(button.dataset.token));
  });
}
