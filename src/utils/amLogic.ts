export interface AmVerifyData {
  email: string;
  uid: string;
  plan: string;
  valid_until: string;
}

export interface AmVerifyResponse {
  status: boolean;
  creator: string;
  developer?: string;
  data?: AmVerifyData;
  limit?: string;
  message?: string;
}

export interface AmSendResponse {
  status: boolean;
  creator?: string;
  message?: string;
  limit?: string;
}

export interface EmailQuMessage {
  id: string | number;
  from: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  received_at: string;
  extractedMagicLink?: string | null;
}

export interface ParsedMagicLinkInfo {
  isValid: boolean;
  cleanUrl: string;
  host: string;
  oobCode: string | null;
  apiKey: string | null;
  mode: string | null;
  continueUrl: string | null;
  lang: string | null;
  error?: string;
}

export interface ParsedQuotaLimit {
  used: number;
  total: number;
  remaining: number;
  percentage: number;
  windowLabel: string;
  raw: string;
}

export interface ActivationHistoryItem {
  id: string;
  timestamp: string;
  stage: 'sent' | 'verified';
  emailMode: 'personal' | 'random';
  email: string;
  uid: string;
  plan: string;
  validUntil: string;
  creator: string;
  limit: string;
  rawResponse: AmVerifyResponse | AmSendResponse;
}

export const DEVELOPER_NAME = 'Van313 | Official';

export const SAMPLE_MAGIC_LINK =
  'https://alight-creative.firebaseapp.com/__/auth/links?link=https%3A%2F%2Falightcreative.com%2Fauth_action%2F%3FapiKey%3DAIzaSyDrZ9jr_Y16ltSBqsQR5IH6I04FRga6Ki0%26mode%3DsignIn%26oobCode%3DtpcI1MMhIh9Aymvfi4NP45Fo63MmLN1euBTZCH83d_cAAAGhmIi-Ug%26continueUrl%3Dhttps%3A%2F%2Falightcreative.com%3Fui_sid%253D0366624874%2526ui_sd%253D0%26lang%3Den';

export const INITIAL_VERIFY_PLACEHOLDER: AmVerifyResponse = {
  status: true,
  creator: 'Rin imup',
  developer: DEVELOPER_NAME,
  data: {
    email: 'menunggu-aktivasi@emailqu.com',
    uid: 'ZnxdpORrbJSbENfBPgRULyNq3Yz2',
    plan: 'Alight Motion Pro / Member',
    valid_until: '2027-11-01T19:15:07.395Z',
  },
  limit: '5/10 per 24 jam',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Cleans markdown mailto wrappers if user pasted e.g. "[user@domain.com](mailto:user@domain.com)"
 */
export function sanitizeEmailInput(raw: string): string {
  const trimmed = raw.trim();
  const mailtoMatch = trimmed.match(/mailto:([^\s)\]]+)/i);
  if (mailtoMatch && mailtoMatch[1]) {
    return mailtoMatch[1].trim();
  }
  const bracketMatch = trimmed.match(/\[([^\][@]+@[^\][@]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1].trim();
  }
  return trimmed;
}

export function validateEmail(email: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = sanitizeEmailInput(email);
  if (!cleaned) {
    return { valid: false, cleaned: '', error: 'Alamat email wajib diisi atau di-generate terlebih dahulu.' };
  }
  if (!EMAIL_REGEX.test(cleaned)) {
    return { valid: false, cleaned, error: 'Format alamat email tidak valid (contoh: nama@domain.com).' };
  }
  return { valid: true, cleaned };
}

/**
 * Sanitizes and composes a valid EmailQu address from username & domain
 */
export function composeEmailQuAddress(username: string, domain: string): string {
  const cleanUser = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9.-]/g, '');
  if (!cleanUser || !cleanDomain) return '';
  return `${cleanUser}@${cleanDomain}`;
}

/**
 * Extracts an Alight Motion Firebase Auth Magic Link from raw email body_text or body_html
 */
