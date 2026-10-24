# 24 Oct 2026 — Safe Integration of Research Handoff with Astra's Local Checkpoint

## State that is known
- Public development branch `development/pelagic-0.4` at `d4f7d806ffc5cb6ffc88e9aa9637edbfe3b5d574` when these docs were prepared.
- Owner's Codex screenshot: Astra reported local commit **`c4185ea`**, 44/44 CPU, 9/9 FFT, 5/5 optics, original default image unchanged, dense-shadow sampling did not remove bright cloud rims, metallic sea remains, packaging was interrupted; **nothing pushed**.
- These are **Astra-reported** local observations. This documentation author cannot inspect the user's Windows filesystem, verify the commit ancestry, confirm file hashes or certify completion.
- Public `AGENTS.md` and `V04-STATE.md` retained historical A-only / Phase-1-only gate wording; new owner-approved combined A+B direction is not yet integrated into the user's local working tree.
- No renderer changes made in this handoff branch. Its AGENTS change is a *proposed replacement* and may conflict with unpublished local instructions.

## Reconciliation procedure for the next authorized Astra session
1. **Inspection only at first:** record local worktree, untracked files, current branch, active server/browser, Git status, current HEAD and evidence/package status. Verify the reported `c4185ea` with local Git; preserve the last successful and interrupted evidence state. Record whether any unrelated work occurred afterward.
2. Read this staged branch / draft PR **without switching away from or overwriting the active branch**. Compare the revised `AGENTS.md` and new research/operating docs against current local copies and owner messages. No assumption that public d4f7d80 matches the active code.
3. On an explicit owner integration instruction, create a safe local preservation reference/commit for any unpublished work, then merge/cherry-pick or selectively copy the docs in a way that does not overwrite newer edits. If instructions or file changes conflict, report exact paths and choose deliberate resolution; never force/reset/clean blindly.
4. Verify updated policy, branch, repo references and git status. Preserve all frozen main/0.2/0.3 commits, LFS objects, original media and unpublished evidence. Publishing or pushing must be an explicit scope decision, with normal Git protections.
5. **Stop after preparation if owner requested only handoff.** Implementation, GPU testing, packaging retry, and further A+B work require the owner's next kickoff. Do not misrepresent a research handoff as visual progress.

## Research PDF handling
The 20-page Hark Part II PDF was provided in the ChatGPT conversation; this branch embeds a **source-aware text synthesis** rather than its binary, to avoid forcing new large Git/LFS objects or duplicating archival research during an urgent local-state recovery. For exact figures, bibliography or parameter tables, attach the original PDF directly to Astra. Hark Part I should similarly be treated as an archival reference. Reuse `docs/V04-RESEARCH-INDEX.md` and other existing indexed source material.
