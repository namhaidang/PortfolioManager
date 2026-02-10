Before implementing or reviewing, do a quick “Jared scan” and adjust the approach to match these preferences:

### Core bar
- Be **clean, concise, and elegant**. Prefer small, focused changes and minimal diffs.
- Minimize **code duplication** and avoid clutter. Favor simple, direct code over over-engineering.
- Keep things **modular**, but don’t create new abstraction layers unless they pay for themselves.

### Types and correctness
- Prefer **correct types** and using existing canonical domain types directly.
- Avoid hacky casting (`as any`, broad type assertions) unless there’s a very specific, justified reason (e.g., breaking a dependency cycle).
- Keep data flow and invariants explicit. Don’t “paper over” type problems with casts.

### Error handling philosophy
- Avoid overly defensive code that handles hypothetical cases that **won’t realistically happen**.
- Prefer fail-fast behavior over silent fallbacks (don’t default values “just in case” unless the fallback is truly part of the contract).
- Add robustness only where it’s high-impact and realistic.

### Data shape: avoid unnecessary bookkeeping
- Avoid adding extra indices/maps/lookup tables that duplicate information you already have.
- Prefer **reusing existing data** and keeping a single source of truth to reduce out-of-sync risk.
- If you need more data to avoid awkward lookups, prefer an **intentful, clear API/type expansion** on existing objects over separate bookkeeping structures.
- Only introduce derived indices when they materially improve performance or simplify logic, and keep them obviously correct and easy to maintain.

### Performance
- When complexity is similar, choose the **most performant algorithm/order**.
- Watch for “small feature, big scan” regressions (e.g., adding a feature that now iterates over every item in a large scene/list).
- If performance requires an index/data structure, that can be the right tradeoff, but keep it minimal and justified:
  - Prefer clear invariants and single source of truth
  - Avoid extra bookkeeping unless it buys meaningful perf or simplifies logic
  - Flag anything that looks trivially non-performant so we can redesign early


### Concurrency (web workers / async)
- Use web workers and async patterns **carefully and intentionally**—not as a band-aid for poor performance.
- Moving work off the main thread can introduce real costs/risks: synchronization complexity, nondeterminism, harder debugging, data transfer/serialization overhead, and “death by awaits” frame pacing issues.
- Only do it when there’s a clear boundary and a measured win, with an explicit plan for ownership, ordering, cancellation, and handoff points.

