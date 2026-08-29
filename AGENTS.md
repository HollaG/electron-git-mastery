# AGENTS.md

## Dev environment tips

- Use `npm run format` after writing code to format files
- Use `npm run lint` at the end to check for linting errors, fix if any
- Use `npm run dev` to start development server

## Documentation

- Non-trivial and logic / architectural design decisions, rejected alternatives, and tradeoffs must be documented as an .md file in the docs/ folder
- Where old decisions are reversed, favour deleting outdated information / decisions in the existing documentation instead of appending to them
- Do not document decisions that are obvious from the implementation (eg. UI) and do not bloat the docs/ folder. If in doubt, ask the user

## Testing instructions

- No testing needed

## Skills

Project skills live under `.agents/skills/<name>/`. Each skill is a directory with a `SKILL.md`

**Workflow:** When a task matches a skill’s description, read that skill’s `SKILL.md` first, then any linked `references/` files it points to.
