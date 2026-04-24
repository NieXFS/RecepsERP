# Agenda — Diff Report (Current vs. Mock)

**Goal of this doc**: enumerate every visual delta between the current Agenda
implementation and `design-sistema/project/Agenda.html`, estimate effort,
regression risk, and whether each change is purely visual or touches state.
Nothing in here is implemented — this is a planning document for batching the
refactor.

**Scope of comparison**
- Current: [src/components/agenda/daily-calendar.tsx](../../src/components/agenda/daily-calendar.tsx) (584 lines), [src/components/agenda/agenda-operations-panel.tsx](../../src/components/agenda/agenda-operations-panel.tsx) (809 lines), [src/components/agenda/appointment-card.tsx](../../src/components/agenda/appointment-card.tsx)
- Mock: `design-sistema/project/Agenda.html` (723 lines)
- Sticky header / brand chip / topbar separators: **out of scope** — handled by shell change (Oct '26 topbar polish). See `coverage-report.md`.

---

## Legend

- **Effort**: S = <1h, M = half-day, L = multi-day
- **Risk**: low = style only, visual regression tolerable · medium = some JSX shuffle, UX testing needed · high = touches data flow, state machine, or event handlers
- **Kind**:
  - *V* — purely visual (CSS/tailwind classes only)
  - *V+S* — visual + structural JSX (no state touched)
  - *S* — state/event handler refactor

---

## Group 1 — Safe purely-visual (batch candidates)

These can be shipped as a single PR of Tailwind-only changes. Zero behavior risk.

### 1.1 Status strip — remove "Operação do dia" title block inside the card
- **Current** ([agenda-operations-panel.tsx:180-196](../../src/components/agenda/agenda-operations-panel.tsx#L180-L196)): strip card contains an H3 "Operação do dia" + subtitle + "Total no dia: N agendamento(s)" header block before the 8 pills.
- **Mock** ([Agenda.html:180-191](../../)): strip is *just* the 8 pills — no embedded header. The violet→emerald vertical accent bar on the left IS the identity marker.
- **Effort**: S · **Risk**: low · **Kind**: V
- **Note**: the "total count" meta could move into the page-title subtitle area or be dropped entirely (mock does not show it).

### 1.2 Status pill — redesign to match mock rhythm
- **Current**: each pill is a single row — dot + label + count, all on one line, with secondary count text on a second line. Background `bg-muted/50`.
- **Mock** ([Agenda.html:184-191](../../)): two-tier layout — top row is a sp-head (`dot + label`), middle is a large `sp-count` numeral (22px/800 tabular-nums), bottom is `sp-sub` meta ("1 agendamento" / "N agendamentos"). Transparent bg, just hover lift.
- **Effort**: S · **Risk**: low · **Kind**: V

### 1.3 Page-title — add live "Ana online" dot consistency
- **Current** ([daily-calendar.tsx:296-302](../../src/components/agenda/daily-calendar.tsx#L296-L302)): already has "Ana online" with pulsing emerald dot.
- **Mock**: identical pattern. **No delta** — listed here only to mark as matched.

### 1.4 Appointment card in timeline — status-tinted bg + 3px left accent
- **Current** ([appointment-card.tsx:74-86](../../src/components/agenda/appointment-card.tsx#L74-L86)): uses `APPOINTMENT_STATUS_CARD_STYLES` from `lib/appointments/status` with `bg`, `leftBorder`, `text` classes. Has rounded 10px, soft shadow, hover lift.
- **Mock** ([Agenda.html:243-264](../../)): radius 12px, status-specific tinted bg (`rgba(14,165,233,0.12)` etc.), 3px left pill accent inset (top:8 / bottom:8 / border-radius:99px — *not* a full-height border), price in top-right corner 11.5/700, time in 11/700 tabular top-left, client in 13.5/700 second row, service in 11.5 opacity .8 third row.
- **Effort**: S · **Risk**: low · **Kind**: V
- **Note**: current card renders a status *badge pill* in the top-right; mock shows *price* in top-right and no pill (status communicated only via color). If you want to keep status labels visible for accessibility, verify with user — this is a UX shift, not just visual.

### 1.5 Empty slot hover — dashed violet placeholder
- **Current** ([daily-calendar.tsx:470-492](../../src/components/agenda/daily-calendar.tsx#L470-L492)): full-row clickable with `Plus` icon that appears on hover via opacity.
- **Mock** ([Agenda.html:266-269](../../)): slots render an absolutely-positioned `.tl-empty-slot` with `border: 1.5px dashed rgba(139,92,246,0.25)` that turns solid violet on hover, visible at rest (not opacity-0).
- **Effort**: S · **Risk**: low · **Kind**: V
- **Note**: mock places empty slots at known cell positions; current has one slot per time row per pro. Pure Tailwind tweak, but verify hover target stays hit-able at 52px height.

### 1.6 Kanban card — rounded 14, violet left accent, emerald price
- **Current** (inside `OperationalAppointmentCard`, lower in `agenda-operations-panel.tsx`): to be read in detail, but likely styled per status.
- **Mock** ([Agenda.html:317-347](../../)): radius 14, bg `#FCFBFF` light / `--dark-surface-2` dark, inset ring `rgba(139,92,246,0.08)` light only, 3px violet left accent pill, name 14/700, meta "HH:MM · com {pro}" 11.5 muted, UPPERCASE status chip (10/700 tracking .05em, `bg-violet-50`), service 12 muted, price 14/800 emerald, action buttons 11.5/600 rounded 9.
- **Effort**: S · **Risk**: low · **Kind**: V

### 1.7 Kanban empty state — dashed violet panel
- **Current** ([agenda-operations-panel.tsx:336-339](../../src/components/agenda/agenda-operations-panel.tsx#L336-L339)): `border-dashed border-border/70`, generic grey text.
- **Mock** ([Agenda.html:349-350](../../)): `.kc-empty` with violet-tinted dashed border `rgba(139,92,246,0.2)`, centered muted text.
- **Effort**: S · **Risk**: low · **Kind**: V

---

## Group 2 — Visually large but low risk (style only, no JSX restructure)

Bigger CSS surface but no component restructure. Safe to batch separately from Group 1.

### 2.1 Timeline card — adopt mock shell treatment
- **Current** ([daily-calendar.tsx:379-385](../../src/components/agenda/daily-calendar.tsx#L379-L385)): grid is `h-[62vh] min-h-[520px]` scrollable both axes, rounded-[22px] bg-card, with a `sr-only` accessibility table preceding the visual grid. No "Linha do tempo do dia" heading inside the card; the title section sits outside (page-title area).
- **Mock** ([Agenda.html:196-217](../../)): timeline lives inside a `.timeline-card` container with its own header row: "● Linha do tempo do dia" (pulsing emerald dot) + inline meta (`Faixa: 07:00–20:00 · Profissionais ativos: 3 · Ocupação: 25%`) + view-toggle pills (Dia / Semana / Mês).
- **Effort**: M · **Risk**: low · **Kind**: V+S
- **Notes**:
  - Adding an internal header is additive — no existing JSX needs to move.
  - Day/Semana/Mês toggle is **not wired in current app** (only day view exists). Render the pills as visually "Dia active, other two disabled/coming soon", OR do not render the toggle until a week/month view actually exists. Confirm choice with user.
  - "Ocupação %" metric doesn't exist in current state shape — would need a derived memo over `appointmentsByProfessional` and `scheduleBounds`. Trivial, but new code.

### 2.2 Hour column width and tick marks
- **Current** ([daily-calendar.tsx:391](../../src/components/agenda/daily-calendar.tsx#L391)): `80px`.
- **Mock** ([Agenda.html:212-216](../../)): `62px`, with a 6px horizontal tick line on the right edge of each hour row.
- **Effort**: S · **Risk**: low · **Kind**: V
- **Note**: verify that 62px still fits `23:30` labels at current font — tabular-nums helps.

### 2.3 Professional column header — avatar + name, violet-tinted bg
- **Current** ([daily-calendar.tsx:399-422](../../src/components/agenda/daily-calendar.tsx#L399-L422)): rounded-14 gradient bg `from-primary/12 to-primary/4` + 2.5px left accent, name 13/700, meta 11 muted.
- **Mock** ([Agenda.html:224-228](../../)): rounded-14 bg `rgba(139,92,246,0.08)` (flat, not gradient) + **circular 30px avatar** with initial (gradient violet→violet-700) + name 13.5/700 + meta "role · N agendamento(s)".
- **Effort**: S · **Risk**: low · **Kind**: V
- **Note**: `Professional.specialty` already provides the role; `appointmentsByProfessional` already provides the count.

### 2.4 Slot stripe pattern
- **Current** ([daily-calendar.tsx:470-482](../../src/components/agenda/daily-calendar.tsx#L470-L482)): uses `border-t border-dashed border-border/60` on each slot div.
- **Mock** ([Agenda.html:231-236](../../)): `repeating-linear-gradient(to bottom, transparent 0 51px, rgba(15,23,42,0.04) 51px 52px)` on the slot container — a single background pattern instead of per-slot borders.
- **Effort**: S · **Risk**: low · **Kind**: V
- **Note**: changing to background pattern means the click targets become a single absolutely-positioned overlay (or individual invisible hit-zones) — which is structural. See 3.2.

### 2.5 Appointment card — viewport-scaled typography
- **Current** ([appointment-card.tsx:56-58](../../src/components/agenda/appointment-card.tsx#L56-L58)): has `isDense` (<40px), `isCompact` (<72px) branches that drop fields and shrink fonts.
- **Mock**: has no adaptive scaling — all cards render with the full fields. Given Receps uses variable slot intervals (`slotIntervalMinutes`), the current adaptive behavior is probably better for real data. Keep current logic; just restyle.
- **Effort**: S · **Risk**: low · **Kind**: V
- **Explicit non-change**: do not remove `isDense`/`isCompact` branches — they compensate for short appointments and are load-bearing.

---

## Group 3 — Structural refactor (the scary ones)

JSX and/or state changes. These carry real behavioral risk and should each be their own reviewable PR. Do not batch with Groups 1–2.

### 3.1 Kanban: two rows → one grid with tab filter
- **Current** ([agenda-operations-panel.tsx:233-249](../../src/components/agenda/agenda-operations-panel.tsx#L233-L249)): renders **two `<LaneGrid>` sections** — "Fluxo operacional" (SCHEDULED, CONFIRMED, WAITING, IN_PROGRESS) and "Encerramentos do dia" (COMPLETED, PAID, CANCELLED, NO_SHOW) — stacked vertically.
- **Mock** ([Agenda.html:477-496](../../)): single `.kanban-head` with tab group — **Em progresso** (default active) / **Encerramentos do dia** / **Todos** — and a single 4-column grid that swaps content based on active tab. "Todos" shows all 8 (presumably 8-col or wraps to 4-col rows).
- **Effort**: M · **Risk**: **medium** · **Kind**: V+S
- **Why medium risk**:
  - Adds client-side tab state (`useState`). Current panel is already `"use client"`, so no boundary flip.
  - No server action impact — mutations (`updateAppointmentStatusAction`, `checkoutAppointmentAction`) still fire from the same card components.
  - URL persistence: consider whether active tab should be a query param (`?kanban=encerrados`) for deep-linking. Mock does not specify. Default to non-persistent client state; confirm with user.
  - "Todos" view with 8 columns at `repeat(8, 1fr)` on desktop may feel cramped — mock does not show this layout. Verify with user how "Todos" should render (2×4 grid? horizontal scroll? 4-col with rows of 2?).

### 3.2 Timeline: per-slot click overlay → container-level background + absolute hit zones
- **Current** ([daily-calendar.tsx:470-492](../../src/components/agenda/daily-calendar.tsx#L470-L492)): each time slot is a `<div>` with its own `onClick={() => handleSlotClick(prof, slot.hour, slot.minute)}`.
- **Mock** ([Agenda.html:231-236](../../)): slot stripe is a CSS gradient on the container; clickable empty-slot cards are absolutely positioned `.tl-empty-slot` elements. The slot-click handler needs to derive hour/minute from either (a) cell-level buttons or (b) a click-through-to-container handler that uses `event.clientY - container.top` to compute time.
- **Effort**: M · **Risk**: **medium** · **Kind**: S
- **Why medium risk**:
  - Event handler semantics change. Current per-slot click has a fixed target; a computed-from-mouse-Y version can mis-fire if container padding shifts or if `scrollTop` isn't correctly subtracted.
  - Keyboard accessibility: current per-slot divs aren't individually focusable (no `tabindex`) but users can still trigger via keyboard on nearby controls. Moving to Y-computed clicks means keyboard users lose the equivalent of "open new appointment at 14:30". Mitigation: keep per-slot hit zones (invisible absolute divs at slot heights) and only change the *visual background*, not the click architecture.
  - Recommendation: do 2.4 (visual stripe pattern) **without** touching click handlers — keep invisible per-slot hit divs for keyboard + mouse parity. That drops this item to Group 2 risk-wise, at the cost of a slightly more complex DOM.

### 3.3 "AGORA" line: per-column → single line across all professionals
- **Current** ([daily-calendar.tsx:508-520](../../src/components/agenda/daily-calendar.tsx#L508-L520)): rendered **once per professional column** as a red dashed line + red dot.
- **Mock** ([Agenda.html:238-241](../../)): rendered **once across the entire timeline board**, violet dashed, with "AGORA" UPPERCASE eyebrow on the far left (in the hour column region) and a violet dot on the far right.
- **Effort**: S · **Risk**: low–medium · **Kind**: V+S
- **Why low–medium**:
  - Visual change + single DOM element move (out of per-column loop, into board container).
  - Color change red → violet is fine. Current red is semantically "time marker urgency"; mock treats it as just "live state", consistent with brand.
  - The current hour-column red time-label (`13:24` badge on the hour axis — [daily-calendar.tsx:449-456](../../src/components/agenda/daily-calendar.tsx#L449-L456)) is not in the mock. Mock has "AGORA" UPPERCASE text instead. Deciding which to keep is a UX call — dropping the time badge would lose actual-time-at-a-glance. Confirm with user.

### 3.4 Status strip — shift `Total no dia` + ocupação metric up into timeline-card header
- Dependency of 1.1 + 2.1. If strip header is removed AND timeline-card adds a header with meta, the "Total" count needs a new home.
- **Effort**: S · **Risk**: low · **Kind**: V+S
- **Note**: pure move, no state change — only mentioned to flag the coupling.

### 3.5 Day view toggle wiring (Dia / Semana / Mês)
- **Current**: only day view exists. `DailyCalendar` is named for a reason.
- **Mock** ([Agenda.html:458-462](../../)): shows an active "Dia" pill and two siblings "Semana" / "Mês".
- **Effort**: **L** · **Risk**: **high** · **Kind**: S
- **Why high risk**:
  - Adding week/month views is a net-new feature, not a refactor. Requires new server queries, new layout components, new state.
  - Recommendation: do **not** ship the toggle as visual-only "coming soon" disabled state unless you've decided the week/month feature is on the roadmap. Otherwise, omit the toggle entirely and revisit when the feature lands. Aligns with project guidance ("don't design for hypothetical future requirements").

---

## Sidebar nav-item delta

Mock sidebar lists **Ajuda** instead of **Prontuários** as the 10th nav item.
This was applied per user decision (2026-04-24): Prontuários is accessible
per-customer from the Clientes detail screen, so the dedicated sidebar item
was redundant. The `/prontuarios` route still exists and is reachable via
direct URL; only the sidebar link was swapped. Ajuda now points to the
existing `/ajuda` route (which has `[slug]` articles).

---

## Suggested batching

| Batch | Items | Aggregate effort | Aggregate risk |
|---|---|---|---|
| **A — Visual polish** | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7 | ~3–4h | low |
| **B — Shell restyle** | 2.1 (minus view toggle), 2.2, 2.3, 2.4 (visual only), 2.5 | ~4–6h | low |
| **C — "AGORA" line rework** | 3.3 | ~1–2h | low–medium |
| **D — Kanban tab refactor** | 3.1, 3.4 | ~half-day | medium |
| **E — Explicit non-goals (skip)** | 3.2 (keep click handlers as-is), 3.5 (no week/month until product says so) | — | — |

Batch A and B can ship in parallel. C can slot into either. D is its own PR. E stays out of scope until product confirms.
