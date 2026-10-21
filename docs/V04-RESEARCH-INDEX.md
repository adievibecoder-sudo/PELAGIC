# PELAGIC 0.4 — Research Source Index, Provenance and Corrections

**Purpose:** Enable Astra to locate actual research, distinguish current source truth from hypotheses, and avoid repeating prior scientific mistakes or relying on memory.

## Latest independent R&D and AAA work (21 October 2026)
- Full user-supplied *Final Targeted R&D and Technical Decision Report*: `docs/research/PELAGIC_V04_TARGETED_RD_2026-10-21.md` (archived source, NOT reproduced PELAGIC measurements).
- **Immediate binding scope**: `docs/V04-PHASE1-KICKOFF.md`. Condensed game-production candidate decisions: `docs/V04-AAA-TECHNIQUE-DECISIONS.md`.
- Owner's 36-page *AAA Ocean Research Master* is an archival synthesis; original Rare/Guerrilla/Ubisoft/Naughty Dog references and transfer limits are indexed in AAA decisions. No unpublished source code is asserted.
- Priority: actual PELAGIC source and Phase 0 test/media evidence > project acceptance > verified primary source > research hypotheses. No paper authorizes production algorithms by itself.

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
| Full v0.3 project and tracked reports | Present; frozen SHAs recorded in STATE | Default shader preservation tested; no frozen-ref changes |
| Published v0.3 evidence ZIP | Locally verified; all 821 files match | Phase 0 report identifies inspected subset; no exhaustive movie review claim |
| Hark 52-page PDF | Local original available; SHA-256 and access scope in Phase 0 sources | Text/register/scripts inspected; original page 6 visually inspected; no complete figure certification |
| Prior Hark 101-page compendium | Local original located; archived extraction present | Not newly reread end-to-end; older 0.2 assertions subordinate to final 0.3 |
| Hark's original 34-item decision register and 18 open questions | Local supplied Markdown and PDF appendix available | Inspected as hypotheses; extraction limitations retained |
| GPT-5.5 critique/correction | Condensed transcript in repository correction document | Treat unverified source quotes as hypotheses |
| Other original Hark Part II and lighting research PDFs | **Not verified present** | Request individually if exact historical reconciliation is still decision-critical |
| Independent experiment source/data `pope97.dat` | Header units 1/cm confirmed; converted to 1/m | D65/CIE integration test run; paper not newly read; pure-water data not full seawater validation |
| Real-world approved reference photos/video | Three provisional sources documented and inspected within stated limits | Most slots and owner approval remain pending; no calibrated scene match |
| RTX 3050 0.4 GPU results | Native desktop tests and four benchmarks executed | Corroboration/limitations in report; performance targets FAIL, stall cause UNVERIFIED |

## Decision principle

The compiled research archive is not a binding algorithm list. Each scientific parameter or architectural recommendation is [SRC]/[TEST]/[LIT]/[VIS]/[HYP] with recorded source and evidence, or is marked UNVERIFIED. Resolve important conflicts by narrow mathematical tests, source inspection and real-world visual proof. Refer to `AGENTS.md`, the master brief's scientific-correction register and the **current Phase 1 kickoff**; Phase 0 kickoff is historical evidence.
