# Festival Sales Dashboard — Project Briefing

## Overview
A live HTML dashboard for monitoring festival ticket sales, budget KPIs, and Meta Ads performance. Data flows from private Google Sheets through a "Feed Sheet" intermediary, published as CSV and read by the dashboard.

---

## Architecture

```
Private Sheet 1 (Aviv Is Win)     ──IMPORTRANGE──┐
  File ID: 1NKLkvJrpxZB7KlpIqzdosj0l80VAiaQ0mtdMuUPkxe4
  Tab: "Festivals SHITTIM"                       │
                                                 ├──► Feed Sheet (DB26APR tab) ──► HTML Dashboard
Private Sheet 2 (Budget)          ──IMPORTRANGE──┘
  File ID: 1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk
  Tab: "Dashboard"

Meta Ads ──► Apps Script (planned) ──► Feed Sheet (cols U–V, manual for now)
```

**Feed Sheet architecture:** One tab per festival (e.g. `DB26APR`, `DB27XXX`). All three data sources merge into a single tab. Dashboard reads only from the Feed Sheet published CSV URL.

---

## Feed Sheet — Tab: DB26APR

### Column Layout

| Columns | Source | Content |
|---------|--------|---------|
| A–P | IMPORTRANGE from Aviv Is Win | Full ticket sales comparison table (all events) |
| R–S | IMPORTRANGE from Budget sheet | Budget KPIs (col R = label, col S = value) |
| U–V | Manual input (Meta Ads later) | Meta Ads data (col U = label, col V = value) |

### Section 1: Tickets (A1)
```
=IMPORTRANGE("1NKLkvJrpxZB7KlpIqzdosj0l80VAiaQ0mtdMuUPkxe4","'Festivals SHITTIM'!A1:P200")
```

### Section 2: Budget KPIs (R1:S12)

| Cell R | Label | Cell S | Formula |
|--------|-------|--------|---------|
| R1 | tickets_current | S1 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!B7")` |
| R2 | tickets_BEP | S2 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!B8")` |
| R3 | tickets_SO | S3 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!B9")` |
| R4 | TPD_SO | S4 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!A23")` |
| R5 | TPD_BEP | S5 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!A24")` |
| R6 | DTE | S6 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!B24")` |
| R7 | pct_BEP_tickets | S7 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!A27")` |
| R8 | pct_SO_tickets | S8 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!A29")` |
| R9 | pct_BEP_revenue | S9 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!A28")` |
| R10 | pct_SO_revenue | S10 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!A30")` |
| R11 | revenue_current | S11 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!C7")` |
| R12 | revenue_BEP | S12 | `=IMPORTRANGE("1_h3VRq8HcJ5VUhhF2dZOLF6JiUv0h1xbmqtOJwqOxlk","Dashboard!C8")` |

> ⚠️ Budget cell references (B7, A23, etc.) are estimates based on screenshots. Need verification once Feed Sheet is live. Expected values: S1≈1399, S2≈2000, S3≈2850, S4≈15.42, S5≈13.98, S7≈69.95%, S8≈49.09%

### Section 3: Meta Ads (U1:V6) — Manual for now
```
U1: total_spend       V1: (number)
U2: conv_today        V2: (number)
U3: conv_avg_7d       V3: (number)
U4: cpl_today         V4: (number)
U5: cpl_avg_7d        V5: (number)
U6: spend_7d          V6: (number)
```

---

## Source Sheet Structures

### Sheet 1 — Aviv Is Win ("Festivals SHITTIM" tab)
Ticket sales comparison across all events. Day offset from event (0 = event day, negative = days before).

**Row structure:**
- Row 1 (index 0): Event dates per event column group
- Row 2 (index 1): Sale launch dates
- Row 3 (index 2): Campaign duration (days)
- Row 4 (index 3): Total presale
- Row 5 (index 4): Column headers
- Row 6+ (index 5+): Daily data, one row per day

**Column groups (0-indexed):**
| Event | Cumulative | Delta | Avg | GRO |
|-------|-----------|-------|-----|-----|
| DB24 Nov | B (1) | C (2) | D (3) | — |
| DB25 May | E (4) | F (5) | G (6) | H (7) |
| DB25 Nov | I (8) | J (9) | K (10) | L (11) |
| DB26 Apr | M (12) | N (13) | O (14) | P (15) |

