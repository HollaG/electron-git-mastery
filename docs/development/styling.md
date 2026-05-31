# Styling: TailwindCSS v4 + Mantine

The renderer (`src/ui/`) styles UI with two layers that coexist by design:

1. **Mantine v8** components and their props (`bg`, `p`, `w`, `h`, `styles`, theme colors like `gm-green`). These are the source of truth for component look-and-feel.
2. **TailwindCSS v4** utility classes via `className` for layout and one-off styling that previously lived in inline `style={{}}` objects or standalone CSS files.

There is intentionally no `tailwind.config.js`. Tailwind v4 is configured CSS-first and auto-detects class usage from `.tsx` files.

## How it is wired

- `src/ui/index.css` is the Tailwind entry point. It declares the cascade `@layer` order and pulls in Tailwind's `theme`, `base` (preflight), and `utilities`, plus an `@theme` block exposing the app fonts and `gm-*` brand colors as design tokens.
- `src/ui/main.tsx` imports `./index.css` first, then the **layered** Mantine stylesheets (`@mantine/core/styles.layer.css`, `@mantine/notifications/styles.layer.css`).
- `postcss.config.cjs` runs `@tailwindcss/postcss` alongside the existing `postcss-preset-mantine` and `postcss-simple-vars` plugins (single PostCSS pipeline; no Vite plugin).

## Why CSS layers matter

The layer order is declared in `src/ui/index.css`:

```css
@layer theme, base, mantine, components, utilities;
```

This guarantees Tailwind's `base` reset (preflight) is applied **before** Mantine's styles, so Mantine's component styling is never clobbered by the reset. Tailwind `utilities` come last, so a `className` utility still wins where it is explicitly applied. This is why Mantine must be imported via its `*.layer.css` variants — those wrap Mantine's rules in `@layer mantine`.

## Conventions

- Prefer Mantine props/components for component-level styling and theming.
- Use Tailwind utility classes (`flex`, `grow`, `shrink-0`, `w-full`, `gap-8`, `rounded-3xl`, etc.) for layout instead of inline `style={{}}` objects.
- It is acceptable to keep an inline `style={{}}` when a value references a Mantine CSS variable (e.g. `var(--mantine-color-text)`, `var(--mantine-radius-sm)`) and no clear Tailwind equivalent exists. See the `UserButton` in `src/ui/components/Navigation/LeftBarWrapper.tsx`.
- Mantine `styles={{ ... }}` slot overrides (targeting internal component slots like `label`/`root`) are not plain CSS and should stay as Mantine props.
