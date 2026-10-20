# PELAGIC — Required GitHub Preservation Rules

**Checked on 20 October 2026 via the connected GitHub API:**
- \`main\` branch reports \`protected: false\`.
- \`development/pelagic-0.3\` branch reports \`protected: false\`.
- \`development/pelagic-0.4\` branch reports \`protected: false\`.
- Repository \`/rulesets\` returned \`[]\`. The integration cannot read the legacy branch-protection detail endpoint (403), and does **not** provide a ruleset create/edit action.

**Therefore, GitHub ref protections are NOT confirmed as enabled.** A policy written in AGENTS.md does not enforce ref safety. **The repository administrator/owner must configure protection through GitHub Settings.** Do not claim setup is completed until the GitHub API/UI reports the active rulesets.

## Recommended owner UI setup

Open https://github.com/adievibecoder-sudo/PELAGIC/settings/rules

Create and activate **two** distinct repository rulesets:

### A. Frozen branches — "PELAGIC frozen baselines"

- **Type:** Branch ruleset.
- **Targets:** Explicit \`main\` and \`development/pelagic-0.3\` (avoid targeting \`development/pelagic-0.4\`, which is the active working branch).
- **Enforcement:** Active.
- **Protections:** Restrict updates (if supported for your selected policy), restrict deletions and block force pushes. Alternatively combine pull-request-only updates with required human review where policies permit.
- **Bypass:** No autonomous agent, Codex GitHub App, or blanket writer bypass; administrator emergency access only if deliberately required and understood.
- Check that any chosen approval policy cannot be bypassed by the agent through the same credentials used for development.

### B. Frozen release tags — "PELAGIC immutable releases"

- **Type:** Tag ruleset.
- **Targets:** Exact \`v0.2.0\` and \`v0.3.0-dev.1\` or an intentionally broader \`v0.2.*\` and \`v0.3.*\` pattern (review whether future patch releases should be permitted).
- **Enforcement:** Active.
- **Protections:** Restrict tag updates and deletion; do not forbid creating unrelated future v0.4 tags by accident.
- **Bypass:** No autonomous development agent or routine write credentials. Understand emergency owner bypass if configured.

**Do not** restrict all branches or all \`v*\` tags so broadly that normal 0.4 development or a user-authorized future release becomes impossible. If future changes to frozen branches are never intended, restrict updates outright. Choose bypass rules carefully: broad \`admin\` or \`write\` bypass could undermine the protection if an agent uses the same account.

### Verification after owner setup

- Reopen the rulesets page and confirm both policies are **Active** and target only intended refs.
- Confirm the applicable branch report now shows protected and verify that a tag ruleset actually exists for the frozen tags.
- Astra records the evidence/status in \`docs/V04-STATE.md\`; if the rulesets are not confirmed, preserve the explicit **NOT PROTECTED** warning.

**Documentation:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository

**Status:** Owner action required — no settings have been changed through this brief.
