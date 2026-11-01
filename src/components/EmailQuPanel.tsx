import React, { useState } from 'react';
import {
  Dices,
  Copy,
  Check,
  RefreshCw,
  Bell,
  Inbox,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  SlidersHorizontal,
  MailCheck,
  Loader2,
} from 'lucide-react';
import { composeEmailQuAddress, EmailQuMessage } from '../utils/amLogic';

interface EmailQuPanelProps {
  generatedEmail: string;
  domains: string[];
  messages: EmailQuMessage[];
  isGenerating: boolean;
  isPollingInbox: boolean;
  autoRefresh: boolean;
  latestNotification: EmailQuMessage | null;
  onGenerateNew: (customUser?: string, customDomain?: string) => void;
  onRefreshInbox: () => void;
  onToggleAutoRefresh: () => void;
  onSimulateIncomingMail: () => void;
  onUseMagicLinkFromMail: (magicLink: string, emailAddress: string) => void;
  onDismissNotification: () => void;
}

export const EmailQuPanel: React.FC<EmailQuPanelProps> = ({
  generatedEmail,
  domains,
  messages,
  isGenerating,
  isPollingInbox,
  autoRefresh,
  latestNotification,
  onGenerateNew,
  onRefreshInbox,
  onToggleAutoRefresh,
  onSimulateIncomingMail,
  onUseMagicLinkFromMail,
  onDismissNotification,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customUsername, setCustomUsername] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domains[0] || 'screensyit.id');
  const [expandedMailId, setExpandedMailId] = useState<string | number | null>(null);

  const handleCopyEmail = () => {
    if (!generatedEmail) return;
    navigator.clipboard.writeText(generatedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1800);
  };

  const handleApplyCustom = () => {
    const cleanUser = customUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUser) return;
    onGenerateNew(cleanUser, selectedDomain);
    setShowCustomBuilder(false);
  };

  return (
    <div className="border-2 border-zinc-950 dark:border-zinc-600 bg-[#F4F3EF] dark:bg-zinc-800/90 p-4 sm:p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-zinc-950 dark:border-zinc-600">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-700 dark:text-[#B8FF01]">
            <span>EMAILQU.COM GENERATOR</span>
            <span aria-hidden="true">·</span>
            <span>INBOX OTOMATIS</span>
          </div>
          <h3 className="font-display text-lg font-extrabold text-zinc-950 dark:text-white">
            Generator Email Random &amp; Notifikasi Langsung
          </h3>
        </div>

        <a
          href="https://emailqu.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-mono font-bold text-zinc-950 dark:text-white inline-flex items-center gap-1.5 brutal-btn"
        >
          <span>emailqu.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Generated Email Display Box */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-600 p-3.5 brutal-shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
          <span>ALAMAT EMAIL SEMENTARA AKTIF</span>
          <span>DOMAIN TERVERIFIKASI</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            data-testid="emailqu-active-address"
            className="font-mono text-base sm:text-lg font-bold text-zinc-950 dark:text-[#B8FF01] break-all select-all bg-[#F4F3EF] dark:bg-zinc-950 px-3 py-2 border-2 border-zinc-950 dark:border-zinc-600 flex-1"
          >
            {isGenerating ? 'Mengambil email dari emailqu.com...' : generatedEmail || 'Klik Acak Email Baru'}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyEmail}
              disabled={!generatedEmail || isGenerating}
              className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white inline-flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                  <span>Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onGenerateNew()}
              disabled={isGenerating}
              className="px-3.5 py-2 bg-[#B8FF01] hover:bg-[#a6e600] border-2 border-zinc-950 text-xs font-extrabold text-zinc-950 inline-flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Dices className="w-3.5 h-3.5" />
              )}
              <span>Acak Email Baru</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomBuilder((v) => !v)}
              aria-expanded={showCustomBuilder}
              className="px-3 py-2 bg-zinc-950 text-white border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold inline-flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B8FF01]" />
              <span>Kustom</span>
            </button>
          </div>
        </div>

        {/* Custom Username + Domain Drawer */}
        {showCustomBuilder && (
          <div className="pt-3 border-t-2 border-zinc-950 dark:border-zinc-700 grid grid-cols-1 sm:grid-cols-12 gap-2.5 animate-brutal-in">
            <div className="sm:col-span-5">
              <label htmlFor="custom-emailqu-user" className="block text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                USERNAME KUSTOM
              </label>
              <input
                id="custom-emailqu-user"
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="misal: van313pro"
                className="w-full px-3 py-2 bg-[#F4F3EF] dark:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-600 font-mono text-xs text-zinc-950 dark:text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="custom-emailqu-domain" className="block text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                PILIH DOMAIN EMAILQU
              </label>
              <select
                id="custom-emailqu-domain"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F3EF] dark:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-600 font-mono text-xs text-zinc-950 dark:text-white focus:outline-none"
              >
                {domains.map((dom) => (
                  <option key={dom} value={dom}>
                    @{dom}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="button"
                onClick={handleApplyCustom}
                disabled={!composeEmailQuAddress(customUsername, selectedDomain)}
                className="w-full py-2 px-3 bg-[#B8FF01] disabled:opacity-50 border-2 border-zinc-950 text-xs font-extrabold text-zinc-950 brutal-btn cursor-pointer"
              >
                Pakai Alamat Ini
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Incoming Email Notification Banner */}
      {latestNotification && (
        <div
          role="alert"
          data-testid="emailqu-live-notification"
          className="bg-[#B8FF01] border-2 border-zinc-950 p-4 brutal-shadow animate-brutal-in space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Bell className="w-5 h-5 text-zinc-950 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-mono font-extrabold text-zinc-900">
                  NOTIFIKASI EMAIL BARU DITERIMA · {new Date(latestNotification.received_at).toLocaleTimeString('id-ID')}
                </div>
                <p className="font-display text-sm font-extrabold text-zinc-950 mt-0.5">
                  {latestNotification.subject}
                </p>
                <p className="text-xs font-mono text-zinc-800">
                  Dari: {latestNotification.from}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismissNotification}
              className="px-2 py-0.5 bg-white border border-zinc-950 text-[11px] font-bold text-zinc-950 cursor-pointer"
            >
              Tutup
            </button>
          </div>

          {latestNotification.extractedMagicLink && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-950">
              <span className="text-xs font-mono font-bold text-zinc-900">
                Magic Link Alight Motion terdeteksi di dalam pesan!
              </span>
              <button
                type="button"
                onClick={() =>
                  onUseMagicLinkFromMail(
                    latestNotification.extractedMagicLink!,
                    generatedEmail
                  )
                }
                className="px-3.5 py-2 bg-zinc-950 text-[#B8FF01] border-2 border-zinc-950 text-xs font-extrabold inline-flex items-center gap-1.5 brutal-btn cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gunakan Magic Link &amp; Verifikasi Otomatis</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Inbox Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-600">
        <div className="px-4 py-3 bg-zinc-950 text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#B8FF01]" />
            <span className="font-display text-sm font-bold">
              Kotak Masuk Langsung ({messages.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleAutoRefresh}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-[#B8FF01] text-zinc-950 border-[#B8FF01]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}
            >
              Auto-Cek: {autoRefresh ? 'ON (5d)' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={onRefreshInbox}
              disabled={isPollingInbox || !generatedEmail}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 text-[11px] font-mono font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isPollingInbox ? 'animate-spin' : ''}`} />
              <span>Cek Inbox</span>
            </button>

            <button
              type="button"
              onClick={onSimulateIncomingMail}
              disabled={!generatedEmail}
              className="px-2.5 py-1 bg-white text-zinc-950 border border-zinc-950 text-[11px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <MailCheck className="w-3 h-3" />
              <span>Tes Notifikasi Masuk</span>
            </button>
          </div>
        </div>

        {/* Inbox Message List */}
        {messages.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="font-display text-sm font-bold text-zinc-900 dark:text-white">
              Belum Ada Pesan Masuk untuk {generatedEmail || 'Alamat Ini'}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
              Klik tombol <strong>Kirim Magic Link Sekarang</strong> di bawah untuk mengirim email Alight Motion ke alamat ini, atau klik <strong>Tes Notifikasi Masuk</strong> untuk mencoba simulasi penerimaan Magic Link secara instan.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-zinc-950 dark:divide-zinc-700">
            {messages.map((msg) => {
              const isExpanded = expandedMailId === msg.id;
              return (
                <div key={msg.id} className="p-3.5 space-y-2.5 hover:bg-[#F4F3EF] dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
                        Dari: <span className="font-semibold text-zinc-950 dark:text-white">{msg.from}</span> ·{' '}
                        {new Date(msg.received_at).toLocaleTimeString('id-ID')}
                      </div>
                      <div className="font-display text-sm font-extrabold text-zinc-950 dark:text-white truncate">
                        {msg.subject}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {msg.extractedMagicLink && (
                        <button
                          type="button"
                          onClick={() =>
                            onUseMagicLinkFromMail(msg.extractedMagicLink!, generatedEmail)
                          }
                          className="px-3 py-1.5 bg-[#B8FF01] border-2 border-zinc-950 text-xs font-extrabold text-zinc-950 inline-flex items-center gap-1 brutal-btn cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pakai Magic Link</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMailId(isExpanded ? null : msg.id)
                        }
                        className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Tutup' : 'Baca Isi'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 bg-white dark:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-600 font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all leading-relaxed">
                      {msg.body_text || msg.body_html || '(Tidak ada konten teks)'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
