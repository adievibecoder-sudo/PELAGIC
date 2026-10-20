# PELAGIC 0.4 — Research Source Index, Provenance and Corrections

**Purpose:** Enable Astra to locate actual research, distinguish current source truth from hypotheses, and avoid repeating prior scientific mistakes or relying on memory.

## Priority and authority

1. Actual published v0.3.0-dev.1 shaders/code and repeatable tests.
2. Actual original full-resolution evidence and measured GPU reports, including their known limitations.
3. `docs/V03-ACCEPTANCE.md`, `docs/V03-EVALUATION.md`, `docs/V03-STAGES.md`, related v0.3 source.
4. Hark's **PELAGIC 0.4 Complete Research Package**, 52 pages, 20 October 2026. Its extracted-text access copy is in `docs/research/PELAGIC_0.4_HARK_RESEARCH_EXTRACTED.md` if the later archival commit succeeds; use original PDF for diagrams/tables.
5. Hark's **PELAGIC Master Research Compendium for Version 0.4**, 101 pages, 20 October 2026, historically focused on **0.2**; an archival text access copy is intended at `docs/research/PELAGIC_0.4_PRIOR_COMPENDIUM_EXTRACTED.md`. Treat its older source assertions as superseded by completed 0.3.
6. Independent GPT-5.5 critique and corrections consolidated in `docs/V04-RESEARCH-CORRECTIONS.md`.
7. Scientific primary sources and the exact scope of their equations; cite what was actually accessed. No presumption that a listed scientific candidate is the right implementation.

**Extraction caveat:** PDF-to-text retrieval can flatten tables, lose formula positioning, omit figures and preserve page-marker artifacts. Archived text is for searching and contextual study, not a lossless reproduction. Original PDFs, research scripts and the separate decision-register/open-question Markdown files should be supplied for exact checks when not available.

## Source status checklist for Phase 0

| Input | Present / available | Follow-up |
|---|---|---|
| Full v0.3 project and tracked reports | Present on branch | Verify checksum/branch and current source |
| Published v0.3 evidence ZIP | Available via GitHub release | Verify and inspect accessible media; state subset actually watched |
| Hark 52-page PDF | Supplied previously in conversation; extracted Markdown planned | Verify extraction and request original for figures if necessary |
| Prior Hark 101-page compendium | Supplied previously; extracted Markdown planned | Cross-check older 0.2 assertions against final 0.3 |
| Hark's original 34-item decision register and 18 open questions | Included in the 52-page PDF appendix | Use exact appendix and mark extraction limitations |
| GPT-5.5 critique/correction | Condensed transcript in repository correction document | Treat unverified source quotes as hypotheses |
| Other original Hark Part II and lighting research PDFs | **Not verified present** | Request individually if exact historical reconciliation is still decision-critical |
| Independent experiment source/data `pope97.dat` | `docs/pope97.dat` exists | Confirm units, interpolation and spectrum assumptions |
| Real-world approved reference photos/video | **Not yet selected** | Source/provenance/license + owner approval required |
| RTX 3050 0.4 GPU results | **Not yet run** | Astra prepares commands; owner performs tests |

## Decision principle

The compiled research archive is not a binding algorithm list. Each scientific parameter or architectural recommendation is [SRC]/[TEST]/[LIT]/[VIS]/[HYP] with recorded source and evidence, or is marked UNVERIFIED. Resolve important conflicts by narrow mathematical tests, source inspection and real-world visual proof. Refer to `AGENTS.md`, the master brief's scientific-correction register and the current Phase 0 kickoff.