export function extractMagicLinkFromEmailBody(
  bodyText?: string,
  bodyHtml?: string
): string | null {
  const combined = `${bodyHtml || ''}\n${bodyText || ''}`.replace(/&amp;/gi, '&');
  if (!combined.trim()) return null;

  const firebaseMatch = combined.match(
    /https?:\/\/(?:alight-creative\.firebaseapp\.com|alightcreative\.com)\/[^\s"'<>)\]]+/i
  );
  if (firebaseMatch && firebaseMatch[0]) {
    return firebaseMatch[0];
  }

  const oobUrlMatch = combined.match(/https?:\/\/[^\s"'<>)\]]*oobCode=[^\s"'<>)\]]+/i);
  if (oobUrlMatch && oobUrlMatch[0]) {
    return oobUrlMatch[0];
  }

  return null;
}

/**
 * Extracts and inspects an Alight Motion Firebase Auth magic link,
 * handling raw URLs, HTML-escaped "&amp;", or text blocks containing a link.
 */
export function inspectMagicLink(rawInput: string): ParsedMagicLinkInfo {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      cleanUrl: '',
      host: '',
      oobCode: null,
      apiKey: null,
      mode: null,
      continueUrl: null,
      lang: null,
      error: 'Tautan Magic Link wajib diisi.',
    };
  }

  const unescaped = trimmed.replace(/&amp;/gi, '&');
  const urlMatch = unescaped.match(/https?:\/\/[^\s"'<>)\]]+/i);
  const candidate = urlMatch ? urlMatch[0] : unescaped;

  let parsedOuter: URL;
  try {
    parsedOuter = new URL(candidate);
  } catch {
    return {
      isValid: false,
      cleanUrl: candidate,
      host: '',
      oobCode: null,
      apiKey: null,
      mode: null,
      continueUrl: null,
      lang: null,
      error: 'Format URL Magic Link tidak valid. Pastikan diawali https://',
    };
  }

  if (parsedOuter.protocol !== 'https:' && parsedOuter.protocol !== 'http:') {
    return {
      isValid: false,
      cleanUrl: candidate,
      host: parsedOuter.host,
      oobCode: null,
      apiKey: null,
      mode: null,
      continueUrl: null,
      lang: null,
      error: 'Magic Link harus menggunakan protokol HTTP/HTTPS.',
    };
  }

  let oobCode = parsedOuter.searchParams.get('oobCode');
  let apiKey = parsedOuter.searchParams.get('apiKey');
  let mode = parsedOuter.searchParams.get('mode');
  let continueUrl = parsedOuter.searchParams.get('continueUrl');
  let lang = parsedOuter.searchParams.get('lang');

  const nestedLinkParam = parsedOuter.searchParams.get('link');
  if (nestedLinkParam) {
    let decodedNested = nestedLinkParam;
    for (let i = 0; i < 2; i++) {
      try {
        if (
          decodedNested.includes('%3A') ||
          decodedNested.includes('%26') ||
          decodedNested.includes('%3D')
        ) {
          decodedNested = decodeURIComponent(decodedNested);
        }
      } catch {
        break;
      }
    }

    try {
      const innerUrl = new URL(decodedNested);
      oobCode = oobCode || innerUrl.searchParams.get('oobCode');
      apiKey = apiKey || innerUrl.searchParams.get('apiKey');
      mode = mode || innerUrl.searchParams.get('mode');
      continueUrl = continueUrl || innerUrl.searchParams.get('continueUrl');
      lang = lang || innerUrl.searchParams.get('lang');
    } catch {
      const oobMatch = decodedNested.match(/[?&]oobCode=([^&#]+)/);
      const keyMatch = decodedNested.match(/[?&]apiKey=([^&#]+)/);
      const modeMatch = decodedNested.match(/[?&]mode=([^&#]+)/);
      if (oobMatch) oobCode = oobCode || oobMatch[1];
      if (keyMatch) apiKey = apiKey || keyMatch[1];
      if (modeMatch) mode = mode || modeMatch[1];
    }
  }

  return {
    isValid: true,
    cleanUrl: parsedOuter.toString(),
    host: parsedOuter.host,
    oobCode,
    apiKey,
    mode: mode || 'signIn',
    continueUrl,
    lang: lang || 'en',
  };
}

/**
 * Builds the exact external endpoint URLs for apiii-xrina.my.id
 */
export function buildAmSendEndpoint(email: string): string {
  const cleaned = sanitizeEmailInput(email) || 'email-anda@domain.com';
  return `https://apiii-xrina.my.id/tools/am-send?email=${encodeURIComponent(cleaned)}`;
}

export function buildAmVerifyEndpoint(email: string, magicLink: string): string {
  const cleanedEmail = sanitizeEmailInput(email) || 'email-anda@domain.com';
  const inspected = inspectMagicLink(magicLink);
  const finalLink = inspected.cleanUrl || magicLink.trim() || SAMPLE_MAGIC_LINK;
  return `https://apiii-xrina.my.id/tools/am-verify?email=${encodeURIComponent(cleanedEmail)}&magicLink=${encodeURIComponent(finalLink)}`;
}

/**
 * Parses a limit string like "5/10 per 24 jam" into structured numbers
 */
export function parseQuotaLimit(limitStr?: string): ParsedQuotaLimit {
  const raw = (limitStr || '5/10 per 24 jam').trim();
  const match = raw.match(/(\d+)\s*\/\s*(\d+)\s*(.*)/);
  if (!match) {
    return {
      used: 5,
      total: 10,
      remaining: 5,
      percentage: 50,
      windowLabel: 'per 24 jam',
      raw,
    };
  }

  const used = Number.parseInt(match[1], 10);
  const total = Math.max(1, Number.parseInt(match[2], 10));
  const remaining = Math.max(0, total - used);
  const percentage = Math.min(100, Math.max(0, Math.round((used / total) * 100)));
  const windowLabel = (match[3] || 'per 24 jam').trim();

  return {
    used,
    total,
    remaining,
    percentage,
    windowLabel,
    raw,
  };
}

/**
 * Calculates remaining days and human-readable Indonesian validity date
 */
export function formatValidityInfo(
  validUntilIso: string,
  referenceNow: Date = new Date('2026-11-01T11:25:25-08:00')
): {
  formattedDate: string;
  daysRemaining: number;
  isExpired: boolean;
} {
  const target = new Date(validUntilIso);
  if (Number.isNaN(target.getTime())) {
    return {
      formattedDate: validUntilIso || '-',
      daysRemaining: 0,
      isExpired: false,
    };
  }

  const diffMs = target.getTime() - referenceNow.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(target);

  return {
    formattedDate,
    daysRemaining,
    isExpired,
  };
}

/**
 * Formats a clean WhatsApp / Telegram / Clipboard shareable receipt text for an activated AM Pro account
 */
export function formatShareableReceiptText(result: AmVerifyResponse): string {
  const data = result.data || {
    email: 'menunggu-aktivasi@emailqu.com',
    uid: 'ZnxdpORrbJSbENfBPgRULyNq3Yz2',
    plan: 'Alight Motion Pro / Member',
    valid_until: '2027-11-01T19:15:07.395Z',
  };
  const validity = formatValidityInfo(data.valid_until);
  return [
    '=== BUKTI AKTIVASI ALIGHT MOTION PRO ===',
    `Status       : ${result.status ? 'AKTIF (VERIFIED)' : 'GAGAL'}`,
    `Email Akun   : ${data.email}`,
    `Firebase UID : ${data.uid}`,
    `Paket        : ${data.plan}`,
    `Masa Aktif   : ${validity.formattedDate} (${validity.daysRemaining} Hari)`,
    `Kuota Server : ${result.limit || '5/10 per 24 jam'}`,
    `Creator API  : ${result.creator || 'Rin imup'}`,
    `Developer    : ${DEVELOPER_NAME}`,
    '========================================',
  ].join('\n');
}

/**
 * Exports activation history items to CSV string
 */
export function exportHistoryToCsv(items: ActivationHistoryItem[]): string {
  const header = ['ID', 'Timestamp', 'Stage', 'Mode', 'Email', 'UID', 'Plan', 'ValidUntil', 'Creator', 'Limit'];
  const rows = items.map((item) =>
    [
      item.id,
      item.timestamp,
      item.stage,
      item.emailMode,
      item.email,
      item.uid,
      item.plan,
      item.validUntil,
      item.creator,
      item.limit,
    ]
      .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

/**
 * Generates a deterministic 15x15 visual verification matrix pattern (with finder corners) from UID + Email
 */
export function generateVerificationMatrix(seed: string): boolean[][] {
  const size = 15;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  let hash = 2166136261;
  const cleanSeed = seed || 'Van313-Official';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const charCode = cleanSeed.charCodeAt((r * size + c) % cleanSeed.length);
      hash ^= charCode + r * 31 + c * 17;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) % 10) < 5;
    }
  }

  return grid;
}
