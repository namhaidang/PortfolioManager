Run a multi-round “spec debate” to polish a spec + concrete implementation plan:

- 3 competitor models iterate in parallel (Round 1 + Round 2)
- a GPT-5.2 arbitrator/integrator produces a single integrated spec
- the 3 competitors then vote to approve (or not)
- repeat cycles until unanimous approval (or until you decide to stop)

Use this when:
- You already have a draft spec file (or small set of docs).
- You want the spec to become **clean, concise, elegant**, **watertight**, and **grounded in real repo conventions**, before implementing.

Constraints:
- Run **no more than 3 sub-agents in parallel** at a time (competitors run in parallel; arbitrator runs after; approval votes run in parallel).
- Sub-agents are spec reviewers/polishers: **no product code changes**. They may read the repo, but only write to the specified output directories.

Models (this command assumes these model ids exist in your `agent` CLI):
- `gpt-5.2`
- `opus-4.6-thinking`
- `gemini-3.1-pro`

Read-first guidance (recommended):
- `.cursor/commands/jared_principles.md`
- `.cursor/commands/jared_scan.md`

---

## Output directory layout (required)

All artifacts are written under one run directory so Round 2 can reliably find Round 1 outputs.

Recommended:
- `tmp/spec-debate/<slug>/<timestamp>/`
  - `packet.round1.txt`
  - `packet.round2.txt`
  - `packet.integrate.txt`
  - `packet.vote.txt`
  - `chat_ids.txt`
  - `round-1/<model>/SPEC.md`
  - `round-1/<model>/NOTES.md`
  - `round-2/<model>/SPEC.md`
  - `round-2/<model>/NOTES.md`
  - `integrated/SPEC.md` (written by arbitrator)
  - `integrated/NOTES.md` (written by arbitrator)
  - `vote/<model>/VOTE.md` (written by competitors)
  - `synthesis/` (optional, written by the orchestrator)

Notes format requirement:
- Prioritized list of changes/insights, each with:
  - Severity (10–0)
  - What changed (1–2 bullets)
  - Why (1–3 bullets)

---

## Packet template (Round 1)

Round 1 asks each model to:
- Read the current spec draft.
- Read only the *minimum* adjacent repo files needed to align with conventions (e.g. `apps/ai-agent-server`, `apps/ai-bundle-server` patterns).
- Produce an improved spec that is tighter and more implementable while staying intentionally non-over-specific.

Packet (fill in the <> fields):

- Proposal title: <...>
- Goal (1 sentence): <...>
- Primary spec file(s) to improve (paths): <...>
- “Must match” repo conventions (paths): <...>
- Constraints (bullets): <...> (no code changes, safety invariants, perf, etc.)
- What “great” looks like (ordered bullets): <...> (clarity, safety, performance, elegance)
- Known decisions already made (bullets): <...>
- Open questions (bullets): <...>
- Output directory for THIS model: <...> (must be a model-specific folder)

Round 1 request (append verbatim):
- You are a spec polisher. Do NOT modify product code. You may read repo files to match conventions.
- Your job: produce a revised spec + concrete implementation plan section inside the spec.
- Keep the spec intentionally non-over-specific: lock invariants/contracts; avoid micro details.
- Ensure the design is: clean, concise, elegant, correct, complete, watertight, and performant.
- Write exactly TWO files to the Output directory:
  1) SPEC.md: your revised spec (complete document)
  2) NOTES.md: prioritized change log + rationale (severity 10–0)
- NOTES.md must start with:
  - Verdict: accept-draft | accept-with-edits | rewrite
  - Confidence (0–100) to implement the spec cleanly + why (1 sentence)
  - Top 3 open questions to resolve before implementation

---

## Packet template (Round 2)

Round 2 asks each model to:
- Read Round 1 artifacts from *all* models.
- Decide whether to refine further or to adopt another model’s proposal.
- Output a new SPEC.md + NOTES.md (can be identical if already optimal, but still must be written).

Packet (fill in the <> fields):

- Proposal title: <...>
- Inputs to read:
  - Current baseline spec file(s): <...>
  - Round 1 outputs root directory: <...> (contains round-1/<model>/...)
- What to optimize for (ordered): <...>
- Output directory for THIS model (round-2): <...>

Round 2 request (append verbatim):
- You are a spec polisher in Round 2.
- Read the baseline spec and ALL Round 1 artifacts from all models.
- Then do ONE of:
  - Refine your own proposal further, OR
  - Adopt another model’s proposal (best), optionally with small improvements.
- Produce the best overall spec + plan you can.
- Write exactly TWO files to the Output directory:
  1) SPEC.md
  2) NOTES.md (severity 10–0, plus “what I adopted from others” bullets)

