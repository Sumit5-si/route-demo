---
trigger: always_on
---

Ui and color pallete:-



1. Core UI Palette (the one in the live design)
This is built to NOT look AI-generated — no purple gradients, just white + slate + 1 accent.

Backgrounds

--bg-page: #F8FAFC (slate-50) - full page background
--bg-card: #FFFFFF - all cards, inputs, header
--bg-card-hover: #F9FAFB - hover on route cards
Text

--text-primary: #0F172A (slate-900) - headings, logo, main text
--text-secondary: #475569 (slate-600) - subtext, labels
--text-muted: #94A3B8 (slate-400) - placeholders, timestamps
Borders & Shadows

--border: #E2E8F0 (slate-200) - card borders, input borders
--border-strong: #CBD5E1 (slate-300) - focused inputs
--shadow-card: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03) - soft, not floating
Accent (only 2 colors)

--accent-primary: #14B8A6 (teal-500) - selected route, battery bar, 'ai' in logo, teal dot, primary CTA
--accent-primary-hover: #0D9488 (teal-600)
--accent-secondary: #0EA5E9 (sky-500) - charging stations, map pins, secondary actions
Semantic

--success: #10B981 (emerald-500) - battery >50%, station available
--warning: #F59E0B (amber-500) - battery 20-50%
--danger: #EF4444 (red-500) - battery <20%
2. Logo Palette (v2 - the minimal one)
Matches 1:1 with UI, so it sits on white cards:

Icon stroke: #0F172A (same as text-primary)
Teal dot + "ai" text: #14B8A6
No other colors. Transparent background.
3. How to use it in code
CSS
:root {
  --bg: #F8FAFC;
  --card: #FFFFFF;
  --border: #E2E8F0;
  --text: #0F172A;
  --text-2: #475569;
  --teal: #14B8A6;
  --sky: #0EA5E9;
  --radius-card: 16px;
  --radius-pill: 999px;
}
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

12 lines hidden
Rule to keep it premium: White cards = 90% of UI, Teal = only for selected state + battery + primary button. Sky blue = only for map route line and charging icons. Never use both teal and blue large at same time.