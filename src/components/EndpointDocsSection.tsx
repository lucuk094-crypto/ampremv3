import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Server,
  Globe,
  FileJson,
  ArrowUpRight,
  Inbox,
} from 'lucide-react';
import {
  buildAmSendEndpoint,
  buildAmVerifyEndpoint,
  DEVELOPER_NAME,
  SAMPLE_MAGIC_LINK,
} from '../utils/amLogic';

interface EndpointDocsSectionProps {
  currentEmail: string;
  currentMagicLink: string;
}

export const EndpointDocsSection: React.FC<EndpointDocsSectionProps> = ({
  currentEmail,
  currentMagicLink,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const effectiveEmail = currentEmail.trim() || 'pengguna@screensyit.id';
  const effectiveLink = currentMagicLink.trim() || SAMPLE_MAGIC_LINK;

  const sendUrl = buildAmSendEndpoint(effectiveEmail);
  const verifyUrl = buildAmVerifyEndpoint(effectiveEmail, effectiveLink);
  const emailQuInboxUrl = `https://emailqu.com/api/public/emails/${encodeURIComponent(effectiveEmail)}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const vercelJsonSnippet = `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}`;

  return (
    <section
      id="endpoints"
      aria-labelledby="heading-endpoints"
      className="bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-200 brutal-shadow-lg p-5 sm:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-2 border-zinc-950 dark:border-zinc-700">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <span>DOKUMENTASI TEKNIS</span>
            <span aria-hidden="true">·</span>
            <span>DEVELOPER: {DEVELOPER_NAME}</span>
          </div>
          <h2
            id="heading-endpoints"
            className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight mt-1"
          >
            04. Spesifikasi Endpoint API &amp; Konfigurasi Vercel
          </h2>
        </div>

        <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          Integrasi: <span className="font-bold text-zinc-950 dark:text-[#B8FF01]">apiii-xrina.my.id</span> &amp;{' '}
          <span className="font-bold text-zinc-950 dark:text-[#B8FF01]">emailqu.com</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Endpoint 1: am-send */}
        <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-[#F4F3EF] dark:bg-zinc-800 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01] shrink-0" />
                <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white">
                  01. Kirim Tautan (am-send)
                </h3>
              </div>
              <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-300">
                GET
              </span>
            </div>

            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Mengirimkan Magic Link Alight Motion ke alamat Email Pribadi maupun Email Random dari EmailQu.com.
            </p>

            <div className="bg-zinc-950 text-zinc-100 p-3 border-2 border-zinc-950 font-mono text-xs overflow-x-auto">
              <p className="text-zinc-400 mb-1">URL Endpoint:</p>
              <p className="text-[#B8FF01] break-all select-all">{sendUrl}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              Proxy: /api/am-send
            </span>
            <button
              type="button"
              onClick={() => handleCopy(sendUrl, 'send-url')}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'send-url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Endpoint 2: emailqu.com */}
        <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-[#F4F3EF] dark:bg-zinc-800 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01] shrink-0" />
                <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white">
                  02. Generator &amp; Inbox (emailqu.com)
                </h3>
              </div>
              <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-300">
                GET
              </span>
            </div>

            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Mengambil username random, daftar domain terverifikasi, serta notifikasi kotak masuk langsung dari <code className="font-mono font-semibold">emailqu.com</code>.
            </p>

            <div className="bg-zinc-950 text-zinc-100 p-3 border-2 border-zinc-950 font-mono text-xs overflow-x-auto">
              <p className="text-zinc-400 mb-1">URL Inbox EmailQu:</p>
              <p className="text-[#B8FF01] break-all select-all">{emailQuInboxUrl}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              Proxy: /api/emailqu
            </span>
            <button
              type="button"
              onClick={() => handleCopy(emailQuInboxUrl, 'emailqu-url')}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'emailqu-url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Endpoint 3: am-verify */}
        <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-[#F4F3EF] dark:bg-zinc-800 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01] shrink-0" />
                <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white">
                  03. Verifikasi Pro (am-verify)
                </h3>
              </div>
              <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-300">
                GET
              </span>
            </div>

            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Memvalidasi parameter <code className="font-mono font-semibold">oobCode</code> dari tautan masuk dan mengaktifkan paket <strong>Alight Motion Pro / Member</strong>.
            </p>

            <div className="bg-zinc-950 text-zinc-100 p-3 border-2 border-zinc-950 font-mono text-xs overflow-x-auto">
              <p className="text-zinc-400 mb-1">URL Endpoint:</p>
              <p className="text-[#B8FF01] break-all select-all line-clamp-2">
                {verifyUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              Proxy: /api/am-verify
            </span>
            <button
              type="button"
              onClick={() => handleCopy(verifyUrl, 'verify-url')}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'verify-url' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Vercel Deployment Blueprint */}
      <div className="mt-6 border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-zinc-950 dark:border-zinc-700">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-zinc-950 dark:text-[#B8FF01] shrink-0" />
            <div>
              <h3 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
                Arsitektur Deployment Vercel ({DEVELOPER_NAME})
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Dilengkapi Serverless Functions <code className="font-mono font-semibold">/api/am-send.js</code>, <code className="font-mono font-semibold">/api/am-verify.js</code>, dan <code className="font-mono font-semibold">/api/emailqu.js</code>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(vercelJsonSnippet, 'vercel-json')}
            className="px-3.5 py-2 bg-[#B8FF01] border-2 border-zinc-950 text-xs font-bold text-zinc-950 flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedKey === 'vercel-json' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>vercel.json Tersalin</span>
              </>
            ) : (
              <>
                <FileJson className="w-3.5 h-3.5" />
                <span>Salin Konfigurasi vercel.json</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3.5 bg-[#F4F3EF] dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-700">
            <div className="font-display font-bold text-sm text-zinc-950 dark:text-white flex items-center justify-between">
              <span>01. Push ke GitHub / Git</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01]" />
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
              Unggah seluruh struktur project ke repositori GitHub Anda. Folder <code className="font-mono">/api</code> otomatis dikenali oleh Vercel sebagai Serverless Functions.
            </p>
          </div>

          <div className="p-3.5 bg-[#F4F3EF] dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-700">
            <div className="font-display font-bold text-sm text-zinc-950 dark:text-white flex items-center justify-between">
              <span>02. Import Project di Vercel</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01]" />
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
              Pilih preset framework <strong>Vite</strong> dengan Build Command <code className="font-mono">npm run build</code> dan Output Directory <code className="font-mono">dist</code>.
            </p>
          </div>

          <div className="p-3.5 bg-[#F4F3EF] dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-700">
            <div className="font-display font-bold text-sm text-zinc-950 dark:text-white flex items-center justify-between">
              <span>03. Sinkronisasi EmailQu &amp; API</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01]" />
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
              Seluruh komunikasi ke <code className="font-mono">apiii-xrina.my.id</code> dan <code className="font-mono">emailqu.com</code> berjalan melalui rute serverless tanpa kendala CORS.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
