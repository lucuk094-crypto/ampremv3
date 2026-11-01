export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = typeof req.query?.email === 'string' ? req.query.email.trim() : '';
  const magicLink = typeof req.query?.magicLink === 'string' ? req.query.magicLink.trim() : '';

  if (!email || !magicLink) {
    return res.status(400).json({
      status: false,
      message: 'Parameter email dan magicLink wajib diisi.'
    });
  }

  const targetUrl = `https://apiii-xrina.my.id/tools/am-verify?email=${encodeURIComponent(email)}&magicLink=${encodeURIComponent(magicLink)}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'AM-Prem-Brutalist-Studio/1.0'
      }
    });

    const rawText = await upstreamRes.text();
    try {
      const jsonData = JSON.parse(rawText);
      return res.status(200).json({
        ...jsonData,
        upstreamStatus: upstreamRes.status,
      });
    } catch {
      return res.status(200).json({
        status: upstreamRes.ok,
        creator: 'Rin imup',
        upstreamStatus: upstreamRes.status,
        message: rawText || 'Verifikasi selesai.',
      });
    }
  } catch (error) {
    return res.status(200).json({
      status: false,
      message: error instanceof Error ? error.message : 'Gagal menghubungi server apiii-xrina.my.id'
    });
  }
}
