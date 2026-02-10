Okay, let's do a pre-flight check before implementing this, using a lightweight sub-agent pass via the Cursor CLI `agent` tool.

Be very token efficient: the goal is to get higher confidence with minimal context, not to re-read the entire repo.

### 1) Build a compact but comprehensive “spec summary” (for piping to `agent`)
Write a minimal, structured summary you can paste to stdin. It should be **tight** but **complete**: any missing detail is likely to be missed in implementation. If you don’t know something, write `unknown` (don’t omit it).

Use this exact template (short phrases, no prose):
- Goal: …
- Success criteria (bullets): …
- Non-goals (bullets): …
- Current status: …
- Constraints (bullets): … (repo rules, style constraints, “don’t run X”, perf, cognitive complexity limits, etc.)
- Scope / directly affected areas: … (files/dirs, or `unknown`)
- Key design decisions already made: … (or `unknown`)
- Edge cases to handle: … (or `unknown`)
- Open questions/risks (<= 5 bullets): …

### 2) Run the sub-agent (`agent`) to do the full pre-flight check
Use the terminal to run `agent --model gpt-5.2` and pipe in ONLY the summary above plus the request below. Prefer a heredoc. Keep the request short and explicit about outputs.

Request to sub-agent (paste verbatim after the summary):
- You are a pre-flight sub-agent. You do NOT implement.
- Do a pre-flight check before implementation:
  - Read directly affected files as well as key related or adjacent files so you have a full view, but be judicious and token efficient.
  - Think/reflect/research within the repo as needed.
  - Provide an initial confidence score (0–100) on whether the task can be implemented cleanly, concisely, and elegantly.
  - If confidence is < 97%, ask questions and/or propose the minimum additional reading needed to reach >= 97%.
- Output MUST be exactly:
  - Confidence (0–100) + 1 sentence why
  - Files read (list)
  - Minimal next file-read shortlist (<= 10 items) with 1-line rationale each
  - Key risks/unknowns (ordered, <= 8)
  - Questions to ask the user (only if necessary, <= 5)
  - Proposed plan (<= 8 steps, short)

### 3) Act on the sub-agent result (standalone)
Cleanly output the sub-agent's output for me to review, do not implement yet or take action until I have given feedback or approved.

