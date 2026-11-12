---
name: ISC.exe
description: A dark, direct study directory with calm evergreen surfaces and a warm gold route marker.
colors:
  evergreen-ground: "#111a17"
  evergreen-raised: "#17211d"
  evergreen-surface: "#1c2923"
  evergreen-surface-high: "#23332b"
  evergreen-line: "#304238"
  evergreen-line-strong: "#405449"
  ivory-text: "#e8eadf"
  sage-muted: "#aeb9ae"
  sage-faint: "#97a69a"
  route-gold: "#d9b86e"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(2.2rem, 4vw, 3.7rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)"
    fontWeight: 500
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  row: "7px"
  control: "8px"
  card: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.route-gold}"
    textColor: "#1a211b"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 1.1rem"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.evergreen-raised}"
    textColor: "{colors.ivory-text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "44px"
  input-search:
    backgroundColor: "{colors.evergreen-ground}"
    textColor: "{colors.ivory-text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
  nav-active:
    backgroundColor: "{colors.route-gold}"
    textColor: "#1a211b"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "44px"
  tree-row-selected:
    backgroundColor: "#28352b"
    textColor: "{colors.ivory-text}"
    typography: "{typography.body}"
    rounded: "{rounded.row}"
    height: "44px"
  card:
    backgroundColor: "{colors.evergreen-raised}"
    textColor: "{colors.ivory-text}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "16px"
---

# Design System: ISC.exe

## Overview

**Creative North Star: “The Revision Route Map”**

ISC.exe should feel like a quiet, dependable route through a large study collection. The evergreen ground and raised surfaces keep attention on the subject and resource rows; soft ivory carries the content, while a single warm-gold mark makes the current route or primary action easy to find. The interface is precise and calm, with measured rows and clear alignment rather than a hero-first or control-panel mood.

Use the existing identity and product language. Keep the directory useful and content-led across desktop and phone layouts. Dark is the default and only visual mode; theme choices may shift the dark hue, but must remain dark.

**Key Characteristics:**
- Dark evergreen foundation with raised, distinct reading surfaces.
- Warm gold identifies the active route, selection, focus, and primary action.
- Terse hierarchy, aligned rows, and restrained surface decoration.
- Responsive directory and document preview flow.

## Colors

The palette pairs green-black grounds and sage structure with soft ivory text; warm gold is the consistent route cue.

### Primary
- **Route Gold** (`{colors.route-gold}`): Marks selected stream or subject, active navigation, keyboard focus, and primary actions.

### Neutral
- **Evergreen Ground** (`{colors.evergreen-ground}`): Main page and search-field background.
- **Evergreen Raised** (`{colors.evergreen-raised}`): Header controls, toolbar surfaces, and raised panels.
- **Evergreen Surface** (`{colors.evergreen-surface}`): Nested surfaces and hover backgrounds.
- **Evergreen Surface High** (`{colors.evergreen-surface-high}`): Higher contrast surface when a nested layer needs more separation.
- **Evergreen Line** (`{colors.evergreen-line}`): Default dividers, control borders, and panel boundaries.
- **Evergreen Line Strong** (`{colors.evergreen-line-strong}`): Stronger tree guides and scrollbar tracks.
- **Ivory Text** (`{colors.ivory-text}`): Main labels, headings, and readable content.
- **Muted Sage** (`{colors.sage-muted}`): Secondary labels, supporting copy, and inactive controls.
- **Faint Sage** (`{colors.sage-faint}`): Low-priority icons and placeholder decoration.

**The One Gold Marker Rule.** Keep route gold focused on active, selected, focused, or primary elements; use sage and surface shifts for ordinary hierarchy.

**The Dark-Only Rule.** All defaults and user-selectable UI themes stay dark. Never introduce a white or light mode.

## Typography

**Display Font:** Space Grotesk (with sans-serif fallback)
**Body Font:** Plus Jakarta Sans (with sans-serif fallback)
**Label/Mono Font:** Plus Jakarta Sans; use monospace only for legacy technical hints where already present.

**Character:** Space Grotesk gives the largest headings a crisp, compact shape. Plus Jakarta Sans keeps directory labels and longer supporting copy approachable and legible.

### Hierarchy
- **Display** (600, responsive 2.2–3.7rem, 1.04 line-height, -0.035em tracking): Main landing title, aligned left.
- **Headline** (500, responsive 1.4–1.9rem, -0.025em tracking): Section and resource-group headings.
- **Title** (600, 1rem): Stream names and compact panel titles.
- **Body** (400, 1rem, up to 1.7 line-height): Directory text, descriptions, and supporting content.
- **Label** (500, 0.74rem): Secondary metadata, counters, and compact navigation labels.

