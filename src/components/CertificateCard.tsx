import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Download,
  Code2,
  CreditCard,
  Clock,
  UserCheck,
  KeyRound,
  Mail,
  Gauge,
  AlertTriangle,
  QrCode,
  Share2,
} from 'lucide-react';
import {
  AmVerifyResponse,
  DEVELOPER_NAME,
  formatShareableReceiptText,
  formatValidityInfo,
  generateVerificationMatrix,
  parseQuotaLimit,
} from '../utils/amLogic';

interface CertificateCardProps {
  result: AmVerifyResponse;
  lastEndpointUrl: string;
  isSimulating?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  result,
  lastEndpointUrl,
  isSimulating,
}) => {
  const [viewTab, setViewTab] = useState<'card' | 'qr' | 'json'>('card');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const data = result.data || {
    email: 'menunggu-aktivasi@emailqu.com',
    uid: 'ZnxdpORrbJSbENfBPgRULyNq3Yz2',
    plan: 'Alight Motion Pro / Member',
    valid_until: '2027-11-01T19:15:07.395Z',
  };

  const quota = parseQuotaLimit(result.limit);
  const validity = formatValidityInfo(data.valid_until);
  const matrix = generateVerificationMatrix(`${data.email}:${data.uid}`);
  const shareText = formatShareableReceiptText(result);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `am-prem-${data.email.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([shareText], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lisensi-ampro-${data.email.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-200 brutal-shadow-lg flex flex-col justify-between h-full">
      {/* Header Bar */}
      <div className="bg-zinc-950 text-white px-4 sm:px-5 py-4 border-b-2 border-zinc-950 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#B8FF01] shrink-0" />
          <h2 className="font-display text-base font-bold tracking-tight">
            Sertifikat Lisensi AM Prem
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div
          role="tablist"
          aria-label="Tampilan hasil verifikasi"
          className="flex items-center bg-zinc-900 p-1 border border-zinc-700"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === 'card'}
            onClick={() => setViewTab('card')}
            className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewTab === 'card'
                ? 'bg-[#B8FF01] text-zinc-950'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kartu Pro</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === 'qr'}
            onClick={() => setViewTab('qr')}
            className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewTab === 'qr'
                ? 'bg-[#B8FF01] text-zinc-950'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Kirim ke HP</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === 'json'}
            onClick={() => setViewTab('json')}
            className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewTab === 'json'
                ? 'bg-[#B8FF01] text-zinc-950'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-6">
        {viewTab === 'card' ? (
          <div key="card-view" className="space-y-5 animate-brutal-in">
            {/* Status & Plan Banner */}
            <div className="bg-[#B8FF01] border-2 border-zinc-950 p-4 brutal-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-zinc-900">
                  {result.status ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-zinc-950 shrink-0" />
                      <span>STATUS: TRUE (AKTIF)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                      <span>STATUS: FALSE (GAGAL)</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>DEV: {DEVELOPER_NAME}</span>
                </div>
                <p
                  data-testid="certificate-plan"
                  className="font-display text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight mt-1"
                >
                  {data.plan}
                </p>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-xs text-zinc-800 block">MASA AKTIF</span>
                <span className="text-lg font-bold text-zinc-950 tabular-nums">
                  {validity.daysRemaining} Hari
                </span>
              </div>
            </div>

            {/* Structured Data Fields Grid */}
            <div className="grid grid-cols-1 gap-3.5">
              {/* Email Row */}
              <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-[#F4F3EF] dark:bg-zinc-800 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <Mail className="w-3.5 h-3.5 text-zinc-900 dark:text-[#B8FF01] shrink-0" />
                    <span>Akun Email Terdaftar</span>
                  </div>
                  <p
                    data-testid="certificate-email"
                    className="font-mono text-sm font-semibold text-zinc-950 dark:text-white truncate mt-1"
                  >
                    {data.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(data.email, 'email')}
                  aria-label="Salin alamat email"
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedField === 'email' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Email</span>
                    </>
                  )}
                </button>
              </div>

              {/* UID Row */}
              <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-[#F4F3EF] dark:bg-zinc-800 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-900 dark:text-[#B8FF01] shrink-0" />
                    <span>Firebase Account UID</span>
                  </div>
                  <p
                    data-testid="certificate-uid"
                    className="font-mono text-sm font-semibold text-zinc-950 dark:text-white truncate mt-1 tabular-nums"
                  >
                    {data.uid}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(data.uid, 'uid')}
                  aria-label="Salin UID"
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedField === 'uid' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin UID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Validity & Developer Split Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-zinc-900 dark:text-[#B8FF01] shrink-0" />
                    <span>Berlaku Hingga (Valid Until)</span>
                  </div>
                  <p className="font-mono text-sm font-bold text-zinc-950 dark:text-white mt-1 tabular-nums">
                    {validity.formattedDate}
                  </p>
                  <p
                    data-testid="certificate-valid-until"
                    className="font-mono text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate tabular-nums"
                  >
                    {data.valid_until}
                  </p>
                </div>

                <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <UserCheck className="w-3.5 h-3.5 text-zinc-900 dark:text-[#B8FF01] shrink-0" />
                    <span>Developer &amp; API Creator</span>
                  </div>
                  <p
                    data-testid="certificate-developer"
                    className="font-display text-base font-extrabold text-zinc-950 dark:text-white mt-1"
                  >
                    {DEVELOPER_NAME}
                  </p>
                  <p
                    data-testid="certificate-creator"
                    className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-mono"
                  >
                    Creator API: {result.creator || 'Rin imup'}
                  </p>
                </div>
              </div>

              {/* Quota / Rate Limit Bar */}
              <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    <Gauge className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01] shrink-0" />
                    <span>Kuota Aktivasi Harian (Rate Limit)</span>
                  </div>
                  <span
                    data-testid="certificate-limit"
                    className="font-mono text-xs font-bold text-zinc-950 dark:text-white tabular-nums"
                  >
                    {quota.raw}
                  </span>
                </div>

                {/* 10-Block Brutalist Segmented Bar */}
                <div
                  className="grid grid-cols-10 gap-1.5 pt-1"
                  aria-label={`Kuota terpakai ${quota.used} dari ${quota.total}`}
                >
                  {Array.from({ length: quota.total }).map((_, idx) => {
                    const isUsed = idx < quota.used;
                    return (
                      <div
                        key={idx}
                        className={`h-3.5 border border-zinc-950 dark:border-zinc-500 transition-colors ${
                          isUsed
                            ? 'bg-zinc-950 dark:bg-zinc-700'
                            : 'bg-[#B8FF01]'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 mt-2 font-mono tabular-nums">
                  <span>Terpakai: {quota.used}/{quota.total}</span>
                  <span>Tersisa: {quota.remaining} slot ({quota.windowLabel})</span>
                </div>
              </div>
            </div>
          </div>
        ) : viewTab === 'qr' ? (
          <div key="qr-view" className="space-y-4 animate-brutal-in">
            <div className="border-2 border-zinc-950 dark:border-zinc-600 bg-[#F4F3EF] dark:bg-zinc-800 p-4 flex flex-col sm:flex-row items-center gap-5">
              {/* Deterministic SVG Verification Matrix */}
              <div className="bg-white p-3 border-2 border-zinc-950 brutal-shadow-sm shrink-0">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 15 15"
                  aria-label="Matriks Verifikasi Lisensi AM Pro"
                  className="block"
                >
                  {matrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width={1}
                          height={1}
                          fill="#09090B"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs font-mono font-bold text-zinc-700 dark:text-[#B8FF01]">
                  TRANSFER AKUN KE HP / WA / TELEGRAM
                </div>
                <h3 className="font-display text-lg font-extrabold text-zinc-950 dark:text-white">
                  Format Bukti Aktivasi Siap Kirim
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Salin teks lisensi lengkap di bawah ini atau unduh file <code className="font-mono">.txt</code> untuk menyimpan detail akun Alight Motion Pro di HP Anda.
                </p>
              </div>
            </div>

            <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-950 text-[#B8FF01] p-3.5 font-mono text-xs overflow-x-auto">
              <pre className="leading-relaxed whitespace-pre-wrap">{shareText}</pre>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCopy(shareText, 'share-text')}
                className="flex-1 py-2.5 px-4 bg-[#B8FF01] border-2 border-zinc-950 text-xs font-extrabold text-zinc-950 inline-flex items-center justify-center gap-1.5 brutal-btn cursor-pointer"
              >
                {copiedField === 'share-text' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Teks Bukti Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Salin Bukti Teks (WA/Telegram)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="py-2.5 px-4 bg-white dark:bg-zinc-800 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white inline-flex items-center justify-center gap-1.5 brutal-btn cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh .TXT</span>
              </button>
            </div>
          </div>
        ) : (
          <div key="json-view" className="space-y-4 animate-brutal-in">
            <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-x-auto">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-zinc-400">
                <span>GET /tools/am-verify — Response 200 OK</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(JSON.stringify(result, null, 2), 'json')
                  }
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs flex items-center gap-1.5 border border-zinc-600 cursor-pointer"
                >
                  {copiedField === 'json' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#B8FF01]" />
                      <span>JSON Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre data-testid="raw-json-pre" className="leading-relaxed text-[#B8FF01]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <div className="border-2 border-zinc-950 dark:border-zinc-700 bg-[#F4F3EF] dark:bg-zinc-800 p-3.5">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Target Endpoint URL Terakhir:
              </p>
              <p className="font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all select-all">
                {lastEndpointUrl}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t-2 border-zinc-950 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2 font-mono">
            <span>{DEVELOPER_NAME}</span>
            <span aria-hidden="true">·</span>
            <span>{isSimulating ? 'Respons Terverifikasi' : 'Sinkronisasi Langsung'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleCopy(JSON.stringify(result, null, 2), 'footer-json')
              }
              className="px-3 py-2 bg-[#F4F3EF] dark:bg-zinc-800 hover:bg-zinc-200 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedField === 'footer-json' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                  <span>JSON Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white border-2 border-zinc-950 dark:border-[#B8FF01] text-xs font-bold flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#B8FF01]" />
              <span>Unduh JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