---

## Packet template (Integrate)

After Round 2 completes, the arbitrator reads ALL Round 2 artifacts and produces a single best integrated spec + plan.

Packet (fill in the <> fields):

- Proposal title: <...>
- Inputs to read:
  - Baseline spec file(s): <...>
  - Round 2 outputs root directory: <...>
- Integration constraints (bullets): <...> (keep non-over-specified, lock invariants, etc.)
- Output directory (integrated): <...>

Integrate request (append verbatim):
- You are the arbitrator/integrator. Do NOT modify product code.
- Read baseline spec and ALL Round 2 artifacts from all models.
- Produce ONE integrated spec that is the best overall (clean, concise, elegant, watertight, performant, implementable).
- Resolve conflicts explicitly. If you must keep an open question, phrase it crisply and minimally.
- Write exactly TWO files to the Output directory:
  1) SPEC.md (the integrated spec, complete)
  2) NOTES.md (severity 10–0; what you chose, what you rejected, and why)

---

## Packet template (Vote / approve)

After integration, competitors review the integrated spec and vote.

Packet (fill in the <> fields):

- Proposal title: <...>
- Integrated spec to review (path): <...>
- Output directory for THIS model: <...>

Vote request (append verbatim):
- You are a strict spec reviewer voting on the integrated spec.
- You do NOT implement and you do NOT modify product code.
- Output MUST be exactly one file: VOTE.md with:
  - Vote: approve | approve-with-nits | changes-required
  - Confidence (0–100) + 1 sentence why
  - Top issues (<= 10), ordered, each with severity 10–0 and a fix suggestion (no code)
  - If changes-required: the minimum set of changes to reach approve (<= 7 bullets)

Unanimous completion rule:
- The debate is “done” when all 3 competitor votes are `approve` or `approve-with-nits`.
- If any vote is `changes-required`, start a new cycle using the integrated spec as the new baseline.

---

## One-terminal runner (Cycle 1: Round 1 → Round 2 → Integrate → Vote)

This runner uses persistent chat sessions (`agent create-chat` + `--resume <chatId>`) so each model keeps continuity across rounds. Artifacts on disk remain the source of truth and the cross-model handoff mechanism.

