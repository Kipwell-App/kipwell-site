/**
 * Kipwell waitlist: receives signups from the join form on kipwell.co
 * and saves them to the "Signups" tab of the Google Sheet this script is attached to,
 * then emails an alert to ALERT_TO.
 *
 * Setup (see README.md, "Signups"):
 * 1. Make a Google Sheet. Extensions > Apps Script. Replace the starter code with this file. Save.
 * 2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy and authorize.
 * 3. Copy the web app URL (ends in /exec) into assets/js/config.js.
 * After changing this code, use Deploy > Manage deployments > Edit > New version, so the URL stays the same.
 */

var SHEET_NAME = 'Signups';
var HEADERS = ['Name', 'Studio', 'Email', 'What they teach', 'Agreed to emails', 'Agreed at', 'Created', 'Updated'];
var PROGRAMS = ['Gymnastics', 'Dance', 'Swim', 'Cheer', 'Martial arts', 'Something else'];
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Who gets an email for each signup. Leave empty to turn the alert off.
var ALERT_TO = 'caseywfrancis+landingpage@gmail.com';

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply_({ ok: false, error: 'bad_request' });
  }

  // Spam trap: a filled-in hidden field means a bot. Say yes, save nothing.
  if (data.website) return reply_({ ok: true });

  var name = clean_(data.name, 100);
  var studio = clean_(data.studio, 150);
  var email = String(data.email || '').trim().toLowerCase().slice(0, 254);
  var program = PROGRAMS.indexOf(data.program) >= 0 ? data.program : 'Something else';
  var consent = data.consent === true;

  if (!name || !studio || !EMAIL_RE.test(email) || !consent) {
    return reply_({ ok: false, error: 'invalid' });
  }

  var isNew = true;
  var sheetUrl = '';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = sheet_();
    sheetUrl = sheet.getParent().getUrl();
    var now = new Date();
    var last = sheet.getLastRow();
    var emails = last > 1 ? sheet.getRange(2, 3, last - 1, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); }) : [];
    var i = emails.indexOf(email);
    if (i >= 0) {
      // Same email again: update the existing row instead of adding a second one.
      isNew = false;
      var row = i + 2;
      sheet.getRange(row, 1, 1, 2).setValues([[name, studio]]);
      sheet.getRange(row, 4, 1, 3).setValues([[program, 'Yes', now]]);
      sheet.getRange(row, 8).setValue(now);
    } else {
      sheet.appendRow([name, studio, email, program, 'Yes', now, now, now]);
    }
  } finally {
    lock.releaseLock();
  }
  alert_(isNew, name, studio, email, program, sheetUrl);
  return reply_({ ok: true });
}

// Email the owner about the signup. A failed email never fails the signup itself.
function alert_(isNew, name, studio, email, program, sheetUrl) {
  if (!ALERT_TO) return;
  try {
    var subject = (isNew ? 'New Kipwell signup: ' : 'Kipwell signup updated: ') + studio;
    var body = [
      isNew ? 'Someone joined the Kipwell early-access list.' : 'Someone already on the list signed up again; their row was updated.',
      '',
      'Name: ' + name,
      'Studio: ' + studio,
      'Email: ' + email,
      'What they teach: ' + program,
      '',
      'To write to them, click their email address above.',
      ''
    ].join('\n');
    MailApp.sendEmail({ to: ALERT_TO, subject: subject, body: body, name: 'Kipwell signups' });
  } catch (err) {
    console.error('Signup alert failed: ' + err);
  }
}

// A plain GET (someone opening the URL) shows nothing useful.
function doGet() {
  return reply_({ ok: true, note: 'Kipwell signups endpoint. Send a POST.' });
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Trim, cap the length, and stop text that starts with = + - @ from running as a formula.
function clean_(value, max) {
  var s = String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
