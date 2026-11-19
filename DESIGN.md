---
name: Buzón de webhooks
description: A disposable webhook receiver dressed as an air-mail sorting table.
colors:
  shell-navy: "#15254a"
  shell-ink: "#eef3fc"
  shell-ink-muted: "#aebbd6"
  air-red: "#c8102e"
  air-blue: "#1f4fa3"
  signature-ink: "#1f4fa3"
  action: "#15254a"
  action-ink: "#ffffff"
  action-hover: "#22386a"
  ok-ink: "#1b7343"
  ok-wash: "#e3f3ea"
  err-ink: "#b81d2f"
  err-wash: "#fbe6e8"
  focus: "#1f6fe0"
  paper-ground: "#e8edf4"
  sheet: "#ffffff"
  sheet-inset: "#f4f7fb"
  ink: "#14213d"
  ink-muted: "#4b5b78"
  rule: "#d2dbe7"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.5
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "0.02em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, Cascadia Code, SF Mono, Menlo, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.55
  mono-code:
    fontFamily: "ui-monospace, Cascadia Code, SF Mono, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  tag: "4px"
  row: "6px"
  control: "8px"
  sheet: "10px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  button-quiet-hover:
    backgroundColor: "{colors.sheet-inset}"
  input-address:
    backgroundColor: "{colors.sheet-inset}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    padding: "18px 20px 20px"
  status-chip-ok:
    backgroundColor: "{colors.ok-wash}"
    textColor: "{colors.ok-ink}"
    typography: "{typography.mono-code}"
    rounded: "{rounded.pill}"
    padding: "2px 7px"
  status-chip-err:
    backgroundColor: "{colors.err-wash}"
    textColor: "{colors.err-ink}"
    typography: "{typography.mono-code}"
    rounded: "{rounded.pill}"
    padding: "2px 7px"
  lang-toggle-active:
    backgroundColor: "{colors.shell-ink}"
    textColor: "{colors.shell-navy}"
    rounded: "{rounded.row}"
    height: "28px"
---

# Design System: Buzón de webhooks

## Overview

**Creative North Star: "The Air-Mail Sorting Table"**

Every delivery is a letter laid on a sorting table and cancelled with a postmark that states when it arrived and what the endpoint answered. The chrome is an air-mail envelope: a navy shell band edged with a red/white/blue chevron stripe, sitting over cool paper (light) or night navy (dark). Content lives on white sheets with a thin rule and a soft ambient lift.

The system is quiet and dense, built for a page that sits beside the editor and is glanced at, not studied. Color is rationed: the air-mail red and blue belong to the envelope edge and the signature header; everywhere else, ink colors carry state only, green for 2xx and red for 4xx or invalid. System sans runs the interface; monospace is reserved for what came over the wire (payloads, headers, URLs, status codes, times).

Light and dark are both first-class and follow the OS (`prefers-color-scheme`). Every token below has a dark counterpart in the sidecar; the dark world is night navy ground, raised navy sheets, and lifted pastel inks, not an inversion.

**Key Characteristics:**
- Navy shell band with a 6px diagonal air-mail stripe as its lower edge.
- White sheets on cool paper, 10px corners, 1px rule, two-layer ambient shadow.
- Status is spoken in ink color plus a mono code chip, never color alone.
- One circular postmark per delivery, slightly rotated, stamped in once on arrival.
- Monospace only for wire data; tabular numerals everywhere.

## Colors

A cool, paper-and-ink palette: navy chrome, blue-grey neutrals, and two state inks.

### Primary
- **Shell Navy** (shell-navy): the header band, the toast, and (as `action`) the one filled primary button. In dark mode the action role flips to a pale ink-on-light button so it stays the brightest object.

### Secondary
- **Air-Mail Red** and **Air-Mail Blue** (air-red, air-blue): the envelope stripe and the favicon only. Air-mail blue also tints the signature header row at 9% and the text selection.
- **Signature Ink** (signature-ink): header names and hints for signature headers (`stripe-signature`, etc.), the one thing a developer usually needs to copy.

