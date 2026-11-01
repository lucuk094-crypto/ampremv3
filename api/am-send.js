export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = typeof req.query?.email === 'string' ? req.query.email.trim() : '';
  if (!email) {
    return res.status(400).json({
      status: false,
      message: 'Parameter email wajib diisi.'
    });
  }

  const targetUrl = `https://apiii-xrina.my.id/tools/am-send?email=${encodeURIComponent(email)}`;

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
        message: rawText || 'Magic link berhasil dikirim ke email.'
      });
    }
  } catch (error) {
    return res.status(200).json({
      status: false,
      message: error instanceof Error ? error.message : 'Gagal menghubungi server apiii-xrina.my.id'
    });
  }
}
