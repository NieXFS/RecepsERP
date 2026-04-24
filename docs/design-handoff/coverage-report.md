# Design Handoff — Coverage Report

Source bundle: `D7DLpTnSTGMVfBpI4tyvqA` (Claude Design handoff, exported 2026-04-21).
Project name in bundle: `design-sistema`.

## TL;DR

Only **two screens** were mocked: **Dashboard** and **Agenda**. Everything else
in the app's sidebar (Clientes, Profissionais, Serviços, Pacotes, Produtos,
Financeiro, Comissões, Atendente IA, Prontuários, Configurações) is **not
covered by any mock** — you are extrapolating from the shared shell + tokens.

The **shared shell** (sidebar + topbar + typography + color tokens) *is* fully
specified and is embedded in both HTML files, so a re-skin pass on any other
screen can be executed against the design tokens alone.

## Files in the bundle

```
design-sistema/
├── README.md                                   handoff instructions for coding agent
├── chats/
│   ├── chat1.md                                full iteration transcript (Dashboard + Agenda)
│   └── chat2.md                                empty (new chat, no messages)
└── project/
    ├── Dashboard.html                          canonical — sticky header, brand chip, heatmap
    ├── Dashboard-print.html                    PDF-export variant of Dashboard.html
    ├── Agenda.html                             canonical — sticky header, status strip, timeline, kanban
    ├── colors_and_type.css                     shared tokens (optional — HTMLs have inline CSS too)
    ├── assets/logo_texto.svg                   wordmark asset
    └── design_handoff_receps_admin/
        ├── README.md                           structured handoff spec w/ state shape + mutations
        ├── Dashboard.html                      EARLIER version of Dashboard (no sticky chip)
        ├── Agenda.html                         EARLIER version of Agenda (no brand chip)
        └── colors_and_type.css                 token reset
```

**Canonical sources for pixel-matching**: the top-level `project/Dashboard.html`
and `project/Agenda.html`. The `design_handoff_receps_admin/` subfolder is an
earlier snapshot — do not use as reference for the final topbar/chip. The
subfolder's `README.md` is the primary structured spec (state shape, mutations,
token table) and is still current.

## Screens covered in the mock

| Screen | File(s) | Fidelity | Notes |
|---|---|---|---|
| Dashboard | `Dashboard.html` | hi-fi | KPIs, month banner, SVG evolution chart, 7×14 heatmap |
| Dashboard — PDF | `Dashboard-print.html` | hi-fi | Print variant (compact density, light theme, grid subtle) |
| Agenda | `Agenda.html` | hi-fi | Status strip (8 cols), timeline grid, kanban (tabbed, 4 cols) |
| Shared shell | embedded in both HTMLs | hi-fi | Sidebar (10 nav items + dividers), topbar with brand chip, gradient underline |

## Screens referenced but NOT designed

These appear as **labels/icons only** in the sidebar — the pages themselves
were never mocked:

| Route | Sidebar label | Status |
|---|---|---|
| `/clientes` | Clientes | not mocked |
| `/profissionais` | Profissionais | not mocked |
| `/servicos` | Serviços | not mocked |
| `/pacotes` | Pacotes | not mocked |
| `/produtos` | Produtos | not mocked |
| `/financeiro` | Financeiro | not mocked |
| `/atendente-ia` | Atendente IA | not mocked — *user asked for this in chat1, assistant did not actually produce the file despite a `write_file` tool call appearing in the transcript* |
| `/prontuarios` | Prontuários | not mocked |
| `/configuracoes` | Configurações | not mocked |

## What the shared shell gives you for free

Even for unmocked screens, the design system specifies enough to do a consistent
re-skin:

- **Typography scale** (README §Tipografia) — H1 40/800/-0.035em, H2 22, H3 18,
  body 13.5–14.5, eyebrow 11/700/0.26em UPPERCASE, KPI numerals 28–32/800
  tabular-nums.
- **Color tokens** (README §Cores) — light/dark neutrals, violet 50–700, status
  palette (sky, emerald, amber, violet, rose) with bg-50 tints.
- **Radii** — chips 9–11px, primary buttons 12px, cards 20–22px, pills 99px.
- **Elevation** — no borders; use `0 1px 2px + 0 8px 24px -12px` and hover lift
  with violet-tinted shadow.
- **Transitions** — 200ms `cubic-bezier(0.2, 0, 0, 1)` default, 160–180ms for
  micro interactions.
- **Casing rule** — **sentence case everywhere** in Portuguese ("abril de
  2026", "Mês atual", "Novo agendamento"). Only eyebrows are UPPERCASE.

## Implications for prioritization

1. **Safe to ship against tokens alone** (low design risk, visual cleanup):
   Clientes, Profissionais, Serviços, Pacotes, Produtos, Prontuários,
   Configurações. These are mostly list/form surfaces — re-skin with the shell
   treatment + token values. No net-new layout decisions needed.

2. **Needs a design pass before implementation** (ambiguous without a mock):
   Atendente IA, Financeiro, Comissões. These have non-trivial data
   visualizations / workflows where inferring layout from tokens will produce
   inconsistent results. Worth asking for targeted mocks before touching.

3. **Mocked but implementation gap exists** (current work item):
   Dashboard (close), Agenda (larger delta — see `agenda-refactor-plan.md`).

## Gotchas from the chat transcripts

- **Atendente IA was requested but not delivered.** Chat1 ends with the user
  asking "Agora melhore a pagina de 'Atendente IA' também!" — the assistant
  called `write_file` in the transcript but no file appears in the bundle. Do
  not assume a mock exists.
- **`design_handoff_receps_admin/` is stale.** The canonical `Dashboard.html`
  and `Agenda.html` at `project/` root contain later iterations (sticky header,
  "Estabelecimento" chip, gradient underline). Diffs exist vs. the
  `design_handoff_receps_admin/` copies — prefer the top-level files.
- **Dashboard H1 size conflict.** README says H1 = 40px/800. The canonical
  `Dashboard.html` actually uses `font-size: 32px` in its page-title block. The
  current app uses 40px, matching the README. Treat the README as authoritative
  unless user says otherwise.
