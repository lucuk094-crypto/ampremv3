const FALLBACK_DOMAINS = [
  'screensyit.id',
  'digboost.fun',
  'shinstore.site',
  'ccsaku.shop',
];

function generateFallbackUsername() {
  const prefixes = ['bright', 'cyber', 'nova', 'pixel', 'swift', 'turbo', 'velo', 'zenith'];
  const nouns = ['studio', 'motion', 'wave', 'spark', 'craft', 'core', 'pulse', 'orbit'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${p}${n}${num}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = typeof req.query?.action === 'string' ? req.query.action : 'generate';

  try {
    if (action === 'domains') {
      const domRes = await fetch('https://emailqu.com/api/domains', {
        headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
      });
      const domData = await domRes.json();
      const verifiedDomains = Array.isArray(domData?.domains)
        ? domData.domains
            .filter((d) => d && d.is_verified && d.domain)
            .slice(0, 30)
            .map((d) => d.domain)
        : FALLBACK_DOMAINS;

      return res.status(200).json({
        success: true,
        domains: verifiedDomains.length > 0 ? verifiedDomains : FALLBACK_DOMAINS,
      });
    }

    if (action === 'inbox') {
      const email = typeof req.query?.email === 'string' ? req.query.email.trim() : '';
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Parameter email wajib diisi untuk mengecek inbox EmailQu.',
        });
      }

      const inboxRes = await fetch(
        `https://emailqu.com/api/public/emails/${encodeURIComponent(email)}`,
        {
          headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
        }
      );
      const inboxData = await inboxRes.json();
      return res.status(200).json({
        success: true,
        address: email,
        count: Array.isArray(inboxData?.emails) ? inboxData.emails.length : 0,
        emails: Array.isArray(inboxData?.emails) ? inboxData.emails : [],
      });
    }

    // Default action === 'generate'
    const customDomain = typeof req.query?.domain === 'string' ? req.query.domain.trim() : '';
    const customUser = typeof req.query?.username === 'string' ? req.query.username.trim() : '';

    const [userRes, domRes] = await Promise.allSettled([
      customUser
        ? Promise.resolve({ username: customUser })
        : fetch('https://emailqu.com/api/random-username', {
            headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
          }).then((r) => r.json()),
      fetch('https://emailqu.com/api/domains', {
        headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
      }).then((r) => r.json()),
    ]);

    const username =
      userRes.status === 'fulfilled' && userRes.value?.username
        ? String(userRes.value.username).toLowerCase().replace(/[^a-z0-9._-]/g, '')
        : generateFallbackUsername();

    const verifiedDomains =
      domRes.status === 'fulfilled' && Array.isArray(domRes.value?.domains)
        ? domRes.value.domains
            .filter((d) => d && d.is_verified && d.domain)
            .slice(0, 25)
            .map((d) => d.domain)
        : FALLBACK_DOMAINS;

    const domainList = verifiedDomains.length > 0 ? verifiedDomains : FALLBACK_DOMAINS;
    const chosenDomain =
      customDomain && domainList.includes(customDomain)
        ? customDomain
        : customDomain || domainList[Math.floor(Math.random() * Math.min(8, domainList.length))];

    const email = `${username}@${chosenDomain}`;

    return res.status(200).json({
      success: true,
      email,
      username,
      domain: chosenDomain,
      domains: domainList,
    });
  } catch (error) {
    const username = generateFallbackUsername();
    const domain = FALLBACK_DOMAINS[0];
    return res.status(200).json({
      success: true,
      email: `${username}@${domain}`,
      username,
      domain,
      domains: FALLBACK_DOMAINS,
      fallback: true,
      error: error instanceof Error ? error.message : 'Fallback generator used',
    });
  }
}
