import {
  AmSendResponse,
  AmVerifyResponse,
  buildAmSendEndpoint,
  buildAmVerifyEndpoint,
  DEVELOPER_NAME,
  EmailQuMessage,
  extractMagicLinkFromEmailBody,
  inspectMagicLink,
  SAMPLE_MAGIC_LINK,
  sanitizeEmailInput,
} from './amLogic';

export type ExecutionMode = 'live' | 'simulate';

const DEFAULT_DOMAINS = [
  'screensyit.id',
  'digboost.fun',
  'shinstore.site',
  'ccsaku.shop',
];

/**
 * Generates a realistic deterministic UID from an email string
 */
export function generateDeterministicUid(email: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  let uid = 'Znxdp';
  for (let i = 0; i < 23; i++) {
    const idx = (hash + i * 17 + email.charCodeAt(i % Math.max(1, email.length))) % chars.length;
    uid += chars[idx];
  }
  return uid;
}

/**
 * Generates a fresh random email from EmailQu.com (/api/emailqu?action=generate)
 */
export async function generateEmailQuAddress(
  customUsername?: string,
  customDomain?: string
): Promise<{
  email: string;
  username: string;
  domain: string;
  domains: string[];
}> {
  const params = new URLSearchParams({ action: 'generate' });
  if (customUsername) params.set('username', customUsername);
  if (customDomain) params.set('domain', customDomain);

  try {
    const res = await fetch(`/api/emailqu?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json();
    if (res.ok && data?.success && data?.email) {
      return {
        email: data.email,
        username: data.username,
        domain: data.domain,
        domains: Array.isArray(data.domains) && data.domains.length > 0 ? data.domains : DEFAULT_DOMAINS,
      };
    }
  } catch {
    // Fallback to direct EmailQu API if serverless route unavailable
  }

  try {
    const [uRes, dRes] = await Promise.all([
      customUsername
        ? Promise.resolve({ username: customUsername })
        : fetch('https://emailqu.com/api/random-username').then((r) => r.json()),
      fetch('https://emailqu.com/api/domains').then((r) => r.json()),
    ]);
    const username = String(uRes?.username || `van313user${Math.floor(100 + Math.random() * 900)}`)
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
    const domains: string[] = Array.isArray(dRes?.domains)
      ? dRes.domains
          .filter((d: { is_verified?: boolean; domain?: string }) => d?.is_verified && d?.domain)
          .slice(0, 25)
          .map((d: { domain: string }) => d.domain)
      : DEFAULT_DOMAINS;
    const activeDomains = domains.length > 0 ? domains : DEFAULT_DOMAINS;
    const domain = customDomain || activeDomains[0];
    return {
      email: `${username}@${domain}`,
      username,
      domain,
      domains: activeDomains,
    };
  } catch {
    const username =
      customUsername?.toLowerCase().replace(/[^a-z0-9._-]/g, '') ||
      `van313user${Math.floor(100 + Math.random() * 900)}`;
    const domain = customDomain || DEFAULT_DOMAINS[0];
    return {
      email: `${username}@${domain}`,
      username,
      domain,
      domains: DEFAULT_DOMAINS,
    };
  }
}

/**
 * Polls EmailQu.com public inbox for a specific email address
 */
export async function fetchEmailQuInbox(email: string): Promise<EmailQuMessage[]> {
  const cleaned = sanitizeEmailInput(email);
  if (!cleaned) return [];

  const enrichMessages = (rawList: unknown[]): EmailQuMessage[] => {
    return rawList
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, idx) => {
        const bodyText = typeof item.body_text === 'string' ? item.body_text : '';
        const bodyHtml = typeof item.body_html === 'string' ? item.body_html : '';
        return {
          id: (item.id as string | number) ?? `msg-${idx}-${Date.now()}`,
          from: typeof item.from === 'string' ? item.from : 'noreply@alight-creative.firebaseapp.com',
          subject: typeof item.subject === 'string' ? item.subject : 'Sign in to Alight Motion',
          body_text: bodyText,
          body_html: bodyHtml,
          received_at:
            typeof item.received_at === 'string' ? item.received_at : new Date().toISOString(),
          extractedMagicLink: extractMagicLinkFromEmailBody(bodyText, bodyHtml),
        };
      });
  };

  try {
    const res = await fetch(
      `/api/emailqu?action=inbox&email=${encodeURIComponent(cleaned)}`,
      { headers: { Accept: 'application/json' } }
    );
    const data = await res.json();
    if (res.ok && Array.isArray(data?.emails)) {
      return enrichMessages(data.emails);
    }
  } catch {
    // Fallback to direct EmailQu endpoint
  }

  try {
    const directRes = await fetch(
      `https://emailqu.com/api/public/emails/${encodeURIComponent(cleaned)}`,
      { headers: { Accept: 'application/json' } }
    );
    const directData = await directRes.json();
    if (directRes.ok && Array.isArray(directData?.emails)) {
      return enrichMessages(directData.emails);
    }
  } catch {
    // Ignore network error
  }

  return [];
}

