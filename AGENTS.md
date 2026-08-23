# AGENTS.md

## Dev environment tips

- Use `npm run format` after writing code to format files
- Use `npm run dev` to start development server

## Testing instructions

- Do not need to write tests for now

## Agent skills (`.agents/skills/`)

Project skills live under **`.agents/skills/<name>/`** — agent-agnostic (not tied to Cursor, Claude, or another IDE). Each skill is a directory with a `SKILL.md` (YAML frontmatter + markdown body).

| Skill                                                              | When to use                                                                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [`git-mastery-design`](.agents/skills/git-mastery-design/SKILL.md) | House UI for Git-Mastery Desktop: tokens, flat surfaces, desktop layout, Tailwind v4 recipes. Read before styling or migrating UI off Mantine. |

**Workflow:** When a task matches a skill’s description, read that skill’s `SKILL.md` first, then any linked `references/` files it points to.
