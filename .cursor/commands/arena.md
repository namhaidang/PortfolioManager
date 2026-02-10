Run a multi-model “optimization arena” where several coding agents iteratively improve competing implementations against a shared, closed-loop evaluation (KPIs), then submit standardized results for synthesis.

Use this when you already have (or can define) an automated evaluation harness (command(s) you can run) and you want model-vs-model iteration with clear guardrails and comparable outputs.

Key learnings baked in (Beads + orchestration patterns):
- Keep **persistent, structured artifacts** (scoreboard + submission bundles) so context doesn’t evaporate.
- Prefer **routines + handoffs**: explicit roles, budgets, gates, and a final “land the plane” handoff prompt.
- Minimize cross-talk: each competitor works in an isolated workspace (worktree).

What you must provide (in the arena packet below):
- Objective: what “better” means (the goal)
- Scoring: which KPI(s) matter and how to compare runs
- Scope: what is allowed vs off-limits to change (be explicit)
- Repro harness: exact commands to run and how to read KPIs

Constraints:
- Keep concurrency limited: run **no more than 3 competitors in parallel**.
- Competitors ARE implementers: they can change code, but **only within the allowed scope** you specify.
- Competitors may commit locally on their own worktree branches, but **do not push** unless you explicitly decide to later.

### 0) Set up isolation (required)
To avoid merge conflicts and “shared state” issues, run each competitor in its own git worktree. If you can’t, stop and let me know so I can resolve.

Recommended (example — adapt names/paths):
- Create worktrees for each competitor/model.
- Each competitor only edits inside its worktree.
- After submissions, you can cherry-pick or manually port the best changes back.

Concrete setup (copy/adapt):
```bash
# Choose your baseline (example uses current branch HEAD)
base_ref="$(git rev-parse --abbrev-ref HEAD)"

# Where to put worktrees (recommended: sibling folder to the repo)
wt_root="../_arena-worktrees"
mkdir -p "$wt_root"

# Create 3 branches + worktrees (names are just a convention)
git worktree add -b "arena/gpt-5.2" "$wt_root/gpt-5.2" "$base_ref"
git worktree add -b "arena/gemini-3-pro" "$wt_root/gemini-3-pro" "$base_ref"
git worktree add -b "arena/claude-4.5-opus-high" "$wt_root/claude-4.5-opus-high" "$base_ref"
```

### 1) Build a compact “arena packet” (for piping to `agent`)
Write a minimal, structured packet. Short phrases; no prose. If unknown, write `unknown` (don’t omit).

Template (paste and fill):
- Challenge title: …
- Goal (1 sentence): …
- Baseline (commit/branch): …
- Target(s): … (component, module, file(s), interface/contract)
- Allowed changes (explicit): … (files/dirs; whether helpers/tests are allowed)
- Forbidden changes (explicit): … (files/dirs; behavior; APIs; “don’t touch” constraints)
- Evaluation harness:
  - Primary command(s) to run: … (exact commands)
  - Runtime budget per eval: … (expected wall time; max acceptable)
  - Scenario matrix: … (seeds/configs/cases; include a holdout if possible)
  - KPI extraction: … (how to read/parse the KPI(s); where output appears; units)
- KPI(s) and scoring:
  - KPI #1: … (higher/lower is better; baseline value if known)
  - KPI #2: …
  - Composite score (if any): …
  - Regression guards: … (max allowed regressions, correctness constraints, etc.)
- Iteration budget (per competitor):
  - Max improvement loops: … (e.g. 3–8)
  - Max wall time: …
  - Stop condition: … (e.g. diminishing returns, or target score hit)
- Engineering gates (must pass before “best score” is accepted):
  - Lint: … (exact command)
  - Type-check/build: … (exact command)
  - Tests: … (exact command(s), if any)
- Output locations / naming:
  - Candidate implementation naming convention: … (e.g. FooController_GPT52.ts)
  - Where competitor should write notes/results: … (e.g. docs/arena/<challenge>/MODEL.md)
- Repo constraints: … (perf limits, cognitive complexity rules, “don’t run X”, etc.)
- What you want the arena to optimize for (ordered): … (e.g. stability > KPI > readability)

