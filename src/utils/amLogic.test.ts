import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  inspectMagicLink,
  buildAmSendEndpoint,
  buildAmVerifyEndpoint,
  parseQuotaLimit,
  formatValidityInfo,
  composeEmailQuAddress,
  extractMagicLinkFromEmailBody,
  formatShareableReceiptText,
  exportHistoryToCsv,
  generateVerificationMatrix,
  INITIAL_VERIFY_PLACEHOLDER,
  SAMPLE_MAGIC_LINK,
} from './amLogic';

test('validateEmail accepts valid emails and strips markdown mailto syntax', () => {
  const direct = validateEmail('pengguna99@screensyit.id');
  assert.equal(direct.valid, true);
  assert.equal(direct.cleaned, 'pengguna99@screensyit.id');

  const markdownWrapped = validateEmail('[[user@digboost.fun](mailto:user@digboost.fun)]');
  assert.equal(markdownWrapped.valid, true);
  assert.equal(markdownWrapped.cleaned, 'user@digboost.fun');

  const empty = validateEmail('   ');
  assert.equal(empty.valid, false);
  assert.ok(empty.error);

  const invalid = validateEmail('bukan-email');
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error);
});

test('composeEmailQuAddress builds clean email addresses from username and domain', () => {
  assert.equal(composeEmailQuAddress('BrightBee71', 'ccsaku.shop'), 'brightbee71@ccsaku.shop');
  assert.equal(composeEmailQuAddress('  user_01! ', '@screensyit.id '), 'user_01@screensyit.id');
  assert.equal(composeEmailQuAddress('', 'ccsaku.shop'), '');
});

test('extractMagicLinkFromEmailBody extracts Alight Motion Firebase link from HTML or plain text', () => {
  const htmlSample = `
    <div>
      <p>Sign in to Alight Motion:</p>
      <a href="${SAMPLE_MAGIC_LINK.replace(/&/g, '&amp;')}">Sign In</a>
    </div>
  `;
  const extracted = extractMagicLinkFromEmailBody(undefined, htmlSample);
  assert.ok(extracted);
  assert.ok(extracted.startsWith('https://alight-creative.firebaseapp.com/__/auth/links'));
});

test('inspectMagicLink extracts oobCode, apiKey, and mode from double-encoded Alight Motion magicLink', () => {
  const info = inspectMagicLink(SAMPLE_MAGIC_LINK);
  assert.equal(info.isValid, true);
  assert.equal(info.host, 'alight-creative.firebaseapp.com');
  assert.equal(info.oobCode, 'tpcI1MMhIh9Aymvfi4NP45Fo63MmLN1euBTZCH83d_cAAAGhmIi-Ug');
  assert.equal(info.apiKey, 'AIzaSyDrZ9jr_Y16ltSBqsQR5IH6I04FRga6Ki0');
  assert.equal(info.mode, 'signIn');
});

test('buildAmSendEndpoint and buildAmVerifyEndpoint construct properly encoded URLs', () => {
  const sendUrl = buildAmSendEndpoint('user@screensyit.id');
  assert.equal(sendUrl, 'https://apiii-xrina.my.id/tools/am-send?email=user%40screensyit.id');

  const verifyUrl = buildAmVerifyEndpoint('user@screensyit.id', SAMPLE_MAGIC_LINK);
  assert.ok(verifyUrl.startsWith('https://apiii-xrina.my.id/tools/am-verify?email=user%40screensyit.id&magicLink='));
  assert.ok(verifyUrl.includes('alight-creative.firebaseapp.com'));
});

test('parseQuotaLimit parses "5/10 per 24 jam" accurately', () => {
  const quota = parseQuotaLimit('5/10 per 24 jam');
  assert.equal(quota.used, 5);
  assert.equal(quota.total, 10);
  assert.equal(quota.remaining, 5);
  assert.equal(quota.percentage, 50);
  assert.equal(quota.windowLabel, 'per 24 jam');
});

test('formatValidityInfo computes days remaining accurately against reference date', () => {
  const refDate = new Date('2026-11-01T19:15:07.395Z');
  const validity = formatValidityInfo('2027-11-01T19:15:07.395Z', refDate);
  assert.equal(validity.daysRemaining, 365);
  assert.equal(validity.isExpired, false);
});

test('formatShareableReceiptText, exportHistoryToCsv, and generateVerificationMatrix work properly', () => {
  const text = formatShareableReceiptText(INITIAL_VERIFY_PLACEHOLDER);
  assert.ok(text.includes('Van313 | Official'));
  assert.ok(text.includes('Alight Motion Pro / Member'));

  const csv = exportHistoryToCsv([
    {
      id: '1',
      timestamp: '2026-11-01T19:15:07.395Z',
      stage: 'verified',
      emailMode: 'random',
      email: 'test@screensyit.id',
      uid: 'Znxdp123',
      plan: 'Alight Motion Pro / Member',
      validUntil: '2027-11-01T19:15:07.395Z',
      creator: 'Rin imup',
      limit: '5/10 per 24 jam',
      rawResponse: INITIAL_VERIFY_PLACEHOLDER,
    },
  ]);
  assert.ok(csv.includes('test@screensyit.id'));

  const matrix = generateVerificationMatrix('Znxdp123');
  assert.equal(matrix.length, 15);
  assert.equal(matrix[0].length, 15);
  assert.equal(matrix[0][0], true);
});
