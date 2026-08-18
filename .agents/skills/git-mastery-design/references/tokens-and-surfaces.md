# Git-Mastery — tokens & surfaces

Agent SSOT for color, typography, spacing, radius, shadow, motion, and surface recipes.
The shipped subset lives in [`src/ui/index.css`](../../../../src/ui/index.css).

---

## 1. Color

### Canvas & text

| Token         | Hex / class | Role                                      |
| ------------- | ----------- | ----------------------------------------- |
| Canvas (bone) | `#f8f8f8`   | Onboarding / full-screen focus background |
| Surface       | `#ffffff`   | Header, content panes, cards, modals      |
| Text primary  | `#333333`   | Body, headings                            |
| Text muted    | `#666666`   | neutral-500 range — helpers, secondary    |
| Text faint    | `#a3a3a3`   | neutral-400 — placeholders, meta          |
| Border        | `#e5e5e5`   | neutral-200 — hairlines, dividers         |

The neutral ramp is Tailwind **`neutral-*`** (pure gray). It matches the bone canvas; `slate-*` is blue-tinted and clashes with the green brand.

### Brand scale (primary accent)

| Step    | Hex           | Role                           |
| ------- | ------------- | ------------------------------ |
| 50      | `#f2faf5`     | Soft fill, success chip fill   |
| 100     | `#e1f4e8`     | Focus ring soft                |
| 200     | `#c8ead4`     | Soft border                    |
| 300     | `#9ad6af`     |                                |
| 400     | `#5dc080`     | Focus border                   |
| 500     | `#3ba561`     |                                |
| **600** | **`#2d864e`** | **CTA / primary — `gm-green`** |
| 700     | `#236e3d`     | Primary hover                  |
| 800     | `#1c5a31`     |                                |
| 900     | `#164928`     |                                |

`--color-gm-green` is an alias of brand-600, so existing usages keep working.

**Olive accent** `#717c4d` (`gm-dark-green`): secondary decorative accent only — never a CTA, never a status color.

### Semantic surfaces (pills / tags / soft badges)

Pattern: fill `*-50` + text `*-700` + border `*-200`, **11px**, medium weight.

| Role                              | Fill      | Text      | Border    |
| --------------------------------- | --------- | --------- | --------- |
| Neutral / idle                    | `#f5f5f5` | `#525252` | `#e5e5e5` |
| Success / completed / ready       | `#f2faf5` | `#236e3d` | `#c8ead4` |
| Danger / failed / needs work      | `#fef3f2` | `#b42318` | `#fecdca` |
| Warning / in progress / attention | `#fffaeb` | `#b54708` | `#fedf89` |
| Info / downloading / running      | `#f0f9ff` | `#0369a1` | `#bae6fd` |

Success deliberately reuses the brand hue — in this product "done" and "brand" are the same green. Because of that, **green is never used decoratively**: a green pill always means success.

Hard destructive button: `#b42318`, hover `#912018`.

### Exercise status mapping

The catalog already encodes this; keep new surfaces consistent with it.

| Status                     | Pill style                                               |
| -------------------------- | -------------------------------------------------------- |
| `not-started`              | neutral                                                  |
| `in-progress`              | warning (amber)                                          |
| `incorrect` ("Needs work") | danger (red)                                             |
| `correct` ("Completed")    | success (brand green)                                    |
| Downloading                | info (sky), with a spinner                               |
| Active exercise            | brand tint row `rgba(45,134,78,0.06)` + "Active" text    |
| Unknown value from disk    | neutral fallback — never crash on an unrecognized status |

---

## 2. Typography

Both families are loaded in [`index.html`](../../../../index.html) and exposed as `--font-body` / `--font-heading`.

```text
body:     Inter, system-ui, sans-serif
headings: "Noto Serif", Georgia, serif
```

Serif is for titles only. Body, controls, labels, chips, and list rows are always Inter.

| Role                        | Size              | Weight  | Family | Notes                                               |
| --------------------------- | ----------------- | ------- | ------ | --------------------------------------------------- |
| Page title (h1)             | `2.05rem` / ~33px | 600     | serif  | One per view, line-height 1.3                       |
| Section title (h2)          | `1.45rem` / ~23px | 600     | serif  | Group headers, line-height 1.35                     |
| Card / modal title (h3)     | `1.2rem` / ~19px  | 600     | serif  | line-height 1.4                                     |
| Lead / subtitle             | ~16px             | 400     | sans   | Under a page title, muted                           |
| Body                        | 13–14px           | 400     | sans   | Default tool UI                                     |
| Micro label                 | 11–11.5px         | 500–600 | sans   | Uppercase, tracking 0.06–0.08em, faint              |
| Chip / badge                | 11px              | 500     | sans   | Semantic color                                      |
| Mono (paths, commands, ids) | inherit           | 400–500 | mono   | Monospace **only** for paths, commands, identifiers |

---

## 3. Spacing