### 2) Competitor request (append after the arena packet in each heredoc)
Competitor request to append after the packet (paste verbatim after the packet in each heredoc):
- You are a competing implementation author. You DO implement and you DO run the evaluation harness.
- Stay within Allowed/Forbidden changes. If something blocks you, work around it inside scope (don’t expand scope silently).
- Keep diffs minimal and focused. Prefer small refactors and measurable wins.
- Maintain the existing external contract. Do not break callers.
- You MAY create local commits on your competitor branch/worktree as you iterate (recommended: commit at reasonable checkpoints, and especially when you reach a new best score). Do NOT push.
- Optimization loop (repeat until budget/stop condition):
  - Make one coherent change
  - Run required gates (lint/type-check/tests as specified)
  - Run evaluation harness and record KPI(s)
  - Keep the best-scoring version; revert worse changes
- Avoid overfitting:
  - Use the provided scenario matrix; don’t optimize a single seed only.
  - If you introduce heuristics, justify why they generalize.
- Output MUST include a “submission bundle” in the exact structure below.

Submission bundle (MUST be present, concise, no filler):
- Competitor ID: … (model + variant name)
- Summary (<= 5 bullets): … (what changed and why)
- Files changed (explicit list): …
- Branch + HEAD commit: … (e.g. arena/gpt-5.2 + <sha>)
- KPI results:
  - Baseline: … (for each KPI)
  - Best: … (for each KPI)
  - Delta: … (for each KPI)
  - Scenarios run: … (seeds/configs)
  - Commands run: … (exact)
- Engineering gates:
  - Lint: pass | fail (command)
  - Type-check/build: pass | fail (command)
  - Tests: pass | fail (command)
- Risk assessment (<= 5 bullets): … (edge cases, stability, maintainability)
- If more time (<= 5 bullets): … (next ideas that might improve further)

### 3) Run up to 3 competitors (parallel; ONE terminal; writes outputs to files)
IMPORTANT: Worktrees are required. Do not run multiple competitors against the same working tree.

Commands (parallel in ONE terminal; each competitor uses the SAME arena packet + request above):
```bash
outdir="$(mktemp -d -t arena.XXXXXX)"
packet="$outdir/packet.txt"

cat <<'EOF' > "$packet"
<PASTE ARENA PACKET HERE>

<PASTE COMPETITOR REQUEST HERE>
EOF

# Point these at your actual worktree directories
wt_gpt="../_arena-worktrees/gpt-5.2"
wt_gem="../_arena-worktrees/gemini-3-pro"
wt_cla="../_arena-worktrees/claude-4.5-opus-high"

( cd "$wt_gpt" && agent --model gpt-5.2 < "$packet" > "$outdir/gpt-5.2.txt" 2>&1 ) &
( cd "$wt_gem" && agent --model gemini-3-pro < "$packet" > "$outdir/gemini-3-pro.txt" 2>&1 ) &
( cd "$wt_cla" && agent --model claude-4.5-opus-high < "$packet" > "$outdir/claude-4.5-opus-high.txt" 2>&1 ) &

wait
echo "Arena outputs written to: $outdir"
```

### 4) Synthesize results (main chat)
Paste the full submission bundles from all competitors back into the chat.

Then synthesize into ONE report (no code) with:
- Scoreboard table (competitors × KPI deltas), sorted by the primary KPI/composite score
- Validity checks:
  - Did they follow scope?
  - Did gates pass?
  - Any suspicious overfitting (single seed, missing scenarios)?
- A summary of model relative performance, i.e. which ones were subjectively better and more detailed than others and unique insights found by certain models that weren't found by others
- Technical review highlights per competitor:
  - What seems genuinely better (bullets)
  - What’s risky or ugly (bullets)
  - What could be merged across winners (bullets)
- Recommendation:
  - Winner (or “combine A+B”)
  - Rationale (<= 5 bullets)
  - Concrete next step plan (<= 8 bullets) to integrate safely

### 5) “Land the plane” (handoff prompt for continuing later)
End with a ready-to-paste next-session prompt that includes:
- Current best competitor + exact commit/worktree state
- How to reproduce the best score (commands + scenario matrix)
- Top 3 follow-up experiments
- Any open risks/questions to resolve before merging
