const SOURCE_SPREADSHEET_ID = '12fN7DQB3VwUO_ydeuFuoAvF570rVVVvTyn29g-utl-M';
const SOURCE_SHEET_NAME = 'Respuestas de formulario 1';
const TARGET_SPREADSHEET_ID = '1fgNlXn70PAE2JDcvZVjepxEEQ4c4FnS_2HlIUKEP13k';
const TARGET_SHEET_NAME = 'Campistas_Operacion';
const ALERT_SHEET_NAME = 'Alertas_Nuevos_Campistas';

function normalizeKey_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function yesNo_(value) {
  const text = normalizeKey_(value);
  if (text === 'si') return 'Sí';
  if (text === 'no') return 'No';
  return String(value || '').trim() || 'No especificado';
}

function splitEmergencyContacts_(text) {
  const raw = String(text || '').trim();
  if (!raw) return ['', ''];
  const chunks = raw.split(/\s{2,}|\s*\/\s*/).map((item) => item.trim()).filter(Boolean);
  const contacts = [];
  chunks.forEach((chunk) => {
    const phones = chunk.match(/(?:\+?593\s*)?(?:0?9\d[\d\s.-]{6,}\d)/g) || [];
    let name = chunk.replace(/(?:\+?593\s*)?(?:0?9\d[\d\s.-]{6,}\d)/g, '');
    name = name.replace(/[:\-\/]+/g, ' ').replace(/\s+/g, ' ').trim();
    phones.forEach((phone) => contacts.push(`${name} ${phone.replace(/\D+/g, '')}`.trim()));
  });
  if (contacts.length === 0) {
    const digits = raw.replace(/\D+/g, ' ').match(/\d{7,}/g) || [];
    digits.forEach((phone) => contacts.push(phone));
  }
  return [contacts[0] || '', contacts[1] || ''];
}

function getPaymentStatusMap_() {
  const ss = SpreadsheetApp.openById('1N1gUvlJhudApEbYrnPePk9k43Ujo5IVl1fqLExjxeNI');
  const sheet = ss.getSheetByName('Registro UP 🆙');
  const values = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 2; i < values.length; i++) {
    const row = values[i];
    const name = String(row[1] || '').trim();
    if (!name) continue;
    const amount = Number(String(row[2] || '').replace(/[$,]/g, '')) || 0;
    const pending = Number(String(row[3] || '').replace(/[$,]/g, '')) || 0;
    const percentage = Math.max(0, Math.min(100, 100 - pending));
    map[normalizeKey_(name)] = {
      status: pending <= 0 ? 'pagado' : (amount > 0 ? 'abonado' : 'no_pagado'),
      percentage,
      amount,
      pending,
    };
  }
  return map;
}

function syncCampistasOperacion() {
  const sourceSs = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const sourceSheet = sourceSs.getSheetByName(SOURCE_SHEET_NAME);
  const targetSs = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const targetSheet = targetSs.getSheetByName(TARGET_SHEET_NAME);
  const alertSheet = targetSs.getSheetByName(ALERT_SHEET_NAME);
  const sourceValues = sourceSheet.getDataRange().getValues();
  const targetValues = targetSheet.getDataRange().getValues();
  const existingIds = new Set(targetValues.slice(1).map((row) => String(row[0] || '').trim()).filter(Boolean));
  const paymentStatusMap = getPaymentStatusMap_();
  const newRows = [];
  const alertRows = [];
  const now = new Date();

  for (let i = 1; i < sourceValues.length; i++) {
    const row = sourceValues[i];
    const id = String(row[2] || '').trim();
    if (!id || existingIds.has(id)) continue;
    const contacts = splitEmergencyContacts_(row[8]);
    const name = String(row[1] || '').trim();
    newRows.push([
      id,
      name,
      id,
      String(row[4] || '').trim(),
      String(row[6] || '').trim(),
      contacts[0],
      contacts[1],
      yesNo_(row[11]),
      String(row[12] || '').trim(),
      yesNo_(row[14]),
      String(row[15] || '').trim(),
      yesNo_(row[16]),
      String(row[17] || '').trim(),
      yesNo_(row[18]),
      String(row[19] || '').trim(),
      String(row[20] || '').trim(),
      (paymentStatusMap[normalizeKey_(name)] && paymentStatusMap[normalizeKey_(name)].status) || 'no_pagado',
      (paymentStatusMap[normalizeKey_(name)] && paymentStatusMap[normalizeKey_(name)].percentage) || 0,
      (paymentStatusMap[normalizeKey_(name)] && paymentStatusMap[normalizeKey_(name)].amount) || 0,
      (paymentStatusMap[normalizeKey_(name)] && paymentStatusMap[normalizeKey_(name)].pending) || 100,
      i + 1,
      ''
    ]);
    alertRows.push([`alert-${id}-${now.getTime()}`, id, name, now, 'pendiente', 'pagos']);
  }

  if (newRows.length > 0) {
    targetSheet.getRange(targetSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    alertSheet.getRange(alertSheet.getLastRow() + 1, 1, alertRows.length, alertRows[0].length).setValues(alertRows);
  }
}

function onFormSubmitSync(e) {
  syncCampistasOperacion();
}
