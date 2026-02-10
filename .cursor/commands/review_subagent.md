Okay, I want the review to be performed by a sub-agent via the Cursor CLI `agent` tool, returning a compact, high-signal report.

### 1) Build a compact but comprehensive “review spec packet” (for piping to `agent`)
Write a minimal, structured summary you can paste to stdin. It should be **tight** but **complete**: missing detail will likely be missed in review. If you don’t know something, write `unknown` (don’t omit it). Do not include code.

Use this exact template (short phrases, no prose):
- What changed (high-level): …
- Files touched: …
- Goal / intended behavior: …
- Success criteria (bullets): …
- Non-goals (bullets): …
- Known constraints (bullets): … (repo rules, “don’t run X”, perf, cognitive complexity limits, etc.)
- Known tradeoffs: … (or `unknown`)
- Edge cases to handle: … (or `unknown`)
- Areas of uncertainty / where review should focus: … (or `unknown`)

### 2) Run the sub-agent (`agent`) to do the full final review
Use the terminal to run `agent --model gpt-5.2` and pipe in ONLY the packet above plus the request below (prefer heredoc).

Request to sub-agent (paste verbatim after the packet):
- You are a strict code reviewer. Do NOT implement. Do NOT rewrite files.
- Do NOT output code.
- Do an ultra detailed review: look for bugs or things incomplete/incorrect that need polishing.
- Evaluate: correctness, edge cases, maintainability, consistency with repo patterns, and “diff minimalism”.
- If you suggest a fix, include a precise location pointer to save time:
  - File path is required
  - Also include the closest function/class/component name if applicable
  - If you can, include an approximate line range
- Don’t be overly brief: include enough detail per issue to enable quick triage.
- Output MUST be exactly:
  - Overall grade (0–100)
  - Top issues list (most critical to least). Include up to 10 issues (fewer only if you truly can’t find more), each as:
    - Title (short)
    - Severity score (10–0)
    - Location: <file> :: <symbol> :: <approx lines or `unknown`>
    - What’s wrong (2–4 bullets, concrete)
    - Why it matters (1–3 sentences)
    - Suggested fix outline (2–5 bullets, no code)
  - “Looks good” notes (<= 5 bullets)

### 3) Act on the sub-agent review (standalone)
Paste the sub-agent output, then STOP. Do NOT implement any fixes automatically.

Wait for user feedback on which issues (if any) to address, and only then proceed.