### Tertiary
- **Delivered Green** (ok-ink, on ok-wash): 2xx postmarks, tags, mode chips, and the checked "success" mode border; also the confirmed state of a copy button.
- **Returned Red** (err-ink, on err-wash): 4xx and invalid postmarks, tags, mode chips, and the danger hover on Vaciar.

### Neutral
- **Cool Paper** (paper-ground): page ground.
- **Sheet White** (sheet) and **Inset Paper** (sheet-inset): raised sheets, and the inset tone for fields, code blocks, hovered and open rows.
- **Letter Ink** (ink) and **Faded Ink** (ink-muted): body text and secondary text, panel titles, header keys.
- **Hairline** (rule): every border and divider.
- **Focus Blue** (focus): the 2px focus outline, never used decoratively.

### Named Rules
**The State Ink Rule.** Green and red mean HTTP outcome and nothing else. They never decorate, and they always travel with a printed code (200, 400, INVÁLIDO) so color is never the only signal.

**The Envelope Edge Rule.** Air-mail red and blue appear only on the shell stripe and identity marks. Spreading them into content turns the envelope into a flag.

## Typography

**Body Font:** system-ui stack (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, sans-serif)
**Label/Mono Font:** ui-monospace stack (ui-monospace, Cascadia Code, SF Mono, Menlo, Consolas)

**Character:** Utilitarian and native; the interface disappears so the wire data reads. Monospace marks everything that arrived or will be sent.

### Hierarchy
- **Headline** (650, 16px): sheet headings such as "Entregas" and the empty-state title. The app name in the shell runs at 18px/650 with -0.01em tracking.
- **Title** (650, 12-13px, +0.02em, Faded Ink): panel legends and block labels (Dirección de entrega, Payload, Respuesta enviada).
- **Body** (400, 15px/1.5, tabular numerals): base text and mode labels at 14px.
- **Label** (400, 13px, Faded Ink): hints, status line, entry side metadata.
- **Mono** (400, 12.5px/1.55): payloads, header values, previews, curl example; address field at 14px.
- **Mono code** (600, 11-13px): status chips, tags, count badge, arrival time.

### Named Rules
**The Wire Is Mono Rule.** If it came over HTTP or will be pasted into a terminal, it is set in monospace; UI copy never is.

## Layout

Single centered column (max 1120px, 20px gutters, 16px under 560px). The first row is a two-column control grid (1.5fr address sheet, 1fr response-mode sheet, 20px gap) that stacks under 820px. Below it, one full-width delivery sheet: a head row (title, count badge, tools) over a list of entries separated by hairlines.

Each entry summary is a three-column grid: 112px postmark, flexible meta (tag + message, mono preview), and a right-aligned side cluster (size, time, chevron). The opened detail sits on inset paper, indented 148px to align with the meta column, split 3fr payload / 2fr response, with headers spanning both. Under 820px the indent drops; under 560px the postmark shrinks to 96px, the side cluster moves under the meta, and header rows stack value under key.

Spacing runs on a 4px base, mostly 8 / 12 / 16 / 20px; sheets pad 18-20px, rows pad 12px 20px.

## Elevation & Depth

