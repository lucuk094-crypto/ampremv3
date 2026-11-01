import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint for Step 1: am-send
  app.get('/api/am-send', async (req, res) => {
    const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
    if (!email) {
      res.status(400).json({ status: false, message: 'Parameter email wajib diisi.' });
      return;
    }

    const targetUrl = `https://apiii-xrina.my.id/tools/am-send?email=${encodeURIComponent(email)}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'AM-Prem-Brutalist-Studio/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const rawText = await upstreamRes.text();
      try {
        const jsonData = JSON.parse(rawText);
        res.status(200).json({
          ...jsonData,
          upstreamStatus: upstreamRes.status,
        });
      } catch {
        res.status(200).json({
          status: upstreamRes.ok,
          creator: 'Rin imup',
          upstreamStatus: upstreamRes.status,
          message: rawText || 'Magic link dikirim ke alamat email.',
        });
      }
    } catch (error) {
      res.status(200).json({
        status: false,
        message: error instanceof Error ? error.message : 'Gagal menghubungi endpoint apiii-xrina.my.id',
      });
    }
  });

  // Proxy endpoint for Step 2: am-verify
  app.get('/api/am-verify', async (req, res) => {
    const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
    const magicLink = typeof req.query.magicLink === 'string' ? req.query.magicLink.trim() : '';
    if (!email || !magicLink) {
      res.status(400).json({ status: false, message: 'Parameter email dan magicLink wajib diisi.' });
      return;
    }

    const targetUrl = `https://apiii-xrina.my.id/tools/am-verify?email=${encodeURIComponent(email)}&magicLink=${encodeURIComponent(magicLink)}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'AM-Prem-Brutalist-Studio/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const rawText = await upstreamRes.text();
      try {
        const jsonData = JSON.parse(rawText);
        res.status(200).json({
          ...jsonData,
          upstreamStatus: upstreamRes.status,
        });
      } catch {
        res.status(200).json({
          status: upstreamRes.ok,
          creator: 'Rin imup',
          upstreamStatus: upstreamRes.status,
          message: rawText || 'Verifikasi selesai.',
        });
      }
    } catch (error) {
      res.status(200).json({
        status: false,
        message: error instanceof Error ? error.message : 'Gagal menghubungi endpoint apiii-xrina.my.id',
      });
    }
  });

  // Proxy endpoint for EmailQu.com (Random Email Generator & Live Inbox Notifications)
  const FALLBACK_DOMAINS = ['screensyit.id', 'digboost.fun', 'shinstore.site', 'ccsaku.shop'];
  app.get('/api/emailqu', async (req, res) => {
    const action = typeof req.query.action === 'string' ? req.query.action : 'generate';

    try {
      if (action === 'domains') {
        const domRes = await fetch('https://emailqu.com/api/domains', {
          headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
        });
        const domData = (await domRes.json()) as { domains?: Array<{ domain: string; is_verified?: boolean }> };
        const verifiedDomains = Array.isArray(domData?.domains)
          ? domData.domains
              .filter((d) => d && d.is_verified && d.domain)
              .slice(0, 30)
              .map((d) => d.domain)
          : FALLBACK_DOMAINS;

        res.json({
          success: true,
          domains: verifiedDomains.length > 0 ? verifiedDomains : FALLBACK_DOMAINS,
        });
        return;
      }

      if (action === 'inbox') {
        const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
        if (!email) {
          res.status(400).json({
            success: false,
            message: 'Parameter email wajib diisi untuk mengecek inbox EmailQu.',
          });
          return;
        }

        const inboxRes = await fetch(
          `https://emailqu.com/api/public/emails/${encodeURIComponent(email)}`,
          {
            headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
          }
        );
        const inboxData = (await inboxRes.json()) as { emails?: unknown[] };
        res.json({
          success: true,
          address: email,
          count: Array.isArray(inboxData?.emails) ? inboxData.emails.length : 0,
          emails: Array.isArray(inboxData?.emails) ? inboxData.emails : [],
        });
        return;
      }

      const customDomain = typeof req.query.domain === 'string' ? req.query.domain.trim() : '';
      const customUser = typeof req.query.username === 'string' ? req.query.username.trim() : '';

      const [userRes, domRes] = await Promise.allSettled([
        customUser
          ? Promise.resolve({ username: customUser })
          : fetch('https://emailqu.com/api/random-username', {
              headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
            }).then((r) => r.json() as Promise<{ username?: string }>),
        fetch('https://emailqu.com/api/domains', {
          headers: { Accept: 'application/json', 'User-Agent': 'AM-Prem-Studio-Van313/1.0' },
        }).then((r) => r.json() as Promise<{ domains?: Array<{ domain: string; is_verified?: boolean }> }>),
      ]);

      const fallbackUser = `van313user${Math.floor(100 + Math.random() * 900)}`;
      const username =
        userRes.status === 'fulfilled' && userRes.value?.username
          ? String(userRes.value.username).toLowerCase().replace(/[^a-z0-9._-]/g, '')
          : fallbackUser;

      const verifiedDomains =
        domRes.status === 'fulfilled' && Array.isArray(domRes.value?.domains)
          ? domRes.value.domains
              .filter((d) => d && d.is_verified && d.domain)
              .slice(0, 25)
              .map((d) => d.domain)
          : FALLBACK_DOMAINS;

      const domainList = verifiedDomains.length > 0 ? verifiedDomains : FALLBACK_DOMAINS;
      const chosenDomain =
        customDomain || domainList[Math.floor(Math.random() * Math.min(8, domainList.length))];

      const email = `${username}@${chosenDomain}`;
      res.json({
        success: true,
        email,
        username,
        domain: chosenDomain,
        domains: domainList,
      });
    } catch {
      const username = `van313user${Math.floor(100 + Math.random() * 900)}`;
      const domain = FALLBACK_DOMAINS[0];
      res.json({
        success: true,
        email: `${username}@${domain}`,
        username,
        domain,
        domains: FALLBACK_DOMAINS,
        fallback: true,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