```bash
set -euo pipefail

# ---- Customize these ----
slug="ai-gitcode-server"
title="AI GitCode Server spec polish"

# Spec(s) to improve
specs=(
  "apps/frontend/specs/AI_GITCODE_SERVER_SPEC.md"
)

# Read-first guidance for all models
guidance=(
  ".cursor/commands/jared_principles.md"
  ".cursor/commands/jared_scan.md"
)

# Conventions to match (read-only references)
conventions=(
  "apps/ai-agent-server/src/server.ts"
  "apps/ai-agent-server/src/config.ts"
  "apps/ai-agent-server/src/auth.ts"
  "apps/ai-agent-server/Containerfile"
  "apps/ai-bundle-server/src/server.ts"
  "apps/ai-bundle-server/src/config.ts"
  "apps/ai-bundle-server/src/auth.ts"
  "apps/ai-bundle-server/Containerfile"
)

# ---- Run directory ----
ts="$(date +%Y%m%d_%H%M%S)"
outdir="tmp/spec-debate/$slug/$ts"
mkdir -p "$outdir"

echo "Spec debate run dir: $outdir"

# Snapshot baseline inputs (optional, recommended)
mkdir -p "$outdir/baseline"
for f in "${specs[@]}" "${guidance[@]}"; do
  cp "$f" "$outdir/baseline/$(basename "$f")"
done

# ---- Create persistent chats (one per competitor model + one arbitrator) ----
cid_gpt="$(agent create-chat | tr -d '\r\n')"
cid_opus="$(agent create-chat | tr -d '\r\n')"
cid_gem="$(agent create-chat | tr -d '\r\n')"
cid_arb="$(agent create-chat | tr -d '\r\n')"

cat <<EOF > "$outdir/chat_ids.txt"
gpt-5.2=$cid_gpt
opus-4.6=$cid_opus
gemini-3.1-pro=$cid_gem
arbitrator.gpt-5.2=$cid_arb
EOF

# ---- Build Round 1 packet ----
packet1="$outdir/packet.round1.txt"
cat <<EOF > "$packet1"
- Proposal title: $title
- Goal (1 sentence): Polish the spec + add a concrete implementation plan while keeping it intentionally non-over-specified; make it watertight and performant.
- Primary spec file(s) to improve (paths): ${specs[*]}
- Read-first guidance (paths): ${guidance[*]}
- “Must match” repo conventions (paths): ${conventions[*]}
- Constraints (bullets):
  - No product code changes.
  - Only write SPEC.md and NOTES.md to the provided output directory.
  - Keep design safe: read-only tools, strict sandboxing, bounded outputs, timeouts, pagination.
- What “great” looks like (ordered bullets):
  - Clean + concise invariants
  - Correct and complete tool surface
  - Strong safety model (esp. git.run + path handling)
  - Practical implementation plan aligned to existing services
- Known decisions already made (bullets): Use CloudSim JWT auth; global repo whitelist in v0; PAT over HTTPS for remote git in v0; deny symlinks by default; fs.search uses ripgrep internally; git.run uses argv list with aggressive sanitization + read-only allowlist.
- Open questions (bullets): Repo registry storage seam for future ACL; workspace materialization; pagination cursor shape; audit/observability strategy.

Round 1 request (append verbatim):
- You are a spec polisher. Do NOT modify product code. You may read repo files to match conventions.
- Your job: produce a revised spec + concrete implementation plan section inside the spec.
- Keep the spec intentionally non-over-specific: lock invariants/contracts; avoid micro details.
- Ensure the design is: clean, concise, elegant, correct, complete, watertight, and performant.
- Write exactly TWO files to the Output directory:
  1) SPEC.md: your revised spec (complete document)
  2) NOTES.md: prioritized change log + rationale (severity 10–0)
- NOTES.md must start with:
  - Verdict: accept-draft | accept-with-edits | rewrite
  - Confidence (0–100) to implement the spec cleanly + why (1 sentence)
  - Top 3 open questions to resolve before implementation
EOF

# ---- Round 1 (parallel) ----
mkdir -p "$outdir/round-1/gpt-5.2" "$outdir/round-1/opus-4.6" "$outdir/round-1/gemini-3.1-pro"

( agent --print --output-format text --model gpt-5.2 --resume "$cid_gpt" <<EOF > "$outdir/round-1/gpt-5.2/agent.txt" 2>&1
$(cat "$packet1")
- Output directory for THIS model: $outdir/round-1/gpt-5.2
EOF
) &

( agent --print --output-format text --model opus-4.6 --resume "$cid_opus" <<EOF > "$outdir/round-1/opus-4.6/agent.txt" 2>&1
$(cat "$packet1")
- Output directory for THIS model: $outdir/round-1/opus-4.6
EOF
) &

( agent --print --output-format text --model gemini-3.1-pro --resume "$cid_gem" <<EOF > "$outdir/round-1/gemini-3.1-pro/agent.txt" 2>&1
$(cat "$packet1")
- Output directory for THIS model: $outdir/round-1/gemini-3.1-pro
EOF
) &

wait
echo "Round 1 complete."

for d in "$outdir/round-1/"*; do
  test -s "$d/SPEC.md" && test -s "$d/NOTES.md" || { echo "Missing SPEC.md or NOTES.md in $d"; exit 1; }
done

# ---- Build Round 2 packet ----
packet2="$outdir/packet.round2.txt"
cat <<EOF > "$packet2"
- Proposal title: $title
- Inputs to read:
  - Current baseline spec file(s): ${specs[*]}
  - Round 1 outputs root directory: $outdir/round-1
- What to optimize for (ordered):
  - Adopt best ideas across models into one elegant, implementable spec
  - Reduce ambiguity without over-specifying
  - Tighten safety model for git.run + path sandboxing
- Output directory for THIS model: <filled per model>

Round 2 request (append verbatim):
- You are a spec polisher in Round 2.
- Read the baseline spec and ALL Round 1 artifacts from all models.
- Then do ONE of:
  - Refine your own proposal further, OR
  - Adopt another model’s proposal (best), optionally with small improvements.
- Produce the best overall spec + plan you can.
- Write exactly TWO files to the Output directory:
  1) SPEC.md
  2) NOTES.md (severity 10–0, plus “what I adopted from others” bullets)
EOF

# ---- Round 2 (parallel) ----
mkdir -p "$outdir/round-2/gpt-5.2" "$outdir/round-2/opus-4.6" "$outdir/round-2/gemini-3.1-pro"

( agent --print --output-format text --model gpt-5.2 --resume "$cid_gpt" <<EOF > "$outdir/round-2/gpt-5.2/agent.txt" 2>&1
$(cat "$packet2" | sed "s|<filled per model>|$outdir/round-2/gpt-5.2|")
EOF
) &

( agent --print --output-format text --model opus-4.6 --resume "$cid_opus" <<EOF > "$outdir/round-2/opus-4.6/agent.txt" 2>&1
$(cat "$packet2" | sed "s|<filled per model>|$outdir/round-2/opus-4.6|")
EOF
) &

( agent --print --output-format text --model gemini-3.1-pro --resume "$cid_gem" <<EOF > "$outdir/round-2/gemini-3.1-pro/agent.txt" 2>&1
$(cat "$packet2" | sed "s|<filled per model>|$outdir/round-2/gemini-3.1-pro|")
EOF
) &

wait
echo "Round 2 complete."

for d in "$outdir/round-2/"*; do
  test -s "$d/SPEC.md" && test -s "$d/NOTES.md" || { echo "Missing SPEC.md or NOTES.md in $d"; exit 1; }
done

# ---- Integrate (arbitrator; single) ----
mkdir -p "$outdir/integrated"
packet_int="$outdir/packet.integrate.txt"
cat <<EOF > "$packet_int"
- Proposal title: $title
- Inputs to read:
  - Baseline spec file(s): ${specs[*]}
  - Round 2 outputs root directory: $outdir/round-2
- Integration constraints (bullets):
  - Keep intentionally non-over-specified (lock invariants; avoid micro details).
  - Make git.run safety + path sandboxing watertight but still usable.
  - Ensure implementation plan matches ai-agent-server / ai-bundle-server conventions.
- Output directory (integrated): $outdir/integrated

Integrate request (append verbatim):
- You are the arbitrator/integrator. Do NOT modify product code.
- Read baseline spec and ALL Round 2 artifacts from all models.
- Produce ONE integrated spec that is the best overall (clean, concise, elegant, watertight, performant, implementable).
- Resolve conflicts explicitly. If you must keep an open question, phrase it crisply and minimally.
- Write exactly TWO files to the Output directory:
  1) SPEC.md (the integrated spec, complete)
  2) NOTES.md (severity 10–0; what you chose, what you rejected, and why)
EOF

agent --print --output-format text --model gpt-5.2 --resume "$cid_arb" < "$packet_int" > "$outdir/integrated/agent.txt" 2>&1
echo "Integration complete."

test -s "$outdir/integrated/SPEC.md" && test -s "$outdir/integrated/NOTES.md" || { echo "Missing integrated SPEC.md or NOTES.md"; exit 1; }

# ---- Vote (parallel; 3 competitors) ----
mkdir -p "$outdir/vote/gpt-5.2" "$outdir/vote/opus-4.6" "$outdir/vote/gemini-3.1-pro"
packet_vote="$outdir/packet.vote.txt"
cat <<EOF > "$packet_vote"
- Proposal title: $title
- Integrated spec to review (path): $outdir/integrated/SPEC.md
- Output directory for THIS model: <filled per model>

Vote request (append verbatim):
- You are a strict spec reviewer voting on the integrated spec.
- You do NOT implement and you do NOT modify product code.
- Output MUST be exactly one file: VOTE.md with:
  - Vote: approve | approve-with-nits | changes-required
  - Confidence (0–100) + 1 sentence why
  - Top issues (<= 10), ordered, each with severity 10–0 and a fix suggestion (no code)
  - If changes-required: the minimum set of changes to reach approve (<= 7 bullets)
EOF

( agent --print --output-format text --model gpt-5.2 --resume "$cid_gpt" <<EOF > "$outdir/vote/gpt-5.2/agent.txt" 2>&1
$(cat "$packet_vote" | sed "s|<filled per model>|$outdir/vote/gpt-5.2|")
EOF
) &
( agent --print --output-format text --model opus-4.6 --resume "$cid_opus" <<EOF > "$outdir/vote/opus-4.6/agent.txt" 2>&1
$(cat "$packet_vote" | sed "s|<filled per model>|$outdir/vote/opus-4.6|")
EOF
) &
( agent --print --output-format text --model gemini-3.1-pro --resume "$cid_gem" <<EOF > "$outdir/vote/gemini-3.1-pro/agent.txt" 2>&1
$(cat "$packet_vote" | sed "s|<filled per model>|$outdir/vote/gemini-3.1-pro|")
EOF
) &
wait
echo "Vote complete."

for d in "$outdir/vote/"*; do
  test -s "$d/VOTE.md" || { echo "Missing VOTE.md in $d"; exit 1; }
done

echo "All outputs written under: $outdir"
echo "If any vote is changes-required: start a new cycle using $outdir/integrated/SPEC.md as the new baseline spec."
```

---

## Orchestrator synthesis checklist (after Vote)

After Vote, in the main chat (or as a separate “fold-in” step), do:
- If unanimous (`approve` or `approve-with-nits`): fold `integrated/SPEC.md` into the canonical spec file and stop.
- If not unanimous: start a new cycle using the integrated spec as the new baseline, and explicitly track what the blockers were (from VOTE.md).

