// ═══════════════════════════════════════════════════════
// FestDash — Apps Script Web App
// Paste this entire file into Tools → Script Editor inside
// the "Festival Dashboard Feed" Google Sheet.
// ═══════════════════════════════════════════════════════

// ─── CONFIG ─────────────────────────────────────────────
const FEED_TAB = 'DB26APR'; // update per festival tab name

// Meta Ads — fill these in:
const META_TOKEN      = 'YOUR_ACCESS_TOKEN_HERE';        // long-lived system user token
const META_AD_ACCOUNT = 'act_YOUR_ACCOUNT_ID_HERE';      // e.g. act_1234567890
// ────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════
// WEB APP ENDPOINT — called by the dashboard
// ═══════════════════════════════════════════════════════
function doGet(e) {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (e && e.parameter && e.parameter.tab) || FEED_TAB;
  const sheet     = ss.getSheetByName(sheetName);

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Tab not found: ' + sheetName }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Ticket sales — A1:P200
  const raw = sheet.getRange('A1:P200').getValues();
  const ticketsHeader = raw[0];
  const ticketsRows   = raw.slice(1).filter(r => r.some(c => c !== ''));

  // Budget KPIs — R1:S12 (key in col R, value in col S)
  const budgetRaw = sheet.getRange('R1:S12').getValues();
  const budget    = {};
  budgetRaw.forEach(([k, v]) => { if (k) budget[k] = v; });

  // Meta Ads — U1:V6 (key in col U, value in col V)
  const adsRaw = sheet.getRange('U1:V6').getValues();
  const ads    = {};
  adsRaw.forEach(([k, v]) => { if (k) ads[k] = v; });

  const data = {
    tab:           sheetName,
    lastUpdate:    new Date().toISOString(),
    ticketsHeader: ticketsHeader,
    tickets:       ticketsRows,
    budget:        budget,
    ads:           ads,
  };

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


// ═══════════════════════════════════════════════════════
// META ADS SYNC — runs on a time trigger (every 1–2 hrs)
// ═══════════════════════════════════════════════════════
function updateMetaAds() {
  const base   = 'https://graph.facebook.com/v19.0/';
  const fields = 'spend,actions';

  // 1. Today
  const todayData  = _metaInsights(base, 'today', fields);
  const spendToday = _val(todayData, 'spend');
  const convToday  = _conversions(todayData);
  const cplToday   = convToday > 0 ? spendToday / convToday : 0;

  // 2. Last 7 days
  const d7Data    = _metaInsights(base, 'last_7d', fields);
  const spend7d   = _val(d7Data, 'spend');
  const conv7d    = _conversions(d7Data);
  const convAvg7d = conv7d / 7;
  const cplAvg7d  = conv7d > 0 ? spend7d / conv7d : 0;

  // 3. Lifetime total spend
  const lifeData   = _metaInsights(base, 'maximum', fields);
  const totalSpend = _val(lifeData, 'spend');

  // Write to Feed Sheet U1:V6
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(FEED_TAB);
  if (!sheet) {
    Logger.log('Tab not found: ' + FEED_TAB);
    return;
  }

  sheet.getRange('U1:V6').setValues([
    ['total_spend', _round(totalSpend)],
    ['conv_today',  _round(convToday)],
    ['conv_avg_7d', _round(convAvg7d, 2)],
    ['cpl_today',   _round(cplToday,  2)],
    ['cpl_avg_7d',  _round(cplAvg7d,  2)],
    ['spend_7d',    _round(spend7d)],
  ]);

  Logger.log('Meta Ads updated: spend=' + totalSpend + ' conv_today=' + convToday);
}


// ═══════════════════════════════════════════════════════
// DEBUG — run this once to see which action_type to use
// Check View → Logs after running
// ═══════════════════════════════════════════════════════
function debugMetaActions() {
  const base   = 'https://graph.facebook.com/v19.0/';
  const fields = 'spend,actions';
  const data   = _metaInsights(base, 'last_7d', fields);

  if (!data) {
    Logger.log('No data returned — check META_TOKEN and META_AD_ACCOUNT');
    return;
  }

  Logger.log('Spend (last 7d): ' + data.spend);

  if (!data.actions || data.actions.length === 0) {
    Logger.log('No actions found — no conversions in last 7 days, or pixel not firing');
    return;
  }

  Logger.log('--- Action types found ---');
  data.actions.forEach(a => {
    Logger.log(a.action_type + ' = ' + a.value);
  });
}


// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function _metaInsights(base, datePreset, fields) {
  const url = base + META_AD_ACCOUNT + '/insights'
    + '?fields=' + fields
    + '&date_preset=' + datePreset
    + '&access_token=' + META_TOKEN;

  try {
    const res  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const json = JSON.parse(res.getContentText());
    if (json.error) {
      Logger.log('Meta API error: ' + JSON.stringify(json.error));
      return null;
    }
    return json.data && json.data[0] ? json.data[0] : null;
  } catch (err) {
    Logger.log('Meta fetch failed: ' + err);
    return null;
  }
}

// Tries common purchase action type names
function _conversions(data) {
  if (!data || !data.actions) return 0;
  const purchaseTypes = [
    'purchase',
    'offsite_conversion.fb_pixel_purchase',
    'omni_purchase',
  ];
  for (const t of purchaseTypes) {
    const match = data.actions.find(a => a.action_type === t);
    if (match) return parseFloat(match.value) || 0;
  }
  return 0;
}

function _val(data, key) {
  if (!data) return 0;
  return parseFloat(data[key] || 0);
}

function _round(v, decimals = 0) {
  return parseFloat(v.toFixed(decimals));
}
