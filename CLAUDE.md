# Project guidelines

Conventions for working on **Dutch-Meshcore-Toolbox** with an AI agent. These are
the org-wide Dutch-MeshCore conventions, shared with the other DMC repos so that
an agent session behaves the same way here as it does there. Anything specific to
this repo's stack (Vite, React, TypeScript, Vitest) lives in the code and its
tests, not here.

## Git commits

- Do **not** add a `Co-Authored-By:` trailer (or any AI/assistant attribution) to
  commit messages or PR descriptions. Commit messages contain only the
  human-authored content (subject + body), nothing else appended.
- Squash a run of commits that all address the same change into one before the
  work leaves your machine. Incremental commits (`wip`, `fix typo`, `address
  review`) that build up a single logical change should be collapsed, so history
  has one commit per coherent unit of work rather than a long string for one fix.
  This applies only to commits **not yet pushed**; once commits are on a shared or
  pushed branch, leave them alone (squashing rewrites public history).
- **Never `git push`.** Work stays local unless the developer explicitly asks.
  Do not commit or merge on your own initiative either; wait to be told.
- **Finish a feature branch with rebase + fast-forward, no merge commits.** When
  the work is done and green, rebase the branch on local `main`, then
  `git merge --ff-only` it into local `main`. Keep history linear.

## Writing style

- Do **not** use em-dashes (`U+2014`) anywhere: prose, commit messages, PR
  descriptions, comments, or docs. Use commas, parentheses, colons, en-dashes
  (`U+2013`), or separate sentences instead.

## Branches and worktrees

- Name branches and worktrees with a conventional-commit-style prefix (`feat/`,
  `fix/`, `chore/`, `docs/`, `refactor/`, `test/`), not `claude/`. Example:
  `feat/filter-guide-page`, `fix/manifest-link`.
- Feature work happens in a git worktree under `.claude/worktrees/` (gitignored).
  Keep the primary checkout on `main`.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.
