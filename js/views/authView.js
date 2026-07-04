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

function renderAuthForm(state) {
  const mode = state.authMode || "signin";
  const isSignup = mode === "signup";
  return `
    <section class="auth-shell">
      <div class="auth-hero">
        <div class="auth-hero-inner">
          <div class="brand-wordmark" aria-label="TimeLine">Time<span>Line</span></div>
          <div class="auth-copy">
            <p class="eyebrow">Company time reporting</p>
            <h1>Time work can trust.</h1>
            <p>Report hours against projects or line organizations, keep company records organized, and give admins a clear place for people, catalogs, and profile settings.</p>
          </div>
          <div class="auth-proof" aria-label="TimeLine highlights">
            <div class="proof-card"><strong>2</strong><span>reporting targets: projects and lines</span></div>
            <div class="proof-card"><strong>14d</strong><span>default invite window for new team members</span></div>
            <div class="proof-card"><strong>1</strong><span>shared company record per setup</span></div>
          </div>
        </div>
      </div>
      <div class="auth-panel-wrap">
        <div class="auth-panel">
          <div class="auth-card">
            <div class="tabs" role="tablist" aria-label="Authentication mode">
              <button class="tab-button ${!isSignup ? "active" : ""}" type="button" role="tab" aria-selected="${!isSignup}" data-auth-mode="signin">Sign in</button>
              <button class="tab-button ${isSignup ? "active" : ""}" type="button" role="tab" aria-selected="${isSignup}" data-auth-mode="signup">Create account</button>
            </div>
            <h2>${isSignup ? "Start your TimeLine account" : "Welcome back"}</h2>
            <p>${isSignup ? "Create the shared auth account first. Company setup happens after sign-in." : "Use your existing account if you already use another service from the same provider."}</p>
            <form class="form-stack" data-auth-form>
              ${isSignup ? `
                <div class="field">
                  <label for="fullName">Full name</label>
                  <input id="fullName" name="fullName" autocomplete="name" aria-label="Full name" required>
                </div>
              ` : ""}
              <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" autocomplete="email" aria-label="Email" required>
              </div>
              <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" aria-label="Password" minlength="8" required>
              </div>
              <button class="button primary" type="submit">${isSignup ? "Create account" : "Sign in"}</button>
            </form>
            <p class="trust-note">Sign-in is handled securely by Supabase. If you have used another service from the same provider, the same account may work here.</p>
            ${state.fatalError ? `<div class="status error" role="alert">${escapeHtml(state.fatalError)}</div>` : ""}
            ${renderStatus(state.actionStatus)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderWorkspaceSetup(state) {
  const profileName = state.profile?.full_name || "";
  return `
    <section class="auth-shell">
      <div class="auth-hero">
        <div class="auth-hero-inner">
          <div class="brand-wordmark" aria-label="TimeLine">Time<span>Line</span></div>
          <div class="auth-copy">
            <p class="eyebrow">First company setup</p>
            <h1>Create your reporting base.</h1>
            <p>Set the company name once, then add projects, line organizations, people, and daily hours from the admin screens.</p>
          </div>
          <div class="auth-proof" aria-label="Company setup steps">
            <div class="proof-card"><strong>1</strong><span>company profile</span></div>
            <div class="proof-card"><strong>2</strong><span>catalog lists</span></div>
            <div class="proof-card"><strong>3</strong><span>time reports</span></div>
          </div>
        </div>
      </div>
      <div class="auth-panel-wrap">
        <div class="auth-panel">
          <div class="auth-card">
            <h2>Create company</h2>
            <p>This creates your TimeLine profile and makes you the first admin.</p>
            <form class="form-stack" data-workspace-form>
              <div class="field">
                <label for="displayName">Your display name</label>
                <input id="displayName" name="displayName" autocomplete="name" value="${escapeHtml(profileName)}" required>
              </div>
              <div class="field">
                <label for="workspaceName">Company name</label>
                <input id="workspaceName" name="workspaceName" autocomplete="organization" placeholder="Example Manufacturing AB" required>
              </div>
              <button class="button primary" type="submit">Create company</button>
            </form>
            <div class="empty-state" style="margin-top:16px;">
              <strong>Have an invite code?</strong>
              <form class="form-stack" data-invite-join-form>
                <div class="field">
                  <label for="inviteDisplayName">Your display name</label>
                  <input id="inviteDisplayName" name="displayName" autocomplete="name" value="${escapeHtml(profileName)}" required>
                </div>
                <div class="field">
                  <label for="inviteCode">Invite code</label>
                  <input id="inviteCode" name="inviteCode" autocomplete="one-time-code" required>
                </div>
                <button class="button secondary" type="submit">Join company</button>
              </form>
            </div>
            ${renderStatus(state.actionStatus)}
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderAuthView(state) {
  if (state.session && state.requiresWorkspaceSetup) {
    return renderWorkspaceSetup(state);
  }
  return renderAuthForm(state);
}

export function bindAuthView(root, handlers) {
  root.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => handlers.setAuthMode(button.dataset.authMode));
  });

  const authForm = root.querySelector("[data-auth-form]");
  if (authForm) {
    authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(authForm);
      handlers.submitAuth({
        mode: root.querySelector(".tab-button.active")?.dataset.authMode || "signin",
        email: form.get("email"),
        password: form.get("password"),
        fullName: form.get("fullName"),
      });
    });
  }

  const workspaceForm = root.querySelector("[data-workspace-form]");
  if (workspaceForm) {
    workspaceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(workspaceForm);
      handlers.createWorkspace({
        workspaceName: form.get("workspaceName"),
        displayName: form.get("displayName"),
      });
    });
  }

  const inviteJoinForm = root.querySelector("[data-invite-join-form]");
  if (inviteJoinForm) {
    inviteJoinForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(inviteJoinForm);
      handlers.joinInvite({
        inviteCode: form.get("inviteCode"),
        displayName: form.get("displayName"),
      });
    });
  }
}
