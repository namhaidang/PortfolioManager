Run a “LLM council” review of the current plan/idea using 3 parallel sub-agents (Cursor CLI `agent`), then synthesize their feedback into one prioritized recommendation list.

Use this when the chat already contains a proposed plan/idea/spec and you want a multi-model critique before implementing.

Constraints:
- Keep concurrency limited: run **no more than 3 sub-agents in parallel** (this council is exactly 3).
- Sub-agents are reviewers: they do NOT implement and should NOT output code.

### 1) Build a compact “council packet” (for piping to `agent`)
Write a minimal, structured packet. Short phrases; no prose. If unknown, write `unknown` (don’t omit). If council is reviewing some specific files that represent the plan or diffs, include a list of those files to review. 

Template (paste and fill):
- Proposal title: …
- Goal (1 sentence): …
- Current plan / approach (bullets, ordered): …
- Success criteria (bullets): …
- Non-goals (bullets): …
- Constraints (bullets): … (repo rules, perf, time, backwards-compat, cognitive complexity, “don’t run X”, etc.)
- Scope / touched areas (files/dirs, or `unknown`): …
- Key design decisions already made: … (or `unknown`)
- Key risks you already suspect (<= 5): … (or `unknown`)
- Open questions (<= 5): … (or `unknown`)
- What you want the council to focus on (bullets): … (correctness, missing steps, edge cases, alternatives, rollout plan, test plan, etc.)

### 2) Run the 3 council sub-agents in parallel
Use the terminal to run the following 3 commands in parallel, each with the SAME packet plus the request below (prefer heredoc). Ensure that each subagent does not make any code or file changes.

Council request to append after the packet (paste verbatim after the packet in each heredoc):
- You are a strict plan reviewer. You do NOT implement. Do NOT output code.
- Review the plan for: correctness, completeness, risks, edge cases, maintainability, and hidden assumptions.
- Suggest concrete improvements and identify missing steps.
- Call out tradeoffs explicitly; propose 1 alternative approach if it’s meaningfully better.
- Output MUST include the structured summary below (for easy cross-model comparison), plus an open-ended nuance section (for depth).
- Output format:
  - Structured summary (MUST be present, keep it concise):
    - Verdict: go | go-with-changes | no-go
    - Confidence (0–100) + 1 sentence why
    - Top issues (most critical to least), up to 10. Each issue:
      - Title (short)
      - Severity (10–0)
      - What’s wrong (2–4 bullets, concrete)
      - Suggested fix (2–5 bullets, no code)
    - “Looks good” notes (<= 5 bullets)
    - Questions for the proposer (<= 5)
    - Optional: Alternative plan (<= 8 bullets) (only if you think it’s better)
  - Nuance & tradeoffs (FREEFORM, optional but encouraged):
    - Discuss key assumptions, important tradeoffs, second-order effects, and any “gotchas”.
    - If you strongly disagree with the plan, explain why in a short argument.
    - If there are multiple viable solutions, compare them and say what would make you choose one.

Commands (parallel in ONE terminal; writes outputs to files):
```bash
outdir="$(mktemp -d -t council.XXXXXX)"
packet="$outdir/packet.txt"

cat <<'EOF' > "$packet"
<PASTE COUNCIL PACKET HERE>

<PASTE COUNCIL REQUEST HERE>
EOF

agent --model gpt-5.2 < "$packet" > "$outdir/gpt-5.2.txt" 2>&1 &
agent --model gemini-3-pro < "$packet" > "$outdir/gemini-3-pro.txt" 2>&1 &
agent --model claude-4.5-opus-high < "$packet" > "$outdir/claude-4.5-opus-high.txt" 2>&1 &

wait
echo "Council outputs written to: $outdir"
```

### 3) Synthesize (main chat)
Once done,read and paste the full outputs from all 3 reviewers back into the chat so we have access to the individual feedback.

Then, synthesize into ONE output (no code) with:
- Areas of strong consensus (bullets)
- Key disagreements + tradeoffs (bullets)
- A summary of model relative performance, i.e. give each model a 0-100 score and relative ranking 1st, 2nd, 3rd, etc. based on how good of a reviewer it is overall determined by the quality of the review (i.e. insightfulness, thoroughness, etc.)
- Consolidated recommendations (prioritized), each with:
  - Impact (10–0)
  - Effort (S/M/L)
  - Recommendation (1 sentence)
  - Rationale (1–2 bullets)
- A revised plan (<= 10 steps, short) incorporating the best feedback

Do NOT implement anything yet. Wait for user approval on the revised plan.