Hybrid: hairline borders define edges, a soft two-layer ambient shadow lifts sheets off the paper ground. Depth inside a sheet is tonal (inset paper), never another shadow.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 1px 2px rgba(20,33,61,.06), 0 4px 14px rgba(20,33,61,.06)`; dark: `0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25)`): every sheet.
- **Toast** (`box-shadow: 0 8px 24px rgba(0,0,0,.25)`): the transient copy/confirm toast only.

### Named Rules
**The One Lift Rule.** Only sheets and the toast cast shadows. Rows, fields, and code blocks separate by border and tone.

## Shapes

Gently rounded, tiered by size: 4px tags, 6px header rows and toggle segments, 8px controls/fields/code blocks, 10px sheets, full pills for status chips and the count badge. Borders are 1px hairlines; header rows divide with a dashed hairline, like a ledger. The two recurring silhouettes are the circle (postmark, favicon, brand mark, live dot) and the 135-degree chevron stripe.

## Components

### Buttons
Calm and compact; one filled button per screen.
- **Shape:** gently rounded (8px).
- **Primary:** Shell Navy fill, white text, 44px tall, 16px sides, 14px/600, 16px stroke icon leading. Used for "Copiar URL" only.
- **Hover / Focus:** fill shifts to action-hover over 150ms; global 2px Focus Blue outline offset 2px.
- **Quiet:** transparent with hairline border, 36px (26px inside blocks and header rows), 13px; hover fills Inset Paper and darkens the border.
- **Danger (quiet variant):** stays neutral at rest; text and border turn Returned Red on hover.
- **Done:** after a copy, the button fills Delivered Green with white text and a check icon.

### Chips
- **Status chip:** mono 600 12px, pill, state ink on its 12%-ish wash (Delivered Green or Returned Red). Shows the HTTP code each mode returns.
- **Tag:** the same treatment at 11px with 4px corners, inline before the delivery message.
- **Count badge:** mono pill on Inset Paper with a hairline, Faded Ink.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Sheet White on Cool Paper.
- **Shadow Strategy:** Sheet lift (see Elevation).
- **Border:** 1px Hairline.
- **Internal Padding:** 18px 20px 20px for panels; list rows 12px 20px.

### Inputs / Fields
- **Address field:** read-only, 44px, mono 14px on Inset Paper, hairline border, 8px corners; click copies. Hover darkens the border to Faded Ink.
- **Response modes:** radio rows (7px 10px padding, 8px corners) with the label left and a status chip right. Hover fills Inset Paper; the checked row gets Inset Paper, 600 weight, and a border mixed 45% from its state ink, so the armed response reads at a glance.

### Navigation
- **Shell band:** Shell Navy, 64px minimum, brand mark + name left, live status (dot + "Escuchando · n entregas") and the ES/EN segmented toggle right. The toggle is a translucent white track; the pressed segment fills Shell Ink with navy text.

### Postmark (signature component)
A 112x74 inline SVG per delivery, drawn in the entry's state ink: double ring (2.4px outer, 1.1px inner), date (DD MMM YYYY) on the upper arc and time on the lower arc in 8.2px/700 sans with 1px tracking, the status code at 15px/800 in the center (the short label "INVÁL." / "INVAL." at 9px when there is no code), and three wavy cancellation lines to the right at 85% opacity. Each mark is rotated a stable -10 to +6 degrees derived from the delivery id, like a hand stamp. New arrivals stamp in once: scale 1.35 to 1 with opacity, 220ms `cubic-bezier(.2,.8,.2,1)`, skipped under reduced motion.

### Headers tile
A collapsible block inside the detail: chevron + "Headers (n)" + a signature hint in Signature Ink. Rows are a key / value / copy grid in mono; signature headers sort first and get the air-blue 9% wash and Signature Ink key and button.

## Do's and Don'ts

### Do:
- **Do** route every color through the custom properties so light and dark stay paired.
- **Do** pair each state ink with a printed code or label (The State Ink Rule).
- **Do** set wire data (payloads, headers, URLs, codes, times) in the mono stack, with tabular numerals.
- **Do** keep one filled primary button per screen; everything else is quiet.
- **Do** keep motion to state feedback (150-200ms) plus the single 220ms stamp-in, and honor `prefers-reduced-motion`.

### Don't:
- **Don't** use air-mail red or blue as content accents; they belong to the envelope edge (The Envelope Edge Rule).
- **Don't** use green or red for anything but HTTP outcome.
- **Don't** add shadows to rows, fields, or code blocks (The One Lift Rule).
- **Don't** render deliveries as a grid of identical JSON cards; each one is a list row with its postmark.