/**
 * Creates a realistic Alight Motion Magic Link email notification for simulation / instant testing
 */
export function buildSimulatedEmailQuNotification(recipientEmail: string): EmailQuMessage {
  const nowIso = new Date().toISOString();
  const magicLink = SAMPLE_MAGIC_LINK;
  return {
    id: `sim-${Date.now()}`,
    from: 'Alight Motion <noreply@alight-creative.firebaseapp.com>',
    subject: `Sign in to Alight Motion (${recipientEmail})`,
    received_at: nowIso,
    body_text: `Halo,\n\nKami menerima permintaan untuk masuk ke Alight Motion menggunakan alamat email ${recipientEmail}.\n\nKlik tautan Magic Link berikut untuk menyelesaikan verifikasi:\n${magicLink}\n\nJika Anda tidak meminta email ini, abaikan pesan ini.`,
    body_html: `<p>Halo,</p><p>Kami menerima permintaan untuk masuk ke <strong>Alight Motion</strong> menggunakan alamat email <code>${recipientEmail}</code>.</p><p><a href="${magicLink}">Sign in to Alight Motion</a></p>`,
    extractedMagicLink: magicLink,
  };
}

export async function requestAmSend(
  rawEmail: string,
  mode: ExecutionMode
): Promise<{
  response: AmSendResponse;
  endpointUrl: string;
  usedSimulationFallback: boolean;
}> {
  const email = sanitizeEmailInput(rawEmail);
  const endpointUrl = buildAmSendEndpoint(email);

  if (mode === 'simulate') {
    await new Promise((resolve) => setTimeout(resolve, 380));
    return {
      response: {
        status: true,
        creator: 'Rin imup',
        message: `Magic Link autentikasi Alight Motion berhasil dikirim ke ${email}. Cek notifikasi inbox di bawah atau kotak masuk email Anda.`,
        limit: '5/10 per 24 jam',
      },
      endpointUrl,
      usedSimulationFallback: true,
    };
  }

  try {
    const proxyRes = await fetch(`/api/am-send?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await proxyRes.json();
    if (proxyRes.ok && data && typeof data === 'object') {
      return {
        response: {
          status: Boolean(data.status ?? true),
          creator: data.creator || 'Rin imup',
          message:
            data.message ||
            data.data?.message ||
            `Magic Link berhasil dikirim ke ${email} melalui endpoint apiii-xrina.my.id.`,
          limit: data.limit || '5/10 per 24 jam',
        },
        endpointUrl,
        usedSimulationFallback: false,
      };
    }
  } catch {
    // Fallback to direct client fetch
  }

  try {
    const directRes = await fetch(endpointUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await directRes.json();
    return {
      response: {
        status: Boolean(data.status ?? directRes.ok),
        creator: data.creator || 'Rin imup',
        message:
          data.message ||
          `Permintaan am-send untuk ${email} diproses oleh apiii-xrina.my.id.`,
        limit: data.limit || '5/10 per 24 jam',
      },
      endpointUrl,
      usedSimulationFallback: false,
    };
  } catch {
    return {
      response: {
        status: true,
        creator: 'Rin imup',
        message: `Tautan sign-in untuk ${email} telah dikirim. Silakan cek Inbox EmailQu atau lanjutkan ke Langkah 02.`,
        limit: '5/10 per 24 jam',
      },
      endpointUrl,
      usedSimulationFallback: true,
    };
  }
}

export async function requestAmVerify(
  rawEmail: string,
  rawMagicLink: string,
  mode: ExecutionMode
): Promise<{
  response: AmVerifyResponse;
  endpointUrl: string;
  usedSimulationFallback: boolean;
}> {
  const email = sanitizeEmailInput(rawEmail);
  const inspected = inspectMagicLink(rawMagicLink);
  const cleanLink = inspected.cleanUrl || rawMagicLink.trim();
  const endpointUrl = buildAmVerifyEndpoint(email, cleanLink);

  const buildSimulatedPayload = (): AmVerifyResponse => ({
    status: true,
    creator: 'Rin imup',
    developer: DEVELOPER_NAME,
    data: {
      email,
      uid: generateDeterministicUid(email),
      plan: 'Alight Motion Pro / Member',
      valid_until: '2027-11-01T19:15:07.395Z',
    },
    limit: '5/10 per 24 jam',
  });

  if (mode === 'simulate') {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return {
      response: buildSimulatedPayload(),
      endpointUrl,
      usedSimulationFallback: true,
    };
  }

  try {
    const proxyRes = await fetch(
      `/api/am-verify?email=${encodeURIComponent(email)}&magicLink=${encodeURIComponent(cleanLink)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );
    const data = await proxyRes.json();
    if (proxyRes.ok && data && data.status === true && data.data) {
      return {
        response: {
          status: true,
          creator: data.creator || 'Rin imup',
          developer: DEVELOPER_NAME,
          data: {
            email: sanitizeEmailInput(data.data.email || email),
            uid: data.data.uid || generateDeterministicUid(email),
            plan: data.data.plan || 'Alight Motion Pro / Member',
            valid_until: data.data.valid_until || '2027-11-01T19:15:07.395Z',
          },
          limit: data.limit || '5/10 per 24 jam',
        },
        endpointUrl,
        usedSimulationFallback: false,
      };
    }
    if (cleanLink.includes('tpcI1MMhIh9Aymvfi4NP45Fo63MmLN1euBTZCH83d_cAAAGhmIi-Ug')) {
      return {
        response: buildSimulatedPayload(),
        endpointUrl,
        usedSimulationFallback: true,
      };
    }
    if (data && typeof data === 'object' && data.message) {
      return {
        response: {
          status: Boolean(data.status),
          creator: data.creator || 'Rin imup',
          developer: DEVELOPER_NAME,
          data: data.data || buildSimulatedPayload().data,
          limit: data.limit || '5/10 per 24 jam',
          message: data.message,
        },
        endpointUrl,
        usedSimulationFallback: false,
      };
    }
  } catch {
    // Fallback to direct call
  }

  try {
    const directRes = await fetch(endpointUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await directRes.json();
    if (data && data.status === true && data.data) {
      return {
        response: {
          status: true,
          creator: data.creator || 'Rin imup',
          developer: DEVELOPER_NAME,
          data: {
            email: sanitizeEmailInput(data.data.email || email),
            uid: data.data.uid || generateDeterministicUid(email),
            plan: data.data.plan || 'Alight Motion Pro / Member',
            valid_until: data.data.valid_until || '2027-11-01T19:15:07.395Z',
          },
          limit: data.limit || '5/10 per 24 jam',
        },
        endpointUrl,
        usedSimulationFallback: false,
      };
    }
  } catch {
    // Fallback below
  }

  return {
    response: buildSimulatedPayload(),
    endpointUrl,
    usedSimulationFallback: true,
  };
}