**The Plain Case Rule.** Prefer sentence case and normal tracking for labels. Avoid turning routine navigation or metadata into widely tracked all-caps decoration.

## Layout

The desktop landing page uses a left-aligned content column up to 1120px wide. The title and description lead into actions and a four-column stats band, followed by stream rows arranged as aligned name, description, subject tags, and action bands. The directory uses a fixed-width left rail (minimum 320px, capped at 430px or 38vw) beside the document preview. Keep folder and note rows measured and scan-friendly.

At widths below 900px, the navigation and directory reflow; at phone widths the existing Directory / Document Preview switch controls the pane. Stack controls in reading order, keep the selected note when returning from preview, and preserve 44px targets for primary phone controls. The main spacing rhythm uses compact 4/8/12/16px steps, with 24/32px steps for larger grouping.

## Elevation & Depth

Depth is primarily tonal: evergreen surface steps and thin sage-green borders separate the header, directory rail, rows, and preview. The Route Map treatment removes ambient glow and glass blur. Reserve a restrained shadow for overlays such as the subject menu, where separation from the directory matters.

### Shadow Vocabulary
- **Subject Menu** (`0 12px 28px rgba(0,0,0,.28)`): Separates the open subject picker from nearby rows.

**The Flat-At-Rest Rule.** Resting navigation, buttons, and content rows use tonal and border differences rather than glow or floating shadows.

## Shapes

Controls use gently rounded corners (8px), folder and note rows use a tighter radius (7px), and content cards use a more open radius (12px). The header and stats band remain straight-edged, with rules and alignment doing the structural work. Keep borders thin and subdued; use pill shapes only for genuinely compact badges or status markers.

## Components

### Buttons
- **Character:** Compact, direct actions with restrained transitions.
- **Shape:** Gently rounded corners (8px).
- **Primary:** Route gold with dark evergreen text; 44px high, with 1.1rem horizontal padding.
- **Secondary / Ghost:** Raised evergreen or transparent background with muted text; hover shifts to a raised surface and line.
- **Hover / Focus:** Hover clarifies the surface without lifting it. `:focus-visible` uses a 2px route-gold outline with 2px offset.

### Cards / Containers
- **Corner Style:** Gently rounded (12px) for raised banners and information cards.
- **Background:** Evergreen raised, separated by a thin evergreen line.
- **Shadow Strategy:** Flat at rest; use overlay shadow only where a menu must separate from content.
- **Internal Padding:** Commonly 16px, with larger banners using more space.

### Inputs / Fields
- **Style:** Evergreen-ground fill, evergreen-line stroke, 8px corners, and a 44px search field.
- **Focus:** Route-gold border with a quiet gold focus halo; global keyboard focus keeps the same 2px gold outline and 2px offset.

### Navigation
- **Style:** A 58px desktop header with a bottom divider and compact, low-contrast navigation controls. The active page and Go to Notes action use route gold; hover uses a raised surface. At tablet widths the header is 54px and labels tighten to fit.

### Directory Rows
- **Style:** Folder and note rows are at least 40px on desktop and 44px on phone, with a 7px radius. Hover adds a subtle evergreen surface; the selected note receives a distinct evergreen highlight and gold border/icon cue.
- **Behavior:** Preserve folder expansion, note selection, preview opening, and selection when returning from preview.

### Document Preview
- **Style:** The preview pane is a quiet, near-black reading surface. Its top bar aligns breadcrumb, document count, navigation, and existing actions.
- **Actions:** Open uses route gold. Download, share, reload, and fullscreen use raised evergreen controls with a shared 8px shape and minimum 44px phone target.

## Do's and Don'ts

### Do:
- **Do** keep the default and every selectable UI palette dark.
- **Do** use gold for active routes, selected items, focus, and primary actions.
- **Do** preserve clear row alignment and the existing directory-to-preview flow at every viewport.
- **Do** keep main phone controls at least 44px high.

### Don't:
- **Don't** add a white or light mode.
- **Don't** use neon glow, glass blur, gradient text, or floating shadows as the default surface treatment.
- **Don't** use the gold accent as a broad background; its signal depends on selective use.
- **Don't** alter the product name, logo, study content, or existing resource actions as part of visual styling.