| Token             | Value           | Use                        |
| ----------------- | --------------- | -------------------------- |
| Pane edge padding | 20–28px         | Content pane inset         |
| Card gap          | 16–20px         | Between major panels       |
| Card padding      | 16px (sm: 24px) | Card / modal content       |
| Control gap       | 8px             | Button groups              |
| List row padding  | 12px vertical   | Dense catalog rows         |
| Group gap         | 28px            | Between titled list groups |
| Meta row gap      | 12px            | Label ↔ value              |

Content panes cap readable text at ~820px; full-width is reserved for lists and panes that need it.

---

## 4. Radius

| Surface                      | Radius     | Tailwind       |
| ---------------------------- | ---------- | -------------- |
| Page card / modal            | **16px**   | `rounded-2xl`  |
| Icon chip                    | **12px**   | `rounded-xl`   |
| Input / select               | **12px**   | `rounded-xl`   |
| Default button               | **6px**    | `rounded-md`   |
| Segmented switch / page chip | **9999px** | `rounded-full` |
| Status pill                  | **4–6px**  | `rounded`      |

---

## 5. Border & shadow

- Default border: `#e5e5e5` ≈ `border-neutral-200`.
- Dividers: `border-neutral-200/80` or `#e6e6e6` / `#eee` as already used in catalog rows.

**Card shadow** (modals, dropdowns, elevated panels only):

```css
box-shadow:
  0 1px 2px rgb(23 23 23 / 0.04),
  0 1px 3px rgb(23 23 23 / 0.06);
```

Most in-app surfaces are flat — header and content panes use a border, not a shadow. Avoid heavy drop shadows, glow, or neumorphism.

---

## 6. Motion

- Chevron rotate / small UI toggles: **150–200ms** ease (`cubic-bezier(0.16, 1, 0.3, 1)` acceptable).
- **Zero duration** for anything that reveals or hides the native web view — the native layer cannot animate with the DOM, so a transition only produces a flicker.
- No constant particle, pulse, or glow animations.

---

## 7. Surfaces

### App chrome (header, panes)

Solid `#ffffff`, hairline `border-neutral-200` where panes meet. No blur, no transparency.

### Content pane (default)

Solid `#ffffff`, own scroll container (`overflow-y-auto`). This is what the exercises catalog, lesson overlay, and most views use.

### Card (floating / onboarding)

```css
background: #ffffff;
border: 1px solid #e5e5e5;
border-radius: 16px;
/* optional shadow-card on modals and dropdowns */
```

Tailwind: `rounded-2xl border border-neutral-200 bg-white p-6` — add `shadow-card` for modals and menus.

### Modal

- Overlay: `rgb(23 23 23 / 0.25)` — solid dim, no blur.
- Panel: `bg-white`, `rounded-2xl`, `border border-neutral-200`, `shadow-card`.
- Suppress the native web view while open; open and close with zero transition when over the view region.

### Toast

Top-right stack; white surface + `shadow-card`; semantic left border or icon (brand green success / red error / sky info). Auto-dismiss ~4s, errors longer.

### Terminal pane

Black background, monospace, flush to the window edge. Not a dark theme — do not derive dark-mode tokens from it.

### Bone canvas

`#f8f8f8` only for full-screen focus (onboarding). The running app chrome is white, not bone.

---

## 8. Theme is light-only

There is no theme toggle and no `dark:` variants. Do not add `darkMode` handling, `prefers-color-scheme` overrides, or dark token sets.

---

## 9. Tailwind v4 theme

Tailwind v4 has no JS config here. Tokens are CSS variables inside `@theme`; each generates matching utilities (`bg-brand-600`, `text-brand-700`, `font-heading`, `shadow-card`).

```css
@import "tailwindcss";

@theme {
  --font-body: "Inter", system-ui, sans-serif;
  --font-heading: "Noto Serif", Georgia, serif;

  --color-brand-50: #f2faf5;
  --color-brand-100: #e1f4e8;
  --color-brand-200: #c8ead4;
  --color-brand-300: #9ad6af;
  --color-brand-400: #5dc080;
  --color-brand-500: #3ba561;
  --color-brand-600: #2d864e;
  --color-brand-700: #236e3d;
  --color-brand-800: #1c5a31;
  --color-brand-900: #164928;

  --color-gm-green: var(--color-brand-600);
  --color-gm-bone: #f8f8f8;
  --color-gm-olive: #717c4d;

  --shadow-card: 0 1px 2px rgb(23 23 23 / 0.04), 0 1px 3px rgb(23 23 23 / 0.06);
}

html,
body,
#root {
  height: 100%;
  margin: 0;
}

body {
  font-family: var(--font-body);
  background: var(--color-gm-bone);
  color: #333333;
  -webkit-font-smoothing: antialiased;
}
```

Notes:

- Reach for `@theme` values in raw CSS as `var(--color-brand-600)` when a utility will not do.
- When removing legacy CSS layers from `index.css`, drop unused `@layer` entries in the same change.
