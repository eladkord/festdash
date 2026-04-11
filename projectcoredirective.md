# FestDash — Core Project Directive

## Purpose
Real-time festival ticket sales dashboard for a team of 3 people. Monitor ticket sales, budget KPIs, and Meta Ads performance across multiple festival events.

## Constraints
- **Free**: No paid services, no hosting costs, no API subscriptions
- **Private**: Google Sheets remain private, never published publicly
- **Simple**: Vanilla HTML/CSS/JS, no build step, single HTML file
- **Israel timezone**: All dates/times use `Asia/Jerusalem`

## Architecture
```
Private Sheet 1 (Ticket Sales)  ──IMPORTRANGE──┐
                                                ├──► Feed Sheet (1 tab/festival)
Private Sheet 2 (Budget)        ──IMPORTRANGE──┘         │
                                                          ▼
Meta Ads ──► Apps Script ──► Feed Sheet cols U-V    Apps Script doGet()
                                                          │
                                                          ▼
                                                   HTML Dashboard
                                                   (JSON via Apps Script)
```

### Data Flow
1. Private source sheets feed into a "Feed Sheet" via IMPORTRANGE
2. Feed Sheet has one tab per festival (e.g. DB26APR) with standardized column layout
3. Apps Script web app (deployed from Feed Sheet) serves data as JSON
4. Dashboard fetches JSON, no CORS proxy needed, sheet stays private

### Feed Sheet Column Layout (per tab)
| Columns | Source | Content |
|---------|--------|---------|
| A-P | IMPORTRANGE (ticket sales) | Full sales comparison table |
| R-S | IMPORTRANGE (budget) | Budget KPIs (R=label, S=value) |
| U-V | Apps Script / manual | Meta Ads (U=label, V=value) |

## Access Control
- Simple shared password/token gate
- All 3 users see identical dashboard
- No role-based access needed

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS, Chart.js 4.4.1 (CDN)
- **Fonts**: Bebas Neue, JetBrains Mono, Outfit (Google Fonts)
- **Data**: Google Apps Script web app returning JSON
- **Storage**: localStorage for settings, festival configs, Meta manual inputs
- **Hosting**: Local file or any static hosting (GitHub Pages, etc.)

## Key Files
| File | Purpose |
|------|---------|
| `festival-dashboard-v2.html` | Main dashboard (open in browser) |
| `DASHBOARD_PROJECT.md` | Full project briefing & technical reference |
| `FEED_SHEET_SETUP.txt` | Step-by-step Feed Sheet setup with formulas |
| `todo.md` | Additive task log (never delete items) |
| `projectcoredirective.md` | This file — core goals & architecture |
