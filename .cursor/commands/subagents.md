This is a concise reference for using Cursor sub-agents (via the Cursor CLI `agent` tool). It’s meant to be loaded into context; it does not “do” anything on its own.

### When to use a sub-agent
- **Token/context efficiency**: if the task requires reading a lot of context (large diffs, many related files, docs) but the desired output is compact, prefer a sub-agent to avoid bloating the main orchestrator context.
  - Example: a post-implementation review that may need to re-read many touched/adjacent files, but should return a compact grade + prioritized issues with file/symbol references.
- **Parallelizable investigation**: if token/context efficiency is true *and* the work can be split into distinct parallel threads (e.g., different areas to inspect, different questions to answer), use sub-agents to reduce wall-clock time.
  - Keep concurrency limited: **no more than 3 sub-agents in parallel**, and wait for results before continuing.

### Model selection (default)
- **Generates code / edits files**: use `claude-opus-4.5-thinking`
- **Everything else** (planning, review, analysis): use `gpt-5.2`

### How to run a sub-agent
In a terminal, run `agent` with the chosen model and pipe a compact “packet” via stdin (prefer heredoc).

Example (planning/review):
```bash
agent --model gpt-5.2 <<'EOF'
<packet goes here>
EOF
```

Example (implementation):
```bash
agent --model claude-opus-4.5-thinking <<'EOF'
<packet goes here>
EOF
```

### How to pass context (“packet”) cleanly
Be token efficient. Prefer short phrases and structure over prose. Include only what the sub-agent needs.

### Chat hygiene (heads-up)
Before launching sub-agents, write a **single concise blurb** in the main chat that says you’re using sub-agents and **why** (token/context efficiency and/or parallelizable investigation), and what you’re expecting back (e.g., review report, file shortlist, answers).