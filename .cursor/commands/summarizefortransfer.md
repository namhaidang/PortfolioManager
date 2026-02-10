I want to create a compact, high‑quality snapshot of this entire conversation so far, to continue the work in a new thread without losing important context.

Please:
1. Carefully read the full prior conversation.
2. Ignore small tactical back‑and‑forth unless it affects decisions, design, or constraints.
3. Produce a **dense, structured summary** that captures:
   - What we’re doing now
   - How we got here
   - Why the plan is shaped the way it is
   - What’s left to decide or implement

Output a single markdown document with **only** these sections, in this order:

## 1. Current Objective
- **Goal**: (one or two sentences on the main goal)
- **Scope**: (what is in scope vs clearly out of scope right now)

## 2. Background & Context
- **History**: (chronological but concise narrative of how we got here)
- **Key prior attempts / approaches**: (what we tried, what worked, what didn’t)
- **External constraints**: (tech, performance, process, org, or tooling constraints that actually matter)

## 3. Design Rationale & Inputs
- **Core design decisions**: (bullet list of the big decisions we’ve made)
- **Rationale**: (why each decision was made; reference tradeoffs only where they influenced the choice)
- **Important inputs**: (user preferences, architectural patterns, existing systems, key data models, etc. that shaped the plan)

## 4. Current Plan / Strategy
- **High‑level plan**: (3–8 bullets, in order, describing the steps we intend to take from here)
- **Implementation notes**: (only details that are likely to matter in a new thread: interfaces, invariants, key flows)
- **Dependencies & sequencing**: (what must happen before what)

## 5. Open Questions & Risks
- **Unresolved questions**: (what we still haven’t decided or clarified)
- **Known risks / uncertainties**: (things that could change the plan, or are fragile assumptions)

## 6. Working Agreements & Preferences
- **Style / UX / code preferences**: (any preferences or conventions that have come up in this thread)
- **Process agreements**: (how we’re working: tools to use/avoid, testing practices, etc.)

## 7. Ready‑To‑Use Handoff Summary
Provide a final short section (max ~8 sentences) that I can paste directly into a brand‑new conversation to “reboot” the work. It should:
- Restate the **current objective**
- Summarize the **core design direction**
- Capture the **most important constraints**
- List the **next 3–5 concrete steps** we’re about to take

Meta‑constraints for your answer:
- Be **concise but information‑dense**; prefer fewer, more meaningful sentences.
- Do **not** include raw chat logs or long code blocks; describe code at the level needed to continue work.
- Don’t invent details; if something is unclear, mark it explicitly as an assumption or open question.