**Col A (index 0):** Day offset integer (0, -1, -2, -3...)

**Current event:** DB26 Apr (index 3, cols M–P)

**Today's row detection:** Compare Israel-time date to event date, calculate day offset, find matching row in col A.

### Sheet 2 — Budget ("Dashboard" tab)
Hebrew-language budget dashboard with BEP/SO calculations.
Key values pulled via IMPORTRANGE into Feed Sheet col S (see table above).

---

## Dashboard File: festival-dashboard-v2.html

### Tech Stack
- Vanilla HTML/CSS/JS, no build step
- Chart.js 4.4.1 (CDN)
- Google Fonts: Bebas Neue, JetBrains Mono, Outfit
- CORS proxy: `corsproxy.io` for fetching published CSV

### Data Flow
1. User pastes published CSV URL in Settings
2. Dashboard fetches via `corsproxy.io`
3. CSV parsed into 2D array
4. Today's row found dynamically using Israel time (`Asia/Jerusalem`)
5. Budget values read from col S by label key in col R
6. Meta values read from col V by label key in col U
7. Charts rendered with Chart.js

### Key Config Object (`FEED`)
```js
const FEED = {
  tickets: {
    dayCol: 0,
    dataStartRow: 5,
    events: [
      { name: 'DB24 Nov', cumCol: 1,  deltaCol: 2,  avgCol: 3  },
      { name: 'DB25 May', cumCol: 4,  deltaCol: 5,  avgCol: 6  },
      { name: 'DB25 Nov', cumCol: 8,  deltaCol: 9,  avgCol: 10 },
      { name: 'DB26 Apr', cumCol: 12, deltaCol: 13, avgCol: 14 },
    ],
    currentIdx: 3,
  },
  budget: { labelCol: 17, valCol: 18 }, // R=17, S=18
  meta:   { labelCol: 20, valCol: 21 }, // U=20, V=21
};
```

### Storage (localStorage)
```
festivals        → JSON array of { name, csvUrl, eventDate, launchDate }
activeFest       → index of currently selected festival
meta_<festName>  → JSON object with Meta Ads manual input values
```

### Dashboard Widgets
- Live countdown (Israel time, `Asia/Jerusalem`)
- Today's sales / cumulative / 7-day avg / 14-day avg
- Daily sales bar chart (last 30 days)
- Cumulative comparison line chart (all 4 events)
- Event snapshot comparison table
- Budget KPIs: TPD SO, TPD BEP, BEP% tickets, SO% tickets, BEP% revenue, SO% revenue
- Meta Ads: spend, conversions today, 7-day avg, CPL
- Meta manual input form (persists to localStorage)

### Settings Panel
Accessible via ⚙ SETTINGS button (top right). Supports multiple festivals — each stored separately. Fields: Name, CSV URL, Event Date, Sale Launch Date.

---

## Pending / Next Steps

### 1. Verify Budget Cell References
Once Feed Sheet is live, check col S values match expected. If wrong, update IMPORTRANGE cell addresses in Feed Sheet and update `FEED.budget` config if needed.

### 2. Meta Ads — Apps Script Integration
Planned: Google Apps Script in Feed Sheet that calls Meta Ads API and writes to cols U–V automatically on a daily trigger.

Required from user:
- Meta Ad Account ID (`act_XXXXXXXXX`)
- Meta System User Access Token (with `ads_read` permission)
- Campaign IDs or date range to filter

Script will write these fields to cols U–V:
- total_spend, conv_today, conv_avg_7d, cpl_today, cpl_avg_7d, spend_7d

### 3. Future Festivals
Add new tab to Feed Sheet (e.g. `DB27XXX`) with identical column structure pointing to new source sheets. Add via dashboard Settings → "+ New Festival".

---

## Files

| File | Description |
|------|-------------|
| `festival-dashboard-v2.html` | Main dashboard (open in Chrome) |
| `FEED_SHEET_SETUP.txt` | Step-by-step Feed Sheet setup with all formulas |

---

## Known Issues / Notes
- Budget cell references in IMPORTRANGE are estimates — need verification
- CORS proxy (`corsproxy.io`) is free and public; if it goes down, switch to `api.allorigins.win/raw?url=`
- Dashboard auto-refreshes every 5 minutes
- All times use `Asia/Jerusalem` timezone
